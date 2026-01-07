import express from 'express';
import { login, logout, verifyToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', authenticateToken, verifyToken);

export default router;

