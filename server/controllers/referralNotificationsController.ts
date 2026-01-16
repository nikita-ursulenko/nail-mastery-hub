import { Response } from 'express';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { ReferralAuthRequest } from '../middleware/referralAuth';

/**
 * Получение списка уведомлений партнера
 */
export const getNotifications = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { limit = 50, offset = 0, is_read } = req.query;

  let query = supabase
    .from('referral_notifications')
    .select('id, notification_type, title, message, is_read, created_at')
    .eq('partner_id', partnerId);

  if (is_read !== undefined) {
    query = query.eq('is_read', is_read === 'true');
  }

  const pageLimit = parseInt(limit as string);
  const pageOffset = parseInt(offset as string);

  const { data: notifications, error } = await query
    .order('created_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1);

  if (error) throw error;

  res.json({
    notifications: notifications?.map((row) => ({
      id: row.id,
      type: row.notification_type,
      title: row.title,
      message: row.message,
      is_read: row.is_read,
      created_at: row.created_at,
    })) || [],
  });
});

/**
 * Получение количества непрочитанных уведомлений
 */
export const getUnreadCount = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  const { count, error } = await supabase
    .from('referral_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .eq('is_read', false);

  if (error) throw error;

  res.json({
    unread_count: count || 0,
  });
});

/**
 * Отметить уведомление как прочитанное
 */
export const markAsRead = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { notificationId } = req.params;

  // Обновляем напрямую с фильтром по владельцу
  const { data: notification, error } = await supabase
    .from('referral_notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('partner_id', partnerId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!notification) {
    throw new AppError('Уведомление не найдено', 404);
  }

  res.json({ success: true });
});

/**
 * Отметить все уведомления как прочитанные
 */
export const markAllAsRead = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  const { error } = await supabase
    .from('referral_notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('partner_id', partnerId)
    .eq('is_read', false);

  if (error) throw error;

  res.json({ success: true });
});
