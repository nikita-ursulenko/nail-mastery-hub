import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadTeamImage as uploadMiddleware } from '../middleware/upload';
import {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  uploadTeamImage,
} from '../controllers/teamController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/', getAllTeamMembers);
router.get('/:id', getTeamMemberById);
router.post('/upload-image', uploadMiddleware.single('image'), uploadTeamImage);
router.post('/', createTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;

