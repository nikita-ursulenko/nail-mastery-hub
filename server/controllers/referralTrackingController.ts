import { Request, Response } from 'express';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validateReferralCode } from '../utils/referralCodeGenerator';
import { notifyRegistration } from '../utils/referralNotifications';

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
  const { data: partner, error: partnerError } = await supabase
    .from('referral_partners')
    .select('id, is_active')
    .eq('referral_code', referral_code)
    .single();

  if (partnerError || !partner) {
    throw new AppError('Реферальный код не найден', 404);
  }

  if (!partner.is_active) {
    throw new AppError('Партнер неактивен', 403);
  }

  // Проверяем, не было ли уже посещения с этого IP и User-Agent за последние 24 часа
  const { data: recentVisits, error: recentError } = await supabase
    .from('referral_tracking')
    .select('id')
    .eq('partner_id', partner.id)
    .eq('visitor_ip', ip)
    .eq('visitor_user_agent', userAgent)
    .gt('visited_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (recentVisits && recentVisits.length > 0) {
    // Уже было посещение, просто возвращаем успех без начисления
    return res.json({
      success: true,
      message: 'Посещение уже зарегистрировано',
      already_tracked: true,
    });
  }

  // Начисляем 0.1€ за посещение
  const rewardAmount = 0.1;

  // Имитация транзакции: создаем запись отслеживания
  const { data: tracking, error: trackError } = await supabase
    .from('referral_tracking')
    .insert([{ partner_id: partner.id, visitor_ip: ip, visitor_user_agent: userAgent, status: 'visited' }])
    .select('id')
    .single();

  if (trackError || !tracking) throw trackError;

  try {
    // Создаем запись о начислении
    const { error: rewardError } = await supabase
      .from('referral_rewards')
      .insert([
        {
          partner_id: partner.id,
          tracking_id: tracking.id,
          reward_type: 'visit',
          amount: rewardAmount,
          status: 'approved',
          description: 'Начисление за первое посещение по реферальной ссылке'
        }
      ]);

    if (rewardError) throw rewardError;

    // Обновляем баланс партнера
    // Используем rpc для атомарного инкремента, если доступно, но здесь пока простым update
    // (в реальной системе лучше использовать rpc для предотвращения race conditions)
    const { data: currentPartner } = await supabase
      .from('referral_partners')
      .select('total_earnings, current_balance')
      .eq('id', partner.id)
      .single();

    const newTotal = parseFloat(currentPartner?.total_earnings as any || 0) + rewardAmount;
    const newBalance = parseFloat(currentPartner?.current_balance as any || 0) + rewardAmount;

    await supabase
      .from('referral_partners')
      .update({
        total_earnings: newTotal,
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner.id);

    res.json({
      success: true,
      message: 'Посещение зарегистрировано',
      reward: rewardAmount,
      already_tracked: false,
    });
  } catch (error) {
    // В идеале тут нужен откат, но так как это серия запросов, 
    // логика должна быть либо в RPC, либо через сохранение состояния.
    // На данный момент просто пробрасываем ошибку.
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
  const { data: partner, error: partnerError } = await supabase
    .from('referral_partners')
    .select('id, is_active')
    .eq('referral_code', referral_code)
    .single();

  if (partnerError || !partner) {
    throw new AppError('Реферальный код не найден', 404);
  }

  if (!partner.is_active) {
    throw new AppError('Партнер неактивен', 403);
  }

  // Проверяем, не зарегистрирован ли уже этот пользователь по другой ссылке
  const { data: existingTracking } = await supabase
    .from('referral_tracking')
    .select('id')
    .eq('user_id', user_id)
    .in('status', ['registered', 'purchased']);

  if (existingTracking && existingTracking.length > 0) {
    return res.json({
      success: false,
      message: 'Пользователь уже был зарегистрирован по другой реферальной ссылке',
      already_registered: true,
    });
  }

  // Ищем запись отслеживания для этого пользователя (если было посещение)
  const { data: latestVisit } = await supabase
    .from('referral_tracking')
    .select('id')
    .eq('partner_id', partner.id)
    .is('user_id', null)
    .order('visited_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let trackingId: number;

  if (latestVisit) {
    // Обновляем существующую запись
    trackingId = latestVisit.id;
    await supabase
      .from('referral_tracking')
      .update({
        user_id,
        registered_at: new Date().toISOString(),
        status: 'registered',
        updated_at: new Date().toISOString()
      })
      .eq('id', trackingId);
  } else {
    // Создаем новую запись
    const { data: newTrack, error: createError } = await supabase
      .from('referral_tracking')
      .insert([{ partner_id: partner.id, user_id, registered_at: new Date().toISOString(), status: 'registered' }])
      .select('id')
      .single();

    if (createError || !newTrack) throw createError;
    trackingId = newTrack.id;
  }

  // Начисляем 0.5€ за регистрацию
  const rewardAmount = 0.5;

  try {
    // Создаем запись о начислении
    const { error: rewardError } = await supabase
      .from('referral_rewards')
      .insert([
        {
          partner_id: partner.id,
          tracking_id: trackingId,
          user_id,
          reward_type: 'registration',
          amount: rewardAmount,
          status: 'approved',
          description: 'Начисление за регистрацию пользователя по реферальной ссылке'
        }
      ]);

    if (rewardError) throw rewardError;

    // Обновляем баланс партнера
    const { data: currentPartner } = await supabase
      .from('referral_partners')
      .select('total_earnings, current_balance')
      .eq('id', partner.id)
      .single();

    const newTotal = parseFloat(currentPartner?.total_earnings as any || 0) + rewardAmount;
    const newBalance = parseFloat(currentPartner?.current_balance as any || 0) + rewardAmount;

    await supabase
      .from('referral_partners')
      .update({
        total_earnings: newTotal,
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner.id);

    // Получаем email пользователя для уведомления
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single();

    const userEmail = user?.email || 'новый пользователь';

    // Создаем уведомление о регистрации
    await notifyRegistration(partner.id, user_id, userEmail);

    res.json({
      success: true,
      message: 'Регистрация зарегистрирована',
      reward: rewardAmount,
    });
  } catch (error) {
    throw error;
  }
});
