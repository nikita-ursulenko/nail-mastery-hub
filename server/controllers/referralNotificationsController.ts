import { Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { ReferralAuthRequest } from '../middleware/referralAuth';

const pool = new Pool(getDatabaseConfig());

/**
 * Получение списка уведомлений партнера
 */
export const getNotifications = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { limit = 50, offset = 0, is_read } = req.query;

  let query = `
    SELECT id, notification_type, title, message, is_read, created_at
    FROM referral_notifications
    WHERE partner_id = $1
  `;
  const params: any[] = [partnerId];
  let paramIndex = 2;

  if (is_read !== undefined) {
    query += ` AND is_read = $${paramIndex}`;
    params.push(is_read === 'true');
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit as string), parseInt(offset as string));

  const result = await pool.query(query, params);

  res.json({
    notifications: result.rows.map((row) => ({
      id: row.id,
      type: row.notification_type,
      title: row.title,
      message: row.message,
      is_read: row.is_read,
      created_at: row.created_at,
    })),
  });
});

/**
 * Получение количества непрочитанных уведомлений
 */
export const getUnreadCount = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM referral_notifications 
     WHERE partner_id = $1 AND is_read = FALSE`,
    [partnerId]
  );

  res.json({
    unread_count: parseInt(result.rows[0].count) || 0,
  });
});

/**
 * Отметить уведомление как прочитанное
 */
export const markAsRead = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;
  const { notificationId } = req.params;

  // Проверяем, что уведомление принадлежит партнеру
  const checkResult = await pool.query(
    'SELECT id FROM referral_notifications WHERE id = $1 AND partner_id = $2',
    [notificationId, partnerId]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError('Уведомление не найдено', 404);
  }

  await pool.query('UPDATE referral_notifications SET is_read = TRUE WHERE id = $1', [
    notificationId,
  ]);

  res.json({ success: true });
});

/**
 * Отметить все уведомления как прочитанные
 */
export const markAllAsRead = asyncHandler(async (req: ReferralAuthRequest, res: Response) => {
  const partnerId = req.referral!.id;

  await pool.query('UPDATE referral_notifications SET is_read = TRUE WHERE partner_id = $1', [
    partnerId,
  ]);

  res.json({ success: true });
});
