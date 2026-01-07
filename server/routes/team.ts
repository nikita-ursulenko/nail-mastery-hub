import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadTeamImage as uploadMiddleware } from '../middleware/upload';
import { validateUploadedFile } from '../middleware/fileValidation';
import { uploadRateLimit } from '../middleware/rateLimit';
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
router.post('/upload-image', uploadRateLimit, uploadMiddleware.single('image'), validateUploadedFile, uploadTeamImage);
router.post('/', createTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;

