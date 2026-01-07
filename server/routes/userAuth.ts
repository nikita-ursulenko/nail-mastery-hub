import express from 'express';
import { register, login, verifyToken, updateProfile, changePassword, uploadUserAvatar } from '../controllers/userController';
import { authenticateUserToken } from '../middleware/userAuth';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadAvatar } from '../middleware/upload';
import { validateUploadedFile } from '../middleware/fileValidation';
import { uploadRateLimit } from '../middleware/rateLimit';

const router = express.Router();

// Публичные роуты
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

// Защищенные роуты (требуют токен)
router.get('/verify', authenticateUserToken, asyncHandler(verifyToken));
router.put('/profile', authenticateUserToken, asyncHandler(updateProfile));
router.put('/password', authenticateUserToken, asyncHandler(changePassword));
router.post('/upload-avatar', authenticateUserToken, uploadRateLimit, uploadAvatar.single('avatar'), validateUploadedFile, asyncHandler(uploadUserAvatar));

export default router;

