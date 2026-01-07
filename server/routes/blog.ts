import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadBlogImage as uploadBlogImageMiddleware, uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload';
import {
  getAllBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogImage,
  uploadAuthorAvatar,
} from '../controllers/blogController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/', getAllBlogPosts);
router.get('/:id', getBlogPostById);
router.post('/upload-image', uploadBlogImageMiddleware.single('image'), uploadBlogImage);
router.post('/upload-author-avatar', uploadAvatarMiddleware.single('avatar'), uploadAuthorAvatar);
router.post('/', createBlogPost);
router.put('/:id', updateBlogPost);
router.delete('/:id', deleteBlogPost);

export default router;

