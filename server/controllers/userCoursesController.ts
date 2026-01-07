/**
 * Контроллер для управления курсами пользователей
 */

import { Response } from 'express';
import { AuthenticatedUserRequest } from '../middleware/userAuth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

/**
 * Получить все курсы пользователя (к которым есть доступ)
 */
export const getUserCourses = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT
        c.id,
        c.slug,
        c.title,
        c.subtitle,
        c.description,
        c.image_url,
        c.image_upload_path,
        c.level,
        c.category,
        c.duration,
        c.rating,
        c.reviews_count,
        e.status,
        e.progress_percent,
        e.lessons_completed,
        e.total_lessons,
        e.purchased_at,
        e.started_at,
        e.expires_at,
        ct.name as tariff_name,
        ct.tariff_type
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN course_tariffs ct ON e.tariff_id = ct.id
      WHERE e.user_id = $1 AND e.status = 'active' AND c.is_active = TRUE
      ORDER BY e.purchased_at DESC`,
      [userId]
    );

    res.json({ courses: result.rows });
  }
);

/**
 * Получить детали курса для пользователя (с модулями и уроками)
 */
export const getUserCourseDetails = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Проверяем доступ к курсу
    const enrollmentResult = await pool.query(
      `SELECT e.id, e.status, e.progress_percent, e.lessons_completed, e.total_lessons, 
              e.purchased_at, e.started_at, e.expires_at,
              ct.name as tariff_name, ct.tariff_type,
              ct.homework_reviews_limit, ct.curator_support_months
       FROM enrollments e
       JOIN course_tariffs ct ON e.tariff_id = ct.id
       WHERE e.user_id = $1 AND e.course_id = $2 AND e.status = 'active'`,
      [userId, id]
    );

    if (enrollmentResult.rows.length === 0) {
      throw new AppError('У вас нет доступа к этому курсу', 403);
    }

    const enrollment = enrollmentResult.rows[0];

    // Получаем детали курса
    const courseResult = await pool.query(
      `SELECT
        id, slug, title, subtitle, description,
        image_url, image_upload_path, video_preview_url,
        level, category, duration, rating, reviews_count,
        includes, instructor_id
      FROM courses
      WHERE id = $1 AND is_active = TRUE`,
      [id]
    );

    if (courseResult.rows.length === 0) {
      throw new AppError('Курс не найден', 404);
    }

    const course = courseResult.rows[0];

    // Парсим includes если это строка
    if (typeof course.includes === 'string') {
      course.includes = JSON.parse(course.includes);
    }

    // Получаем модули с уроками
    const modulesResult = await pool.query(
      `SELECT
        cm.id,
        cm.title,
        cm.order_index,
        (
          SELECT json_agg(
            json_build_object(
              'id', cl.id,
              'title', cl.title,
              'description', cl.description,
              'video_url', cl.video_url,
              'duration', cl.duration,
              'is_preview', cl.is_preview,
              'order_index', cl.order_index,
              'is_completed', COALESCE(lp.is_completed, false),
              'watched_duration', COALESCE(lp.watched_duration, 0),
              'last_watched_at', lp.last_watched_at
            ) ORDER BY cl.order_index
          )
          FROM course_lessons cl
          LEFT JOIN lesson_progress lp ON cl.id = lp.lesson_id AND lp.enrollment_id = $2
          WHERE cl.module_id = cm.id
        ) as lessons
      FROM course_modules cm
      WHERE cm.course_id = $1
      ORDER BY cm.order_index`,
      [id, enrollment.id]
    );

    // Получаем материалы курса
    const materialsResult = await pool.query(
      `SELECT id, name, price_info, display_order
       FROM course_materials
       WHERE course_id = $1
       ORDER BY display_order`,
      [id]
    );

    res.json({
      course: {
        ...course,
        modules: modulesResult.rows,
        materials: materialsResult.rows,
      },
      enrollment: {
        tariff_name: enrollment.tariff_name,
        tariff_type: enrollment.tariff_type,
        homework_reviews_limit: enrollment.homework_reviews_limit,
        curator_support_months: enrollment.curator_support_months,
        progress_percent: enrollment.progress_percent,
        lessons_completed: enrollment.lessons_completed,
        total_lessons: enrollment.total_lessons,
        purchased_at: enrollment.purchased_at,
        started_at: enrollment.started_at,
        expires_at: enrollment.expires_at,
      },
    });
  }
);

/**
 * Получить урок для просмотра
 */
export const getUserLesson = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const userId = req.user!.id;
    const { lessonId } = req.params;

    // Получаем информацию об уроке
    const lessonResult = await pool.query(
      `SELECT
        cl.id,
        cl.title,
        cl.description,
        cl.video_url,
        cl.video_upload_path,
        cl.duration,
        cl.is_preview,
        cl.order_index,
        cl.materials,
        cm.id as module_id,
        cm.title as module_title,
        cm.course_id
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      WHERE cl.id = $1`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      throw new AppError('Урок не найден', 404);
    }

    const lesson = lessonResult.rows[0];

    // Проверяем доступ к курсу (если урок не является preview)
    if (!lesson.is_preview) {
      const enrollmentResult = await pool.query(
        `SELECT e.id, e.status
         FROM enrollments e
         WHERE e.user_id = $1 AND e.course_id = $2 AND e.status = 'active'`,
        [userId, lesson.course_id]
      );

      if (enrollmentResult.rows.length === 0) {
        throw new AppError('У вас нет доступа к этому уроку', 403);
      }

      const enrollmentId = enrollmentResult.rows[0].id;

      // Получаем прогресс урока
      const progressResult = await pool.query(
        `SELECT is_completed, watched_duration, last_watched_at
         FROM lesson_progress
         WHERE enrollment_id = $1 AND lesson_id = $2`,
        [enrollmentId, lessonId]
      );

      const progress = progressResult.rows[0] || {
        is_completed: false,
        watched_duration: 0,
        last_watched_at: null,
      };

      // Получаем соседние уроки (предыдущий и следующий)
      const neighborsResult = await pool.query(
        `SELECT
          (SELECT id FROM course_lessons WHERE module_id = $1 AND order_index < $2 ORDER BY order_index DESC LIMIT 1) as prev_lesson_id,
          (SELECT id FROM course_lessons WHERE module_id = $1 AND order_index > $2 ORDER BY order_index ASC LIMIT 1) as next_lesson_id`,
        [lesson.module_id, lesson.order_index]
      );

      const neighbors = neighborsResult.rows[0];

      res.json({
        lesson: {
          ...lesson,
          progress,
          prev_lesson_id: neighbors.prev_lesson_id,
          next_lesson_id: neighbors.next_lesson_id,
        },
      });
    } else {
      // Для preview уроков не требуется enrollment
      res.json({
        lesson: {
          ...lesson,
          progress: {
            is_completed: false,
            watched_duration: 0,
            last_watched_at: null,
          },
          prev_lesson_id: null,
          next_lesson_id: null,
        },
      });
    }
  }
);

/**
 * Обновить прогресс урока
 */
export const updateLessonProgress = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const userId = req.user!.id;
    const { lessonId } = req.params;
    const { watched_duration, is_completed } = req.body;

    // Получаем курс урока
    const lessonResult = await pool.query(
      `SELECT cm.course_id
       FROM course_lessons cl
       JOIN course_modules cm ON cl.module_id = cm.id
       WHERE cl.id = $1`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      throw new AppError('Урок не найден', 404);
    }

    const courseId = lessonResult.rows[0].course_id;

    // Получаем enrollment
    const enrollmentResult = await pool.query(
      `SELECT id FROM enrollments
       WHERE user_id = $1 AND course_id = $2 AND status = 'active'`,
      [userId, courseId]
    );

    if (enrollmentResult.rows.length === 0) {
      throw new AppError('У вас нет доступа к этому курсу', 403);
    }

    const enrollmentId = enrollmentResult.rows[0].id;

    // Обновляем или создаем прогресс урока
    await pool.query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, watched_duration, is_completed, last_watched_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (enrollment_id, lesson_id)
       DO UPDATE SET
         watched_duration = EXCLUDED.watched_duration,
         is_completed = EXCLUDED.is_completed,
         last_watched_at = NOW()`,
      [enrollmentId, lessonId, watched_duration, is_completed]
    );

    // Пересчитываем прогресс курса
    const progressResult = await pool.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE lp.is_completed) as completed
       FROM course_lessons cl
       JOIN course_modules cm ON cl.module_id = cm.id
       LEFT JOIN lesson_progress lp ON cl.id = lp.lesson_id AND lp.enrollment_id = $1
       WHERE cm.course_id = $2`,
      [enrollmentId, courseId]
    );

    const total = parseInt(progressResult.rows[0].total);
    const completed = parseInt(progressResult.rows[0].completed);
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Обновляем прогресс enrollment
    await pool.query(
      `UPDATE enrollments
       SET progress_percent = $1, lessons_completed = $2, updated_at = NOW()
       WHERE id = $3`,
      [progressPercent, completed, enrollmentId]
    );

    res.json({
      success: true,
      progress: {
        lessons_completed: completed,
        total_lessons: total,
        progress_percent: progressPercent,
      },
    });
  }
);

