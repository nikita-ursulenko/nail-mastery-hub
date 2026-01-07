/**
 * Контроллер для обработки платежей через Stripe
 */

import Stripe from 'stripe';
import { Response } from 'express';
import { AuthenticatedUserRequest } from '../middleware/userAuth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { Request } from 'express';

const pool = new Pool(getDatabaseConfig());

// Ленивая инициализация Stripe (создается только при первом использовании)
let stripeInstance: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY не установлен в .env');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripeInstance;
};

/**
 * Создать сессию оплаты (Checkout Session)
 */
export const createCheckoutSession = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const stripe = getStripe();
    const userId = req.user!.id;
    const { courseId, tariffId } = req.body;

    if (!courseId || !tariffId) {
      throw new AppError('Не указаны courseId или tariffId', 400);
    }

    // Проверяем, что курс существует и активен
    const courseResult = await pool.query(
      'SELECT id, title, slug FROM courses WHERE id = $1 AND is_active = TRUE',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      throw new AppError('Курс не найден', 404);
    }

    const course = courseResult.rows[0];

    // Проверяем, что тариф существует и активен
    const tariffResult = await pool.query(
      'SELECT id, name, price, tariff_type FROM course_tariffs WHERE id = $1 AND course_id = $2 AND is_active = TRUE',
      [tariffId, courseId]
    );

    if (tariffResult.rows.length === 0) {
      throw new AppError('Тариф не найден', 404);
    }

    const tariff = tariffResult.rows[0];

    // Проверяем, не куплен ли уже курс
    const existingEnrollment = await pool.query(
      'SELECT id, payment_status FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      const enrollment = existingEnrollment.rows[0];
      if (enrollment.payment_status === 'paid') {
        throw new AppError('Вы уже приобрели этот курс', 400);
      }
    }

    // Получаем URL фронтенда
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    // Создаем сессию в Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: course.title,
              description: `Тариф: ${tariff.name}`,
            },
            unit_amount: Math.round(parseFloat(tariff.price.toString()) * 100), // Цена в центах
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/courses/${course.slug}`,
      client_reference_id: `${userId}_${courseId}_${tariffId}`, // Для идентификации в webhook
      metadata: {
        userId: userId.toString(),
        courseId: courseId.toString(),
        tariffId: tariffId.toString(),
        courseTitle: course.title,
        tariffName: tariff.name,
      },
    });

    res.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  }
);

/**
 * Обработка webhook от Stripe
 */
export const handleWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET не настроен');
      return res.status(500).json({ error: 'Webhook secret не настроен' });
    }

    let event: Stripe.Event;

    try {
      // Проверяем подпись webhook
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Обрабатываем событие
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Проверяем, что платеж успешен
      if (session.payment_status === 'paid' && session.metadata) {
        const { userId, courseId, tariffId } = session.metadata;

        try {
          console.log(`📦 Webhook: Обработка платежа для пользователя ${userId}, курс ${courseId}, тариф ${tariffId}`);
          
          // Проверяем, не создан ли уже enrollment
          const existingEnrollment = await pool.query(
            'SELECT id, payment_status FROM enrollments WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
          );

          if (existingEnrollment.rows.length > 0) {
            // Обновляем существующий enrollment только если он еще не оплачен
            if (existingEnrollment.rows[0].payment_status !== 'paid') {
              await pool.query(
                `UPDATE enrollments 
                 SET payment_status = 'paid',
                     payment_id = $1,
                     amount_paid = (SELECT price FROM course_tariffs WHERE id = $2),
                     status = 'active',
                     purchased_at = NOW(),
                     started_at = NOW(),
                     updated_at = NOW()
                 WHERE user_id = $3 AND course_id = $4`,
                [session.payment_intent || session.id, tariffId, userId, courseId]
              );
              console.log(`✅ Webhook: Enrollment обновлен для пользователя ${userId}, курс ${courseId}`);
            } else {
              console.log(`ℹ️  Webhook: Enrollment уже оплачен для пользователя ${userId}, курс ${courseId}`);
            }
          } else {
            // Получаем количество уроков для расчета total_lessons
            const lessonsResult = await pool.query(
              `SELECT COUNT(*) as total
               FROM course_lessons cl
               JOIN course_modules cm ON cl.module_id = cm.id
               WHERE cm.course_id = $1`,
              [courseId]
            );

            const totalLessons = parseInt(lessonsResult.rows[0]?.total || '0');

            // Создаем новый enrollment
            await pool.query(
              `INSERT INTO enrollments (
                user_id, course_id, tariff_id,
                payment_id, payment_status, amount_paid,
                status, purchased_at, started_at, total_lessons
              ) VALUES ($1, $2, $3, $4, 'paid', $5, 'active', NOW(), NOW(), $6)
              ON CONFLICT (user_id, course_id) 
              DO UPDATE SET
                payment_status = 'paid',
                payment_id = EXCLUDED.payment_id,
                amount_paid = EXCLUDED.amount_paid,
                status = 'active',
                purchased_at = NOW(),
                started_at = NOW(),
                updated_at = NOW()`,
              [
                userId,
                courseId,
                tariffId,
                session.payment_intent || session.id,
                session.amount_total ? session.amount_total / 100 : null, // Конвертируем из центов
                totalLessons,
              ]
            );
          }
        } catch (error) {
          console.error('❌ Ошибка при создании enrollment в webhook:', error);
          // Не возвращаем ошибку, чтобы Stripe не повторял webhook
        }
      }
    }

    res.json({ received: true });
  }
);

/**
 * Проверить статус платежа и активировать доступ, если нужно
 */
export const getPaymentStatus = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const stripe = getStripe();
    const userId = req.user!.id;
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new AppError('Session ID не указан', 400);
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Если платеж успешен, проверяем и активируем доступ
      if (session.payment_status === 'paid' && session.metadata) {
        const { userId: metadataUserId, courseId, tariffId } = session.metadata;

        // Проверяем, что это запрос от правильного пользователя
        if (parseInt(metadataUserId) !== userId) {
          throw new AppError('Недостаточно прав', 403);
        }

        // Проверяем, существует ли enrollment
        const enrollmentResult = await pool.query(
          'SELECT id, payment_status FROM enrollments WHERE user_id = $1 AND course_id = $2',
          [userId, courseId]
        );

        // Если enrollment не существует или не оплачен, создаем/обновляем его
        if (enrollmentResult.rows.length === 0 || enrollmentResult.rows[0].payment_status !== 'paid') {
          console.log(`🔄 Активация доступа для пользователя ${userId}, курс ${courseId} (fallback, webhook не сработал)`);
          
          // Получаем количество уроков
          const lessonsResult = await pool.query(
            `SELECT COUNT(*) as total
             FROM course_lessons cl
             JOIN course_modules cm ON cl.module_id = cm.id
             WHERE cm.course_id = $1`,
            [courseId]
          );

          const totalLessons = parseInt(lessonsResult.rows[0]?.total || '0');

          if (enrollmentResult.rows.length > 0) {
            // Обновляем существующий enrollment
            await pool.query(
              `UPDATE enrollments 
               SET payment_status = 'paid',
                   payment_id = $1,
                   amount_paid = (SELECT price FROM course_tariffs WHERE id = $2),
                   status = 'active',
                   purchased_at = NOW(),
                   started_at = NOW(),
                   updated_at = NOW()
               WHERE user_id = $3 AND course_id = $4`,
              [session.payment_intent || session.id, tariffId, userId, courseId]
            );
            console.log(`✅ Enrollment обновлен для пользователя ${userId}, курс ${courseId}`);
          } else {
            // Создаем новый enrollment
            await pool.query(
              `INSERT INTO enrollments (
                user_id, course_id, tariff_id,
                payment_id, payment_status, amount_paid,
                status, purchased_at, started_at, total_lessons
              ) VALUES ($1, $2, $3, $4, 'paid', $5, 'active', NOW(), NOW(), $6)
              ON CONFLICT (user_id, course_id) 
              DO UPDATE SET
                payment_status = 'paid',
                payment_id = EXCLUDED.payment_id,
                amount_paid = EXCLUDED.amount_paid,
                status = 'active',
                purchased_at = NOW(),
                started_at = NOW(),
                updated_at = NOW()`,
              [
                userId,
                courseId,
                tariffId,
                session.payment_intent || session.id,
                session.amount_total ? session.amount_total / 100 : null,
                totalLessons,
              ]
            );
            console.log(`✅ Enrollment создан для пользователя ${userId}, курс ${courseId}`);
          }
        }
      }

      res.json({
        status: session.payment_status,
        sessionId: session.id,
        customerEmail: session.customer_email,
        enrollmentActivated: session.payment_status === 'paid',
      });
    } catch (error: any) {
      console.error('Ошибка при проверке статуса платежа:', error);
      throw new AppError(error.message || 'Ошибка при проверке статуса платежа', 500);
    }
  }
);

