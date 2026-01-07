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
import {
  getUserEnrollments,
  addUserEnrollment,
  removeUserEnrollment,
  updateUserEnrollmentTariff,
} from '../controllers/adminUserEnrollments';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-active', toggleUserActive);

// Управление курсами пользователей
router.get('/:userId/enrollments', getUserEnrollments);
router.post('/:userId/enrollments', addUserEnrollment);
router.delete('/:userId/enrollments/:enrollmentId', removeUserEnrollment);
router.patch('/:userId/enrollments/:enrollmentId/tariff', updateUserEnrollmentTariff);

export default router;

