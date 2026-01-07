import express from 'express';
import { authenticateUserToken } from '../middleware/userAuth';
import { createCheckoutSession, getPaymentStatus } from '../controllers/paymentController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Создать сессию оплаты (требует авторизации)
router.post('/create-checkout', authenticateUserToken, asyncHandler(createCheckoutSession));

// Проверить статус платежа (требует авторизации)
router.get('/status/:sessionId', authenticateUserToken, asyncHandler(getPaymentStatus));

export default router;

