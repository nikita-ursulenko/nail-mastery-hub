import express from 'express';
import { register, login, verifyToken } from '../controllers/userController';
import { authenticateUserToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Публичные роуты
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

// Защищенный роут (требует токен)
router.get('/verify', authenticateUserToken, asyncHandler(verifyToken));

export default router;

