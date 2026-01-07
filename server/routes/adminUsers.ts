import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
} from '../controllers/adminUserController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-active', toggleUserActive);

export default router;

