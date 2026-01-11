import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/referralNotificationsController';
import { authenticateReferralToken } from '../middleware/referralAuth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Все роуты требуют авторизации
router.use(authenticateReferralToken);

router.get('/', asyncHandler(getNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.patch('/:notificationId/read', asyncHandler(markAsRead));
router.patch('/mark-all-read', asyncHandler(markAllAsRead));

export default router;
