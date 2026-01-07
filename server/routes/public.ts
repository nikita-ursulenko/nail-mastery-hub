import express from 'express';
import { getPublicTestimonials } from '../controllers/publicController';
import { getContacts } from '../controllers/contactsController';
import { getFounderInfo } from '../controllers/founderController';
import { getTeamMembers } from '../controllers/teamController';

const router = express.Router();

// Публичные роуты (без авторизации)
router.get('/testimonials', getPublicTestimonials);
router.get('/contacts', getContacts);
router.get('/founder', getFounderInfo);
router.get('/team', getTeamMembers);

export default router;

