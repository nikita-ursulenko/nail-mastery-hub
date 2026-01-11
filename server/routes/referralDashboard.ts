import express from 'express';
import {
  getDashboardStats,
  getReferralLink,
  getRewardsHistory,
  getReferralsList,
  getPartnerLevel,
} from '../controllers/referralDashboardController';
import { authenticateReferralToken } from '../middleware/referralAuth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Все роуты требуют авторизации
router.use(authenticateReferralToken);

router.get('/stats', asyncHandler(getDashboardStats));
router.get('/link', asyncHandler(getReferralLink));
router.get('/rewards', asyncHandler(getRewardsHistory));
router.get('/referrals', asyncHandler(getReferralsList));
router.get('/level', asyncHandler(getPartnerLevel));

export default router;
