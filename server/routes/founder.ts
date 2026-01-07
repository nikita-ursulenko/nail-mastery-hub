import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadFounderImage as uploadMiddleware } from '../middleware/upload';
import { validateUploadedFile } from '../middleware/fileValidation';
import { uploadRateLimit } from '../middleware/rateLimit';
import {
  getAllFounderInfo,
  getFounderInfoById,
  createFounderInfo,
  updateFounderInfo,
  deleteFounderInfo,
  uploadFounderImage,
} from '../controllers/founderController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/', getAllFounderInfo);
router.get('/:id', getFounderInfoById);
router.post('/upload-image', uploadRateLimit, uploadMiddleware.single('image'), validateUploadedFile, uploadFounderImage);
router.post('/', createFounderInfo);
router.put('/:id', updateFounderInfo);
router.delete('/:id', deleteFounderInfo);

export default router;

