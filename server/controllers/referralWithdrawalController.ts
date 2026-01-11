import { Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { ReferralAuthRequest } from '../middleware/referralAuth';

const pool = new Pool(getDatabaseConfig());

interface CreateWithdrawalBody {
  amount: number;
  payment_details: string;
  telegram_tag?: string;
}

/**
 * Создание запроса на вывод средств
 */
export const createWithdrawalRequest = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { amount, payment_details, telegram_tag } = req.body as CreateWithdrawalBody;

  if (!amount || amount <= 0) {
    throw new AppError('Сумма должна быть больше нуля', 400);
  }

  if (!payment_details || payment_details.trim().length === 0) {
    throw new AppError('Номер карты/счета обязателен', 400);
  }

  // Получаем текущий баланс партнера
  const partnerResult = await pool.query(
    'SELECT current_balance FROM referral_partners WHERE id = $1',
    [partnerId]
  );

  if (partnerResult.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  const currentBalance = parseFloat(partnerResult.rows[0].current_balance);

  if (amount > currentBalance) {
    throw new AppError('Недостаточно средств на балансе', 400);
  }

  // Проверяем, нет ли уже запроса в обработке
  const pendingRequest = await pool.query(
    'SELECT id FROM referral_withdrawals WHERE partner_id = $1 AND status = $2',
    [partnerId, 'pending']
  );

  if (pendingRequest.rows.length > 0) {
    throw new AppError('У вас уже есть запрос на вывод в обработке', 400);
  }

  // Создаем запрос на вывод
  const result = await pool.query(
    `INSERT INTO referral_withdrawals (partner_id, amount, payment_details, telegram_tag, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, amount, payment_details, telegram_tag, status, requested_at`,
    [partnerId, amount, payment_details.trim(), telegram_tag || null]
  );

  res.status(201).json({
    success: true,
    withdrawal: {
      id: result.rows[0].id,
      amount: parseFloat(result.rows[0].amount),
      payment_details: result.rows[0].payment_details,
      telegram_tag: result.rows[0].telegram_tag,
      status: result.rows[0].status,
      requested_at: result.rows[0].requested_at,
    },
  });
});

/**
 * Получение истории запросов на вывод
 */
export const getWithdrawalHistory = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT id, amount, payment_details, telegram_tag, status, requested_at, processed_at
    FROM referral_withdrawals
    WHERE partner_id = $1
  `;
  const params: any[] = [partnerId];
  let paramIndex = 2;

  if (status) {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  query += ` ORDER BY requested_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit as string), parseInt(offset as string));

  const result = await pool.query(query, params);

  // Частично скрываем номер карты/счета для безопасности
  const maskPaymentDetails = (details: string): string => {
    if (!details || details.length < 8) return details;
    const visible = details.substring(0, 4);
    const hidden = '*'.repeat(Math.min(details.length - 8, 8));
    const last = details.substring(details.length - 4);
    return `${visible}${hidden}${last}`;
  };

  res.json({
    withdrawals: result.rows.map((row) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      payment_details: maskPaymentDetails(row.payment_details),
      telegram_tag: row.telegram_tag,
      status: row.status,
      requested_at: row.requested_at,
      processed_at: row.processed_at,
    })),
  });
});
