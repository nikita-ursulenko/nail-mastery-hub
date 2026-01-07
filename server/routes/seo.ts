import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllSEO,
  getSEOById,
  upsertSEO,
  deleteSEO,
} from '../controllers/seoController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Все роуты требуют авторизации
router.use(authenticateToken);

// Получить все SEO настройки
router.get('/', asyncHandler(getAllSEO));

// Получить SEO по ID
router.get('/:id', asyncHandler(getSEOById));

// Создать или обновить SEO настройки
router.post('/', asyncHandler(upsertSEO));
router.put('/:id', asyncHandler(upsertSEO));

// Удалить SEO настройки
router.delete('/:id', asyncHandler(deleteSEO));

export default router;

