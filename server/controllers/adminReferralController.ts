import { Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { notifyWithdrawalStatusChange } from '../utils/referralNotifications';

const pool = new Pool(getDatabaseConfig());

/**
 * Получение общей статистики реферальной системы
 */
export const getReferralStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Общая статистика партнеров
  const partnersResult = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_active = TRUE) as active,
      COUNT(*) FILTER (WHERE is_active = FALSE) as inactive,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_period
     FROM referral_partners`
  );

  // Статистика посещений (считаем все записи с visited_at, независимо от статуса)
  const visitsResult = await pool.query(
    `SELECT COUNT(*) as total FROM referral_tracking WHERE visited_at IS NOT NULL`
  );

  // Статистика регистраций
  const registrationsResult = await pool.query(
    `SELECT COUNT(*) as total FROM referral_tracking WHERE status IN ('registered', 'purchased')`
  );

  // Статистика покупок
  const purchasesResult = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COALESCE(AVG(e.amount_paid), 0) as avg_amount
     FROM referral_tracking rt
     JOIN enrollments e ON rt.user_id = e.user_id
     WHERE rt.status = 'purchased' AND e.payment_status = 'paid'`
  );

  // Статистика начислений
  const rewardsResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM referral_rewards`
  );

  // Статистика выплат
  const withdrawalsResult = await pool.query(
    `SELECT 
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total,
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending
     FROM referral_withdrawals`
  );

  const totalVisits = parseInt(visitsResult.rows[0].total) || 0;
  const totalRegistrations = parseInt(registrationsResult.rows[0].total) || 0;
  const totalPurchases = parseInt(purchasesResult.rows[0].total) || 0;
  const avgPurchaseAmount = parseFloat(purchasesResult.rows[0].avg_amount) || 0;

  // Конверсии
  const registrationsToVisits = totalVisits > 0 ? (totalRegistrations / totalVisits) * 100 : 0;
  const purchasesToRegistrations = totalRegistrations > 0 ? (totalPurchases / totalRegistrations) * 100 : 0;
  const purchasesToVisits = totalVisits > 0 ? (totalPurchases / totalVisits) * 100 : 0;

  res.json({
    total_partners: parseInt(partnersResult.rows[0].total) || 0,
    active_partners: parseInt(partnersResult.rows[0].active) || 0,
    inactive_partners: parseInt(partnersResult.rows[0].inactive) || 0,
    new_partners_period: parseInt(partnersResult.rows[0].new_period) || 0,
    total_visits: totalVisits,
    total_registrations: totalRegistrations,
    total_purchases: totalPurchases,
    avg_purchase_amount: parseFloat(avgPurchaseAmount.toFixed(2)),
    total_rewards: parseFloat(rewardsResult.rows[0].total) || 0,
    total_withdrawals: parseFloat(withdrawalsResult.rows[0].total) || 0,
    pending_withdrawals: parseFloat(withdrawalsResult.rows[0].pending) || 0,
    conversions: {
      registrations_to_visits: parseFloat(registrationsToVisits.toFixed(2)),
      purchases_to_registrations: parseFloat(purchasesToRegistrations.toFixed(2)),
      purchases_to_visits: parseFloat(purchasesToVisits.toFixed(2)),
    },
  });
});

/**
 * Получение списка партнеров
 */
export const getReferralPartners = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, status, limit, offset } = req.query;

  const pageLimit = limit ? parseInt(limit as string) : 100;
  const pageOffset = offset ? parseInt(offset as string) : 0;

  let query = `
    SELECT id, name, email, referral_code, phone, 
           current_balance, total_earnings, withdrawn_amount,
           is_active, level, created_at
    FROM referral_partners
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (
      LOWER(name) LIKE $${paramIndex} OR 
      LOWER(email) LIKE $${paramIndex} OR 
      LOWER(referral_code) LIKE $${paramIndex}
    )`;
    params.push(`%${(search as string).toLowerCase()}%`);
    paramIndex++;
  }

  if (status && status !== 'all') {
    query += ` AND is_active = $${paramIndex}`;
    params.push(status === 'active');
    paramIndex++;
  }

  // Получаем общее количество
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Добавляем ORDER BY, LIMIT и OFFSET
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageLimit, pageOffset);

  const result = await pool.query(query, params);

  res.json({ partners: result.rows, total });
});

/**
 * Получение статистики конкретного партнера
 */
export const getPartnerStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const partnerId = parseInt(id);

  if (!partnerId) {
    throw new AppError('Неверный ID партнера', 400);
  }

  // Базовая информация о партнере
  const partnerResult = await pool.query(
    `SELECT id, name, email, referral_code, phone, telegram_tag,
            current_balance, total_earnings, withdrawn_amount,
            is_active, level, created_at
     FROM referral_partners WHERE id = $1`,
    [partnerId]
  );

  if (partnerResult.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  const partner = partnerResult.rows[0];

  // Статистика посещений (считаем все записи с visited_at, независимо от статуса)
  const visitsResult = await pool.query(
    `SELECT COUNT(*) as total, COUNT(DISTINCT visitor_ip) as unique_visits
     FROM referral_tracking WHERE partner_id = $1 AND visited_at IS NOT NULL`,
    [partnerId]
  );

  // Статистика регистраций
  const registrationsResult = await pool.query(
    `SELECT COUNT(*) as total FROM referral_tracking 
     WHERE partner_id = $1 AND status IN ('registered', 'purchased')`,
    [partnerId]
  );

  // Статистика покупок
  const purchasesResult = await pool.query(
    `SELECT COUNT(*) as total, COALESCE(SUM(e.amount_paid), 0) as total_amount,
            COALESCE(AVG(e.amount_paid), 0) as avg_amount
     FROM referral_tracking rt
     JOIN enrollments e ON rt.user_id = e.user_id
     WHERE rt.partner_id = $1 AND rt.status = 'purchased' AND e.payment_status = 'paid'`,
    [partnerId]
  );

  // Список рефералов
  const referralsResult = await pool.query(
    `SELECT rt.user_id, rt.status, rt.registered_at,
            u.email, COALESCE(SUM(e.amount_paid), 0) as total_purchases
     FROM referral_tracking rt
     LEFT JOIN users u ON rt.user_id = u.id
     LEFT JOIN enrollments e ON rt.user_id = e.user_id AND e.payment_status = 'paid'
     WHERE rt.partner_id = $1 AND rt.status IN ('registered', 'purchased')
     GROUP BY rt.user_id, rt.status, rt.registered_at, u.email
     ORDER BY rt.registered_at DESC`,
    [partnerId]
  );

  const visits = parseInt(visitsResult.rows[0].total) || 0;
  const uniqueVisits = parseInt(visitsResult.rows[0].unique_visits) || 0;
  const registrations = parseInt(registrationsResult.rows[0].total) || 0;
  const purchases = parseInt(purchasesResult.rows[0].total) || 0;

  res.json({
    partner,
    visits: {
      total: visits,
      unique: uniqueVisits,
    },
    registrations: {
      total: registrations,
      conversion: visits > 0 ? parseFloat(((registrations / visits) * 100).toFixed(2)) : 0,
    },
    purchases: {
      total: purchases,
      total_amount: parseFloat(purchasesResult.rows[0].total_amount) || 0,
      avg_amount: parseFloat(purchasesResult.rows[0].avg_amount) || 0,
      conversion: registrations > 0 ? parseFloat(((purchases / registrations) * 100).toFixed(2)) : 0,
    },
    referrals: referralsResult.rows,
  });
});

/**
 * Начисление средств партнеру
 */
export const addPartnerFunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount, description } = req.body;
  const adminId = req.admin!.id;

  if (!amount || amount <= 0) {
    throw new AppError('Сумма должна быть больше нуля', 400);
  }

  if (!description) {
    throw new AppError('Описание обязательно', 400);
  }

  const partnerId = parseInt(id);
  if (!partnerId) {
    throw new AppError('Неверный ID партнера', 400);
  }

  await pool.query('BEGIN');

  try {
    // Создаем запись о начислении
    await pool.query(
      `INSERT INTO referral_rewards 
       (partner_id, reward_type, amount, status, description, approved_at)
       VALUES ($1, 'manual', $2, 'approved', $3, NOW())`,
      [partnerId, amount, description]
    );

    // Обновляем баланс партнера
    await pool.query(
      `UPDATE referral_partners 
       SET total_earnings = total_earnings + $1,
           current_balance = current_balance + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, partnerId]
    );

    await pool.query('COMMIT');

    res.json({ success: true, message: 'Средства начислены' });
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
});

/**
 * Списание средств у партнера
 */
export const removePartnerFunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount, description } = req.body;
  const adminId = req.admin!.id;

  if (!amount || amount <= 0) {
    throw new AppError('Сумма должна быть больше нуля', 400);
  }

  if (!description) {
    throw new AppError('Описание обязательно', 400);
  }

  const partnerId = parseInt(id);
  if (!partnerId) {
    throw new AppError('Неверный ID партнера', 400);
  }

  // Проверяем баланс
  const partnerResult = await pool.query(
    'SELECT current_balance FROM referral_partners WHERE id = $1',
    [partnerId]
  );

  if (partnerResult.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  const currentBalance = parseFloat(partnerResult.rows[0].current_balance);
  if (currentBalance < amount) {
    throw new AppError('Недостаточно средств на балансе', 400);
  }

  await pool.query('BEGIN');

  try {
    // Создаем запись о списании (отрицательная сумма)
    await pool.query(
      `INSERT INTO referral_rewards 
       (partner_id, reward_type, amount, status, description, approved_at)
       VALUES ($1, 'manual', -$2, 'approved', $3, NOW())`,
      [partnerId, amount, description]
    );

    // Обновляем баланс партнера
    await pool.query(
      `UPDATE referral_partners 
       SET current_balance = current_balance - $1,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, partnerId]
    );

    await pool.query('COMMIT');

    res.json({ success: true, message: 'Средства списаны' });
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
});

/**
 * Переключение статуса партнера (активен/заблокирован)
 */
export const togglePartnerStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const partnerId = parseInt(id);

  if (!partnerId) {
    throw new AppError('Неверный ID партнера', 400);
  }

  const result = await pool.query(
    'UPDATE referral_partners SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING is_active',
    [partnerId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  res.json({ success: true, is_active: result.rows[0].is_active });
});

/**
 * Получение списка запросов на вывод
 */
export const getReferralWithdrawals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, search, limit, offset } = req.query;

  const pageLimit = limit ? parseInt(limit as string) : 100;
  const pageOffset = offset ? parseInt(offset as string) : 0;

  let query = `
    SELECT w.id, w.partner_id, w.amount, w.payment_details, w.telegram_tag,
           w.status, w.requested_at, w.processed_at, w.processed_by, w.admin_notes,
           p.name as partner_name, p.email as partner_email
    FROM referral_withdrawals w
    JOIN referral_partners p ON w.partner_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    query += ` AND w.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (search) {
    query += ` AND (
      LOWER(p.name) LIKE $${paramIndex} OR 
      LOWER(p.email) LIKE $${paramIndex}
    )`;
    params.push(`%${(search as string).toLowerCase()}%`);
    paramIndex++;
  }

  // Получаем общее количество
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  query += ` ORDER BY w.requested_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageLimit, pageOffset);

  const result = await pool.query(query, params);

  res.json({
    withdrawals: result.rows.map((row) => ({
      id: row.id,
      partner_id: row.partner_id,
      partner_name: row.partner_name,
      partner_email: row.partner_email,
      amount: parseFloat(row.amount),
      payment_details: row.payment_details,
      telegram_tag: row.telegram_tag,
      status: row.status,
      requested_at: row.requested_at,
      processed_at: row.processed_at,
      processed_by: row.processed_by,
      admin_notes: row.admin_notes,
    })),
    total,
  });
});

/**
 * Одобрение запроса на вывод
 */
export const approveWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const withdrawalId = parseInt(id);

  if (!withdrawalId) {
    throw new AppError('Неверный ID запроса', 400);
  }

  const result = await pool.query(
    'UPDATE referral_withdrawals SET status = $1, processed_at = NOW(), processed_by = $2 WHERE id = $3 RETURNING partner_id, amount',
    ['approved', req.admin!.id, withdrawalId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Запрос не найден', 404);
  }

  const { partner_id, amount } = result.rows[0];
  await notifyWithdrawalStatusChange(partner_id, withdrawalId, 'approved', parseFloat(amount));

  res.json({ success: true });
});

/**
 * Отклонение запроса на вывод
 */
export const rejectWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  const withdrawalId = parseInt(id);

  if (!withdrawalId) {
    throw new AppError('Неверный ID запроса', 400);
  }

  const result = await pool.query(
    'UPDATE referral_withdrawals SET status = $1, processed_at = NOW(), processed_by = $2, admin_notes = $3 WHERE id = $4 RETURNING partner_id, amount',
    ['rejected', req.admin!.id, notes || null, withdrawalId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Запрос не найден', 404);
  }

  const { partner_id, amount } = result.rows[0];
  await notifyWithdrawalStatusChange(partner_id, withdrawalId, 'rejected', parseFloat(amount));

  res.json({ success: true });
});

/**
 * Пометить запрос как выплаченный
 */
export const markWithdrawalPaid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const withdrawalId = parseInt(id);

  if (!withdrawalId) {
    throw new AppError('Неверный ID запроса', 400);
  }

  await pool.query('BEGIN');

  try {
    // Получаем информацию о запросе
    const withdrawalResult = await pool.query(
      'SELECT partner_id, amount FROM referral_withdrawals WHERE id = $1',
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      throw new AppError('Запрос не найден', 404);
    }

    const { partner_id, amount } = withdrawalResult.rows[0];

    // Обновляем статус запроса
    await pool.query(
      'UPDATE referral_withdrawals SET status = $1, processed_at = NOW(), processed_by = $2 WHERE id = $3',
      ['paid', req.admin!.id, withdrawalId]
    );

    // Обновляем баланс партнера
    await pool.query(
      `UPDATE referral_partners 
       SET current_balance = current_balance - $1,
           withdrawn_amount = withdrawn_amount + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, partner_id]
    );

    await pool.query('COMMIT');

    // Создаем уведомление о выплате
    await notifyWithdrawalStatusChange(partner_id, withdrawalId, 'paid', parseFloat(amount));

    res.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
});

/**
 * Получение истории операций
 */
export const getReferralHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, partner_id, status, limit, offset } = req.query;

  const pageLimit = limit ? parseInt(limit as string) : 100;
  const pageOffset = offset ? parseInt(offset as string) : 0;

  // Объединяем начисления и выводы
  let query = `
    SELECT 
      'reward' as operation_type,
      r.id,
      r.partner_id,
      r.amount,
      r.reward_type as type,
      r.status,
      r.description,
      r.created_at,
      NULL as created_by,
      p.name as partner_name,
      p.email as partner_email
    FROM referral_rewards r
    JOIN referral_partners p ON r.partner_id = p.id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (type) {
    query += ` AND r.reward_type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  if (partner_id) {
    query += ` AND r.partner_id = $${paramIndex}`;
    params.push(parseInt(partner_id as string));
    paramIndex++;
  }

  if (status) {
    query += ` AND r.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Добавляем выводы
  query += `
    UNION ALL
    SELECT 
      'withdrawal' as operation_type,
      w.id,
      w.partner_id,
      -w.amount as amount,
      'withdrawal' as type,
      w.status,
      'Запрос на вывод средств' as description,
      w.requested_at as created_at,
      w.processed_by as created_by,
      p.name as partner_name,
      p.email as partner_email
    FROM referral_withdrawals w
    JOIN referral_partners p ON w.partner_id = p.id
    WHERE 1=1
  `;

  if (partner_id) {
    query += ` AND w.partner_id = $${paramIndex}`;
    params.push(parseInt(partner_id as string));
    paramIndex++;
  }

  if (status) {
    query += ` AND w.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Получаем общее количество
  const countQuery = `SELECT COUNT(*) as total FROM (${query}) as combined`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageLimit, pageOffset);

  const result = await pool.query(query, params);

  res.json({
    history: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      operation_type: row.operation_type,
      partner_id: row.partner_id,
      partner_name: row.partner_name,
      partner_email: row.partner_email,
      amount: Math.abs(parseFloat(row.amount)),
      description: row.description,
      status: row.status,
      created_at: row.created_at,
      created_by: row.created_by,
    })),
    total,
  });
});
