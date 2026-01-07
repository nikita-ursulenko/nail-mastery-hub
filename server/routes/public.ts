import express from 'express';
import { getPublicTestimonials } from '../controllers/publicController';
import { getContacts } from '../controllers/contactsController';
import { getFounderInfo } from '../controllers/founderController';
import { getTeamMembers } from '../controllers/teamController';
import { getBlogPosts, getBlogPostBySlug } from '../controllers/blogController';

const router = express.Router();

// Публичные роуты (без авторизации)
router.get('/testimonials', getPublicTestimonials);
router.get('/contacts', getContacts);
router.get('/founder', getFounderInfo);
router.get('/team', getTeamMembers);
router.get('/blog', getBlogPosts);
router.get('/blog/:slug', getBlogPostBySlug);

export default router;

