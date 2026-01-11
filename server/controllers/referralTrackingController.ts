import { Request, Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validateReferralCode } from '../utils/referralCodeGenerator';
import { notifyRegistration } from '../utils/referralNotifications';

const pool = new Pool(getDatabaseConfig());

interface TrackVisitBody {
  referral_code: string;
  visitor_ip?: string;
  visitor_user_agent?: string;
}

interface TrackRegistrationBody {
  referral_code: string;
  user_id: number;
}

/**
 * Отслеживание первого посещения по реферальной ссылке
 * Начисляет 0.1€ за первое посещение
 */
export const trackVisit = asyncHandler(async (req: Request<{}, {}, TrackVisitBody>, res: Response) => {
  const { referral_code, visitor_ip, visitor_user_agent } = req.body;

  if (!referral_code) {
    throw new AppError('Реферальный код обязателен', 400);
  }

  // Валидация формата кода
  if (!validateReferralCode(referral_code)) {
    throw new AppError('Неверный формат реферального кода', 400);
  }

  // Получаем IP и User-Agent из запроса, если не переданы
  const ip = visitor_ip || req.ip || req.socket.remoteAddress || '';
  const userAgent = visitor_user_agent || req.get('user-agent') || '';

  // Находим партнера по коду
  const partnerResult = await pool.query(
    'SELECT id, is_active FROM referral_partners WHERE referral_code = $1',
    [referral_code]
  );

  if (partnerResult.rows.length === 0) {
    throw new AppError('Реферальный код не найден', 404);
  }

  const partner = partnerResult.rows[0];

  if (!partner.is_active) {
    throw new AppError('Партнер неактивен', 403);
  }

  // Проверяем, не было ли уже посещения с этого IP и User-Agent за последние 24 часа
  // (защита от дублирования начислений)
  const recentVisit = await pool.query(
    `SELECT id FROM referral_tracking 
     WHERE partner_id = $1 
       AND visitor_ip = $2 
       AND visitor_user_agent = $3 
       AND visited_at > NOW() - INTERVAL '24 hours'`,
    [partner.id, ip, userAgent]
  );

  if (recentVisit.rows.length > 0) {
    // Уже было посещение, просто возвращаем успех без начисления
    return res.json({
      success: true,
      message: 'Посещение уже зарегистрировано',
      already_tracked: true,
    });
  }

  // Создаем запись отслеживания
  const trackingResult = await pool.query(
    `INSERT INTO referral_tracking (partner_id, visitor_ip, visitor_user_agent, status)
     VALUES ($1, $2, $3, 'visited')
     RETURNING id`,
    [partner.id, ip, userAgent]
  );

  const trackingId = trackingResult.rows[0].id;

  // Начисляем 0.1€ за посещение
  const rewardAmount = 0.1;

  await pool.query('BEGIN');

  try {
    // Создаем запись о начислении
    await pool.query(
      `INSERT INTO referral_rewards (partner_id, tracking_id, reward_type, amount, status, description)
       VALUES ($1, $2, 'visit', $3, 'approved', 'Начисление за первое посещение по реферальной ссылке')`,
      [partner.id, trackingId, rewardAmount]
    );

    // Обновляем баланс партнера
    await pool.query(
      `UPDATE referral_partners 
       SET total_earnings = total_earnings + $1,
           current_balance = current_balance + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [rewardAmount, partner.id]
    );

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'Посещение зарегистрировано',
      reward: rewardAmount,
      already_tracked: false,
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
});

/**
 * Отслеживание регистрации пользователя по реферальной ссылке
 * Начисляет 0.5€ за регистрацию
 */
export const trackRegistration = asyncHandler(async (req: Request<{}, {}, TrackRegistrationBody>, res: Response) => {
  const { referral_code, user_id } = req.body;

  if (!referral_code || !user_id) {
    throw new AppError('Реферальный код и ID пользователя обязательны', 400);
  }

  // Валидация формата кода
  if (!validateReferralCode(referral_code)) {
    throw new AppError('Неверный формат реферального кода', 400);
  }

  // Находим партнера по коду
  const partnerResult = await pool.query(
    'SELECT id, is_active FROM referral_partners WHERE referral_code = $1',
    [referral_code]
  );

  if (partnerResult.rows.length === 0) {
    throw new AppError('Реферальный код не найден', 404);
  }

  const partner = partnerResult.rows[0];

  if (!partner.is_active) {
    throw new AppError('Партнер неактивен', 403);
  }

  // Проверяем, не зарегистрирован ли уже этот пользователь по другой ссылке
  const existingTracking = await pool.query(
    'SELECT id, partner_id FROM referral_tracking WHERE user_id = $1 AND status IN ($2, $3)',
    [user_id, 'registered', 'purchased']
  );

  if (existingTracking.rows.length > 0) {
    // Пользователь уже был привязан к другому партнеру
    return res.json({
      success: false,
      message: 'Пользователь уже был зарегистрирован по другой реферальной ссылке',
      already_registered: true,
    });
  }

  // Ищем запись отслеживания для этого пользователя (если было посещение)
  const trackingResult = await pool.query(
    `SELECT id FROM referral_tracking 
     WHERE partner_id = $1 AND user_id IS NULL 
     ORDER BY visited_at DESC LIMIT 1`,
    [partner.id]
  );

  let trackingId: number;

  if (trackingResult.rows.length > 0) {
    // Обновляем существующую запись
    trackingId = trackingResult.rows[0].id;
    await pool.query(
      `UPDATE referral_tracking 
       SET user_id = $1, registered_at = CURRENT_TIMESTAMP, status = 'registered', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [user_id, trackingId]
    );
  } else {
    // Создаем новую запись
    const newTracking = await pool.query(
      `INSERT INTO referral_tracking (partner_id, user_id, registered_at, status)
       VALUES ($1, $2, CURRENT_TIMESTAMP, 'registered')
       RETURNING id`,
      [partner.id, user_id]
    );
    trackingId = newTracking.rows[0].id;
  }

  // Начисляем 0.5€ за регистрацию
  const rewardAmount = 0.5;

  await pool.query('BEGIN');

  try {
    // Создаем запись о начислении
    await pool.query(
      `INSERT INTO referral_rewards (partner_id, tracking_id, user_id, reward_type, amount, status, description)
       VALUES ($1, $2, $3, 'registration', $4, 'approved', 'Начисление за регистрацию пользователя по реферальной ссылке')`,
      [partner.id, trackingId, user_id, rewardAmount]
    );

    // Обновляем баланс партнера
    await pool.query(
      `UPDATE referral_partners 
       SET total_earnings = total_earnings + $1,
           current_balance = current_balance + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [rewardAmount, partner.id]
    );

    await pool.query('COMMIT');

    // Получаем email пользователя для уведомления
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]);
    const userEmail = userResult.rows[0]?.email || 'новый пользователь';

    // Создаем уведомление о регистрации
    await notifyRegistration(partner.id, user_id, userEmail);

    res.json({
      success: true,
      message: 'Регистрация зарегистрирована',
      reward: rewardAmount,
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
});
