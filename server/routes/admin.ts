import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboardStats } from '../controllers/adminController';

const router = express.Router();

// Все админские роуты требуют аутентификации
router.use(authenticateToken);

router.get('/dashboard/stats', getDashboardStats);

export default router;

