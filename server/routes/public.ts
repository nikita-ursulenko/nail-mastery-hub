import express from 'express';
import { getPublicTestimonials } from '../controllers/publicController';

const router = express.Router();

// Публичные роуты (без авторизации)
router.get('/testimonials', getPublicTestimonials);

export default router;

