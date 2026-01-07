import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

// Получить курсы пользователя
export const getUserEnrollments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  
  const result = await pool.query(
    `SELECT 
      e.id as enrollment_id,
      e.status,
      e.progress_percent,
      e.lessons_completed,
      e.total_lessons,
      e.purchased_at,
      e.payment_status,
      e.amount_paid,
      c.id as course_id,
      c.slug,
      c.title,
      c.subtitle,
      c.image_url,
      c.image_upload_path,
      ct.id as tariff_id,
      ct.name as tariff_name,
      ct.tariff_type,
      ct.price
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN course_tariffs ct ON e.tariff_id = ct.id
    WHERE e.user_id = $1
    ORDER BY e.purchased_at DESC`,
    [userId]
  );

  const enrollments = result.rows.map((row: any) => ({
    enrollment_id: row.enrollment_id,
    status: row.status,
    progress_percent: row.progress_percent,
    lessons_completed: row.lessons_completed,
    total_lessons: row.total_lessons,
    purchased_at: row.purchased_at,
    payment_status: row.payment_status,
    amount_paid: row.amount_paid,
    course: {
      id: row.course_id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      image_url: (() => {
        if (row.image_upload_path) {
          // Если путь уже полный (начинается с /uploads/), используем как есть
          if (row.image_upload_path.startsWith('/uploads/')) {
            return row.image_upload_path;
          }
          // Если путь неполный (только имя файла), добавляем префикс /uploads/
          return `/uploads/${row.image_upload_path}`;
        }
        return row.image_url || null;
      })(),
    },
    tariff: {
      id: row.tariff_id,
      name: row.tariff_name,
      type: row.tariff_type,
      price: row.price,
    },
  }));

  res.json({ enrollments });
});

// Добавить курс пользователю
export const addUserEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { courseId, tariffId } = req.body;

  if (!courseId || !tariffId) {
    throw new AppError('courseId и tariffId обязательны', 400);
  }

  // Проверяем, что пользователь существует
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверяем, что курс и тариф существуют
  const courseCheck = await pool.query(
    'SELECT id FROM courses WHERE id = $1 AND is_active = TRUE',
    [courseId]
  );
  if (courseCheck.rows.length === 0) {
    throw new AppError('Курс не найден', 404);
  }

  const tariffCheck = await pool.query(
    'SELECT id, price FROM course_tariffs WHERE id = $1 AND course_id = $2 AND is_active = TRUE',
    [tariffId, courseId]
  );
  if (tariffCheck.rows.length === 0) {
    throw new AppError('Тариф не найден', 404);
  }

  const tariff = tariffCheck.rows[0];

  // Проверяем, не существует ли уже enrollment
  const existingEnrollment = await pool.query(
    'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );

  // Получаем количество уроков
  const lessonsResult = await pool.query(
    `SELECT COUNT(*) as total
     FROM course_lessons cl
     JOIN course_modules cm ON cl.module_id = cm.id
     WHERE cm.course_id = $1`,
    [courseId]
  );
  const totalLessons = parseInt(lessonsResult.rows[0]?.total || '0');

  if (existingEnrollment.rows.length > 0) {
    // Обновляем существующий enrollment
    await pool.query(
      `UPDATE enrollments 
       SET tariff_id = $1,
           payment_status = 'paid',
           amount_paid = $2,
           status = 'active',
           purchased_at = NOW(),
           started_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $3 AND course_id = $4`,
      [tariffId, tariff.price, userId, courseId]
    );
  } else {
    // Создаем новый enrollment
    await pool.query(
      `INSERT INTO enrollments (
        user_id, course_id, tariff_id,
        payment_status, amount_paid,
        status, purchased_at, started_at, total_lessons
      ) VALUES ($1, $2, $3, 'paid', $4, 'active', NOW(), NOW(), $5)`,
      [userId, courseId, tariffId, tariff.price, totalLessons]
    );
  }

  res.json({ message: 'Курс успешно добавлен пользователю' });
});

// Удалить курс у пользователя
export const removeUserEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, enrollmentId } = req.params;

  // Проверяем, что enrollment принадлежит пользователю
  const enrollmentCheck = await pool.query(
    'SELECT id FROM enrollments WHERE id = $1 AND user_id = $2',
    [enrollmentId, userId]
  );
  if (enrollmentCheck.rows.length === 0) {
    throw new AppError('Запись на курс не найдена', 404);
  }

  await pool.query('DELETE FROM enrollments WHERE id = $1', [enrollmentId]);

  res.json({ message: 'Курс успешно удален у пользователя' });
});

// Изменить тариф курса пользователя
export const updateUserEnrollmentTariff = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, enrollmentId } = req.params;
  const { tariffId } = req.body;

  if (!tariffId) {
    throw new AppError('tariffId обязателен', 400);
  }

  // Проверяем, что enrollment принадлежит пользователю
  const enrollmentCheck = await pool.query(
    'SELECT course_id FROM enrollments WHERE id = $1 AND user_id = $2',
    [enrollmentId, userId]
  );
  if (enrollmentCheck.rows.length === 0) {
    throw new AppError('Запись на курс не найдена', 404);
  }

  const courseId = enrollmentCheck.rows[0].course_id;

  // Проверяем, что тариф существует и принадлежит курсу
  const tariffCheck = await pool.query(
    'SELECT id, price FROM course_tariffs WHERE id = $1 AND course_id = $2 AND is_active = TRUE',
    [tariffId, courseId]
  );
  if (tariffCheck.rows.length === 0) {
    throw new AppError('Тариф не найден', 404);
  }

  const tariff = tariffCheck.rows[0];

  // Обновляем тариф
  await pool.query(
    `UPDATE enrollments 
     SET tariff_id = $1,
         amount_paid = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [tariffId, tariff.price, enrollmentId]
  );

  res.json({ message: 'Тариф успешно изменен' });
});

