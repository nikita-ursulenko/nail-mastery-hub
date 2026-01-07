import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAllOrders, getOrdersStats } from '../controllers/adminOrdersController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/stats', asyncHandler(getOrdersStats));
router.get('/', asyncHandler(getAllOrders));

export default router;

