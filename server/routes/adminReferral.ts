import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getReferralStats,
  getReferralPartners,
  getPartnerStats,
  addPartnerFunds,
  removePartnerFunds,
  togglePartnerStatus,
  getReferralWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  getReferralHistory,
} from '../controllers/adminReferralController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

// Статистика
router.get('/stats', getReferralStats);

// Партнеры
router.get('/partners', getReferralPartners);
router.get('/partners/:id/stats', getPartnerStats);
router.post('/partners/:id/add-funds', addPartnerFunds);
router.post('/partners/:id/remove-funds', removePartnerFunds);
router.post('/partners/:id/toggle-status', togglePartnerStatus);

// Запросы на вывод
router.get('/withdrawals', getReferralWithdrawals);
router.post('/withdrawals/:id/approve', approveWithdrawal);
router.post('/withdrawals/:id/reject', rejectWithdrawal);
router.post('/withdrawals/:id/mark-paid', markWithdrawalPaid);

// История
router.get('/history', getReferralHistory);

export default router;
