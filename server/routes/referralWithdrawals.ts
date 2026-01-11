import express from 'express';
import {
  createWithdrawalRequest,
  getWithdrawalHistory,
} from '../controllers/referralWithdrawalController';
import { authenticateReferralToken } from '../middleware/referralAuth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Все роуты требуют авторизации
router.use(authenticateReferralToken);

router.post('/request', asyncHandler(createWithdrawalRequest));
router.get('/history', asyncHandler(getWithdrawalHistory));

export default router;
