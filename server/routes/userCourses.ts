/**
 * API роуты для курсов пользователей
 */

import express from 'express';
import { authenticateUserToken } from '../middleware/userAuth';
import {
  getUserCourses,
  getUserCourseDetails,
  getUserLesson,
  updateLessonProgress,
} from '../controllers/userCoursesController';

const router = express.Router();

// Все роуты требуют аутентификации пользователя
router.use(authenticateUserToken);

// Получить все курсы пользователя
router.get('/courses', getUserCourses);

// Получить детали курса с модулями и уроками
router.get('/courses/:id', getUserCourseDetails);

// Получить урок для просмотра
router.get('/lessons/:lessonId', getUserLesson);

// Обновить прогресс урока
router.put('/lessons/:lessonId/progress', updateLessonProgress);

export default router;

