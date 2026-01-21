import { Response } from 'express';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { ReferralAuthRequest } from '../middleware/referralAuth';
import { calculatePartnerLevel } from '../utils/referralLevel';
import { getFrontendUrl } from '../utils/urlHelper';

/**
 * Получение общей статистики партнера
 */
export const getDashboardStats = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  // 1. Получаем базовую информацию о партнере
  const { data: partner, error: partnerError } = await supabase
    .from('referral_partners')
    .select('id, referral_code, total_earnings, current_balance, withdrawn_amount, level')
    .eq('id', partnerId)
    .single();

  if (partnerError || !partner) {
    throw new AppError('Партнер не найден', 404);
  }

  // 2. Статистика посещений
  const { count: visits, error: visitsError } = await supabase
    .from('referral_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .not('visited_at', 'is', null);

  const { data: uniqueVisitsData, error: uniqueVisitsError } = await supabase
    .from('referral_tracking')
    .select('visitor_ip')
    .eq('partner_id', partnerId)
    .not('visited_at', 'is', null);

  const uniqueVisits = new Set(uniqueVisitsData?.map(v => v.visitor_ip)).size;

  // 3. Статистика регистраций
  const { count: registrations, error: regsError } = await supabase
    .from('referral_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .in('status', ['registered', 'purchased']);

  // 4. Статистика покупок
  const { data: purchaseTrackings, error: trackError } = await supabase
    .from('referral_tracking')
    .select('user_id')
    .eq('partner_id', partnerId)
    .eq('status', 'purchased');

  const userIds = purchaseTrackings?.map(t => t.user_id).filter(id => id !== null) || [];

  let totalPurchaseAmount = 0;
  let purchases = 0;
  let avgPurchaseAmount = 0;

  if (userIds.length > 0) {
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('amount_paid')
      .eq('payment_status', 'paid')
      .in('user_id', userIds);

    if (!enrollError && enrollments) {
      purchases = enrollments.length;
      totalPurchaseAmount = enrollments.reduce((sum, e) => sum + (parseFloat(e.amount_paid as any) || 0), 0);
      avgPurchaseAmount = purchases > 0 ? totalPurchaseAmount / purchases : 0;
    }
  }

  // 5. Статистика начислений
  const { data: rewards, error: rewardsError } = await supabase
    .from('referral_rewards')
    .select('reward_type, amount')
    .eq('partner_id', partnerId);

  const rewardsStats = {
    visit: 0,
    registration: 0,
    purchase: 0,
    total: 0
  };

  rewards?.forEach(r => {
    const amount = parseFloat(r.amount as any) || 0;
    rewardsStats.total += amount;
    if (r.reward_type === 'visit') rewardsStats.visit += amount;
    else if (r.reward_type === 'registration') rewardsStats.registration += amount;
    else if (r.reward_type === 'purchase') rewardsStats.purchase += amount;
  });

  // 6. Запросы на вывод в обработке
  const { data: withdrawals, error: withError } = await supabase
    .from('referral_withdrawals')
    .select('amount')
    .eq('partner_id', partnerId)
    .eq('status', 'pending');

  const pendingWithdrawals = withdrawals?.reduce((sum, w) => sum + (parseFloat(w.amount as any) || 0), 0) || 0;

  // Конверсии
  const registrationConversion = (visits || 0) > 0 ? (registrations! / visits!) * 100 : 0;
  const purchaseConversion = (registrations || 0) > 0 ? (purchases / registrations!) * 100 : 0;

  res.json({
    partner: {
      referral_code: partner.referral_code,
      level: partner.level,
    },
    stats: {
      visits: {
        total: visits || 0,
        unique: uniqueVisits,
      },
      registrations: {
        total: registrations || 0,
        conversion: parseFloat(registrationConversion.toFixed(2)),
      },
      purchases: {
        total: purchases,
        total_amount: totalPurchaseAmount,
        avg_amount: parseFloat(avgPurchaseAmount.toFixed(2)),
        conversion: parseFloat(purchaseConversion.toFixed(2)),
      },
      rewards: {
        visit: rewardsStats.visit,
        registration: rewardsStats.registration,
        purchase: rewardsStats.purchase,
        total: rewardsStats.total,
      },
      balance: {
        total_earnings: parseFloat(partner.total_earnings as any),
        current_balance: parseFloat(partner.current_balance as any),
        withdrawn: parseFloat(partner.withdrawn_amount as any),
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

  const { data: partner, error } = await supabase
    .from('referral_partners')
    .select('referral_code')
    .eq('id', partnerId)
    .single();

  if (error || !partner) {
    throw new AppError('Партнер не найден', 404);
  }

  const baseUrl = getFrontendUrl(req);
  const referralLink = `${baseUrl}/?ref=${partner.referral_code}`;

  res.json({
    referral_code: partner.referral_code,
    referral_link: referralLink,
  });
});

/**
 * Получение истории начислений с фильтрацией
 */
export const getRewardsHistory = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { reward_type, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('referral_rewards')
    .select('id, reward_type, amount, status, description, created_at', { count: 'exact' })
    .eq('partner_id', partnerId);

  if (reward_type) query = query.eq('reward_type', reward_type);
  if (status) query = query.eq('status', status);
  if (start_date) query = query.gte('created_at', start_date);
  if (end_date) query = query.lte('created_at', end_date);

  const pageLimit = parseInt(limit as string);
  const pageOffset = parseInt(offset as string);

  const { data: rewards, count: total, error } = await query
    .order('created_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1);

  if (error) throw error;

  res.json({
    rewards: rewards?.map((row) => ({
      ...row,
      amount: parseFloat(row.amount as any),
    })) || [],
    total: total || 0,
  });
});

/**
 * Получение списка рефералов (email частично скрыт)
 */
export const getReferralsList = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  // В Supabase сложно сделать сложный GROUP BY с LEFT JOIN напрямую через SDK для агрегации вложенных данных
  // Пойдем через rpc или ручную агрегацию
  const { data: trackings, error } = await supabase
    .from('referral_tracking')
    .select(`
      user_id,
      status,
      registered_at,
      user:users(email)
    `)
    .eq('partner_id', partnerId)
    .not('user_id', 'is', null)
    .order('registered_at', { ascending: false });

  if (error) throw error;

  const userIds = trackings.map(t => t.user_id).filter(id => id !== null);

  // Получаем суммы покупок для этих пользователей
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id, amount_paid')
    .eq('payment_status', 'paid')
    .in('user_id', userIds);

  const purchasesMap: { [key: number]: number } = {};
  enrollments?.forEach(e => {
    purchasesMap[e.user_id] = (purchasesMap[e.user_id] || 0) + (parseFloat(e.amount_paid as any) || 0);
  });

  const maskEmail = (email: string): string => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visibleChars = Math.min(3, local.length);
    const masked = local.substring(0, visibleChars) + '***';
    return `${masked}@${domain}`;
  };

  res.json({
    referrals: trackings.map((row: any) => ({
      user_id: row.user_id,
      email: maskEmail(row.user?.email),
      status: row.status,
      registered_at: row.registered_at,
      total_purchases: purchasesMap[row.user_id] || 0,
    })),
  });
});

/**
 * Получение уровня партнера
 */
export const getPartnerLevel = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  const { count: referralsCount } = await supabase
    .from('referral_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .not('user_id', 'is', null);

  const { data: partner } = await supabase
    .from('referral_partners')
    .select('total_earnings')
    .eq('id', partnerId)
    .single();

  const totalEarnings = parseFloat(partner?.total_earnings as any) || 0;
  const level = calculatePartnerLevel(referralsCount || 0, totalEarnings);

  await supabase
    .from('referral_partners')
    .update({ level, updated_at: new Date().toISOString() })
    .eq('id', partnerId);

  res.json({
    level,
    referrals_count: referralsCount || 0,
    total_earnings: totalEarnings,
  });
});
