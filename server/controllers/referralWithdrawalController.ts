import { Response } from 'express';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { ReferralAuthRequest } from '../middleware/referralAuth';

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
  const { data: partner, error: partnerError } = await supabase
    .from('referral_partners')
    .select('current_balance')
    .eq('id', partnerId)
    .single();

  if (partnerError || !partner) {
    throw new AppError('Партнер не найден', 404);
  }

  const currentBalance = parseFloat(partner.current_balance as any);

  if (amount > currentBalance) {
    throw new AppError('Недостаточно средств на балансе', 400);
  }

  // Проверяем, нет ли уже запроса в обработке
  const { data: pendingRequest } = await supabase
    .from('referral_withdrawals')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingRequest) {
    throw new AppError('У вас уже есть запрос на вывод в обработке', 400);
  }

  // Создаем запрос на вывод
  const { data: withdrawal, error } = await supabase
    .from('referral_withdrawals')
    .insert([
      {
        partner_id: partnerId,
        amount,
        payment_details: payment_details.trim(),
        telegram_tag: telegram_tag || null,
        status: 'pending'
      }
    ])
    .select('id, amount, payment_details, telegram_tag, status, requested_at')
    .single();

  if (error || !withdrawal) throw error;

  res.status(201).json({
    success: true,
    withdrawal: {
      ...withdrawal,
      amount: parseFloat(withdrawal.amount as any),
    },
  });
});

/**
 * Получение истории запросов на вывод
 */
export const getWithdrawalHistory = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { status, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('referral_withdrawals')
    .select('id, amount, payment_details, telegram_tag, status, requested_at, processed_at')
    .eq('partner_id', partnerId);

  if (status) {
    query = query.eq('status', status);
  }

  const pageLimit = parseInt(limit as string);
  const pageOffset = parseInt(offset as string);

  const { data: withdrawals, error } = await query
    .order('requested_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1);

  if (error) throw error;

  // Частично скрываем номер карты/счета для безопасности
  const maskPaymentDetails = (details: string): string => {
    if (!details || details.length < 8) return details;
    const visible = details.substring(0, 4);
    const hidden = '*'.repeat(Math.min(details.length - 8, 8));
    const last = details.substring(details.length - 4);
    return `${visible}${hidden}${last}`;
  };

  res.json({
    withdrawals: withdrawals?.map((row) => ({
      ...row,
      amount: parseFloat(row.amount as any),
      payment_details: maskPaymentDetails(row.payment_details),
    })) || [],
  });
});
