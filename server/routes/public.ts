import express from 'express';
import { getPublicTestimonials } from '../controllers/publicController';
import { getContacts } from '../controllers/contactsController';
import { getFounderInfo } from '../controllers/founderController';

const router = express.Router();

// Публичные роуты (без авторизации)
router.get('/testimonials', getPublicTestimonials);
router.get('/contacts', getContacts);
router.get('/founder', getFounderInfo);

export default router;

