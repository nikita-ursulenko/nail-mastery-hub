import { Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { ReferralAuthRequest } from '../middleware/referralAuth';
import { calculatePartnerLevel } from '../utils/referralLevel';

const pool = new Pool(getDatabaseConfig());

/**
 * Получение общей статистики партнера
 */
export const getDashboardStats = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  // Получаем базовую информацию о партнере
  const partnerResult = await pool.query(
    `SELECT id, referral_code, total_earnings, current_balance, withdrawn_amount, level
     FROM referral_partners WHERE id = $1`,
    [partnerId]
  );

  if (partnerResult.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  const partner = partnerResult.rows[0];

  // Статистика посещений (считаем все записи с visited_at, независимо от статуса)
  const visitsResult = await pool.query(
    `SELECT COUNT(*) as total, 
            COUNT(DISTINCT visitor_ip) as unique_visits
     FROM referral_tracking 
     WHERE partner_id = $1 AND visited_at IS NOT NULL`,
    [partnerId]
  );

  // Статистика регистраций
  const registrationsResult = await pool.query(
    `SELECT COUNT(*) as total
     FROM referral_tracking 
     WHERE partner_id = $1 AND status IN ('registered', 'purchased')`,
    [partnerId]
  );

  // Статистика покупок
  const purchasesResult = await pool.query(
    `SELECT COUNT(*) as total, 
            COALESCE(SUM(e.amount_paid), 0) as total_amount,
            COALESCE(AVG(e.amount_paid), 0) as avg_amount
     FROM referral_tracking rt
     JOIN enrollments e ON rt.user_id = e.user_id
     WHERE rt.partner_id = $1 AND rt.status = 'purchased' AND e.payment_status = 'paid'`,
    [partnerId]
  );

  // Статистика начислений
  const rewardsResult = await pool.query(
    `SELECT 
       COUNT(*) as total,
       COALESCE(SUM(CASE WHEN reward_type = 'visit' THEN amount ELSE 0 END), 0) as visit_rewards,
       COALESCE(SUM(CASE WHEN reward_type = 'registration' THEN amount ELSE 0 END), 0) as registration_rewards,
       COALESCE(SUM(CASE WHEN reward_type = 'purchase' THEN amount ELSE 0 END), 0) as purchase_rewards,
       COALESCE(SUM(amount), 0) as total_rewards
     FROM referral_rewards
     WHERE partner_id = $1`,
    [partnerId]
  );

  // Запросы на вывод в обработке
  const pendingWithdrawalsResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as pending_amount
     FROM referral_withdrawals
     WHERE partner_id = $1 AND status = 'pending'`,
    [partnerId]
  );

  const visits = parseInt(visitsResult.rows[0].total) || 0;
  const uniqueVisits = parseInt(visitsResult.rows[0].unique_visits) || 0;
  const registrations = parseInt(registrationsResult.rows[0].total) || 0;
  const purchases = parseInt(purchasesResult.rows[0].total) || 0;
  const totalPurchaseAmount = parseFloat(purchasesResult.rows[0].total_amount) || 0;
  const avgPurchaseAmount = parseFloat(purchasesResult.rows[0].avg_amount) || 0;
  const pendingWithdrawals = parseFloat(pendingWithdrawalsResult.rows[0].pending_amount) || 0;

  // Конверсии
  const registrationConversion = visits > 0 ? (registrations / visits) * 100 : 0;
  const purchaseConversion = registrations > 0 ? (purchases / registrations) * 100 : 0;

  res.json({
    partner: {
      referral_code: partner.referral_code,
      level: partner.level,
    },
    stats: {
      visits: {
        total: visits,
        unique: uniqueVisits,
      },
      registrations: {
        total: registrations,
        conversion: parseFloat(registrationConversion.toFixed(2)),
      },
      purchases: {
        total: purchases,
        total_amount: totalPurchaseAmount,
        avg_amount: parseFloat(avgPurchaseAmount.toFixed(2)),
        conversion: parseFloat(purchaseConversion.toFixed(2)),
      },
      rewards: {
        visit: parseFloat(rewardsResult.rows[0].visit_rewards),
        registration: parseFloat(rewardsResult.rows[0].registration_rewards),
        purchase: parseFloat(rewardsResult.rows[0].purchase_rewards),
        total: parseFloat(rewardsResult.rows[0].total_rewards),
      },
      balance: {
        total_earnings: parseFloat(partner.total_earnings),
        current_balance: parseFloat(partner.current_balance),
        withdrawn: parseFloat(partner.withdrawn_amount),
        pending: pendingWithdrawals,
      },
    },
  });
});

/**
 * Получение реферальной ссылки
 */
export const getReferralLink = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  const result = await pool.query(
    'SELECT referral_code FROM referral_partners WHERE id = $1',
    [partnerId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  // Получаем базовый URL из переменной окружения (frontend URL)
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  const referralLink = `${baseUrl}/?ref=${result.rows[0].referral_code}`;

  res.json({
    referral_code: result.rows[0].referral_code,
    referral_link: referralLink,
  });
});

/**
 * Получение истории начислений с фильтрацией
 */
export const getRewardsHistory = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { reward_type, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT id, reward_type, amount, status, description, created_at
    FROM referral_rewards
    WHERE partner_id = $1
  `;
  const params: any[] = [partnerId];
  let paramIndex = 2;

  if (reward_type) {
    query += ` AND reward_type = $${paramIndex}`;
    params.push(reward_type);
    paramIndex++;
  }

  if (status) {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (start_date) {
    query += ` AND created_at >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    query += ` AND created_at <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit as string), parseInt(offset as string));

  // Получаем общее количество для пагинации
  let countQuery = `SELECT COUNT(*) as total FROM referral_rewards WHERE partner_id = $1`;
  const countParams: any[] = [partnerId];
  let countParamIndex = 2;

  if (reward_type) {
    countQuery += ` AND reward_type = $${countParamIndex}`;
    countParams.push(reward_type);
    countParamIndex++;
  }

  if (status) {
    countQuery += ` AND status = $${countParamIndex}`;
    countParams.push(status);
    countParamIndex++;
  }

  if (start_date) {
    countQuery += ` AND created_at >= $${countParamIndex}`;
    countParams.push(start_date);
    countParamIndex++;
  }

  if (end_date) {
    countQuery += ` AND created_at <= $${countParamIndex}`;
    countParams.push(end_date);
  }

  const [result, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams),
  ]);

  const total = parseInt(countResult.rows[0].total) || 0;

  res.json({
    rewards: result.rows.map((row) => ({
      id: row.id,
      reward_type: row.reward_type,
      amount: parseFloat(row.amount),
      status: row.status,
      description: row.description,
      created_at: row.created_at,
    })),
    total,
  });
});

/**
 * Получение списка рефералов (email частично скрыт)
 */
export const getReferralsList = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  const result = await pool.query(
    `SELECT 
       rt.user_id,
       rt.status,
       rt.registered_at,
       u.email,
       COALESCE(SUM(e.amount_paid), 0) as total_purchases
     FROM referral_tracking rt
     LEFT JOIN users u ON rt.user_id = u.id
     LEFT JOIN enrollments e ON rt.user_id = e.user_id AND e.payment_status = 'paid'
     WHERE rt.partner_id = $1 AND rt.user_id IS NOT NULL
     GROUP BY rt.user_id, rt.status, rt.registered_at, u.email
     ORDER BY rt.registered_at DESC`,
    [partnerId]
  );

  // Функция для скрытия email
  const maskEmail = (email: string): string => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visibleChars = Math.min(3, local.length);
    const masked = local.substring(0, visibleChars) + '***';
    return `${masked}@${domain}`;
  };

  res.json({
    referrals: result.rows.map((row) => ({
      user_id: row.user_id,
      email: maskEmail(row.email),
      status: row.status,
      registered_at: row.registered_at,
      total_purchases: parseFloat(row.total_purchases),
    })),
  });
});

/**
 * Получение уровня партнера
 */
export const getPartnerLevel = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  // Получаем количество рефералов и общий заработок
  const statsResult = await pool.query(
    `SELECT 
       COUNT(DISTINCT rt.user_id) as referrals_count,
       COALESCE(rp.total_earnings, 0) as total_earnings
     FROM referral_partners rp
     LEFT JOIN referral_tracking rt ON rp.id = rt.partner_id AND rt.user_id IS NOT NULL
     WHERE rp.id = $1
     GROUP BY rp.id, rp.total_earnings`,
    [partnerId]
  );

  if (statsResult.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  const referralsCount = parseInt(statsResult.rows[0].referrals_count) || 0;
  const totalEarnings = parseFloat(statsResult.rows[0].total_earnings) || 0;

  const level = calculatePartnerLevel(referralsCount, totalEarnings);

  // Обновляем уровень в БД, если изменился
  await pool.query(
    'UPDATE referral_partners SET level = $1 WHERE id = $2',
    [level, partnerId]
  );

  res.json({
    level,
    referrals_count: referralsCount,
    total_earnings: totalEarnings,
  });
});
