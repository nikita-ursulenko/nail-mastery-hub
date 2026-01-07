import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';
import { validateUploadedFile } from '../middleware/fileValidation';
import { uploadRateLimit } from '../middleware/rateLimit';
import {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  uploadAvatarFile,
} from '../controllers/testimonialsController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/', getTestimonials);
router.get('/:id', getTestimonialById);
router.post('/upload-avatar', uploadRateLimit, uploadAvatar.single('avatar'), validateUploadedFile, uploadAvatarFile);
router.post('/', createTestimonial);
router.put('/:id', updateTestimonial);
router.delete('/:id', deleteTestimonial);

export default router;

