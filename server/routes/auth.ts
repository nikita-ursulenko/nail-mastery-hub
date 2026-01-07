import express from 'express';
import { login, logout, verifyToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { loginSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/verify', authenticateToken, asyncHandler(verifyToken));

export default router;

