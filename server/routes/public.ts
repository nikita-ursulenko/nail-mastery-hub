import express from 'express';
import { getPublicTestimonials } from '../controllers/publicController';
import { getContacts } from '../controllers/contactsController';

const router = express.Router();

// Публичные роуты (без авторизации)
router.get('/testimonials', getPublicTestimonials);
router.get('/contacts', getContacts);

export default router;

