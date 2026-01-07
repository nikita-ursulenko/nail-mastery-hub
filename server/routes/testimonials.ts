import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';
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
router.post('/upload-avatar', uploadAvatar.single('avatar'), uploadAvatarFile);
router.post('/', createTestimonial);
router.put('/:id', updateTestimonial);
router.delete('/:id', deleteTestimonial);

export default router;

