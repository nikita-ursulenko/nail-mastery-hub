import express from 'express';
import { register, login, verifyToken } from '../controllers/referralAuthController';
import { authenticateReferralToken } from '../middleware/referralAuth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Публичные роуты
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

// Защищенные роуты (требуют токен)
router.get('/verify', authenticateReferralToken, asyncHandler(verifyToken));

export default router;
