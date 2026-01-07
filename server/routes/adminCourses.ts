import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  createTariff,
  updateTariff,
  deleteTariff,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../controllers/adminCoursesController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

// Курсы - специфичные роуты должны быть ПЕРЕД параметрическими
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);

// Модули (должны быть перед /courses/:id)
router.post('/courses/modules', createModule);
router.put('/courses/modules/:id', updateModule);
router.delete('/courses/modules/:id', deleteModule);

// Уроки
router.post('/courses/lessons', createLesson);
router.put('/courses/lessons/:id', updateLesson);
router.delete('/courses/lessons/:id', deleteLesson);

// Тарифы
router.post('/courses/tariffs', createTariff);
router.put('/courses/tariffs/:id', updateTariff);
router.delete('/courses/tariffs/:id', deleteTariff);

// Материалы
router.post('/courses/materials', createMaterial);
router.put('/courses/materials/:id', updateMaterial);
router.delete('/courses/materials/:id', deleteMaterial);

// Курсы с параметром (должен быть ПОСЛЕ всех специфичных роутов)
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

export default router;

