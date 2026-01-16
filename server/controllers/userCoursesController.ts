/**
 * Контроллер для управления курсами пользователей
 */

import { Response } from 'express';
import { AuthenticatedUserRequest } from '../middleware/userAuth';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

/**
 * Получить все курсы пользователя (к которым есть доступ)
 */
export const getUserCourses = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const userId = req.user!.id;

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        status,
        progress_percent,
        lessons_completed,
        total_lessons,
        purchased_at,
        started_at,
        expires_at,
        course:courses (
          id,
          slug,
          title,
          subtitle,
          description,
          image_url,
          image_upload_path,
          level,
          category,
          duration,
          rating,
          reviews_count
        ),
        tariff:course_tariffs (
          name,
          tariff_type
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('courses.is_active', true)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении курсов' });
    }

    // Форматируем ответ для соответствия старому формату
    const courses = enrollments.map(e => ({
      ...(e.course as any),
      status: e.status,
      progress_percent: e.progress_percent,
      lessons_completed: e.lessons_completed,
      total_lessons: e.total_lessons,
      purchased_at: e.purchased_at,
      started_at: e.started_at,
      expires_at: e.expires_at,
      tariff_name: (e.tariff as any)?.name,
      tariff_type: (e.tariff as any)?.tariff_type
    }));

    res.json({ courses });
  }
);

/**
 * Получить детали курса для пользователя (с модулями и уроками)
 */
export const getUserCourseDetails = asyncHandler(
  async (req: AuthenticatedUserRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // 1. Проверяем доступ к курсу
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id, 
        status, 
        progress_percent, 
        lessons_completed, 
        total_lessons, 
        purchased_at, 
        started_at, 
        expires_at,
        tariff:course_tariffs (
          name,
          tariff_type,
          homework_reviews_limit,
          curator_support_months
        )
      `)
      .eq('user_id', userId)
      .eq('course_id', id)
      .eq('status', 'active')
      .single();

    if (enrollmentError || !enrollment) {
      throw new AppError('У вас нет доступа к этому курсу', 403);
    }

    // 2. Получаем детали курса
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id, slug, title, subtitle, description,
        image_url, image_upload_path, video_preview_url,
        level, category, duration, rating, reviews_count,
        includes, instructor_id
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (courseError || !course) {
      throw new AppError('Курс не найден', 404);
    }

    // Парсим includes если это строка (на всякий случай, Supabase обычно возвращает JSON)
    if (typeof course.includes === 'string') {
      try {
        course.includes = JSON.parse(course.includes);
      } catch (e) { }
    }

    // 3. Получаем модули
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('id, title, order_index')
      .eq('course_id', id)
      .order('order_index', { ascending: true });

    if (modulesError) throw modulesError;

    // 4. Получаем уроки и прогресс для каждого модуля
    // Вместо сложного подзапроса, получим все уроки курса и прогресс для enrollment
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select(`
        id,
        module_id,
        title,
        description,
        video_url,
        duration,
        is_preview,
        order_index
      `)
      .in('module_id', modules.map(m => m.id))
      .order('order_index', { ascending: true });

    if (lessonsError) throw lessonsError;

    const { data: progressList, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id, is_completed, watched_duration, last_watched_at')
      .eq('enrollment_id', enrollment.id);

    if (progressError) throw progressError;

    const progressMap = new Map(progressList.map(p => [p.lesson_id, p]));

    // Группируем уроки по модулям
    const modulesWithLessons = modules.map(m => ({
      ...m,
      lessons: lessons
        .filter(l => l.module_id === m.id)
        .map(l => {
          const lp = progressMap.get(l.id);
          return {
            ...l,
            is_completed: lp?.is_completed || false,
            watched_duration: lp?.watched_duration || 0,
            last_watched_at: lp?.last_watched_at || null
          };
        })
    }));

    // 5. Получаем материалы курса
    const { data: materials, error: materialsError } = await supabase
      .from('course_materials')
      .select('id, name, price_info, display_order')
      .eq('course_id', id)
      .order('display_order', { ascending: true });

    if (materialsError) throw materialsError;

    res.json({
      course: {
        ...course,
        modules: modulesWithLessons,
        materials: materials,
      },
      enrollment: {
        tariff_name: (enrollment.tariff as any)?.name,
        tariff_type: (enrollment.tariff as any)?.tariff_type,
        homework_reviews_limit: (enrollment.tariff as any)?.homework_reviews_limit,
        curator_support_months: (enrollment.tariff as any)?.curator_support_months,
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
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select(`
        id,
        title,
        description,
        video_url,
        video_upload_path,
        duration,
        is_preview,
        order_index,
        materials,
        module:course_modules (
          id,
          title,
          course_id
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new AppError('Урок не найден', 404);
    }

    const lessonData: any = { ...lesson };
    const courseId = (lesson.module as any).course_id;
    const moduleId = (lesson.module as any).id;

    // Проверяем доступ к курсу (если урок не является preview)
    if (!lesson.is_preview) {
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .single();

      if (enrollmentError || !enrollment) {
        throw new AppError('У вас нет доступа к этому уроку', 403);
      }

      // Получаем прогресс урока
      const { data: progress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('is_completed, watched_duration, last_watched_at')
        .eq('enrollment_id', enrollment.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      const lessonProgress = progress || {
        is_completed: false,
        watched_duration: 0,
        last_watched_at: null,
      };

      // Получаем соседние уроки
      const { data: prevLesson } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('module_id', moduleId)
        .lt('order_index', lesson.order_index)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: nextLesson } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('module_id', moduleId)
        .gt('order_index', lesson.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      res.json({
        lesson: {
          ...lessonData,
          progress: lessonProgress,
          prev_lesson_id: prevLesson?.id || null,
          next_lesson_id: nextLesson?.id || null,
        },
      });
    } else {
      // Для preview уроков не требуется enrollment
      res.json({
        lesson: {
          ...lessonData,
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

    // 1. Получаем курс урока
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('module:course_modules(course_id)')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new AppError('Урок не найден', 404);
    }

    const courseId = (lesson.module as any).course_id;

    // 2. Получем enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();

    if (enrollmentError || !enrollment) {
      throw new AppError('У вас нет доступа к этому курсу', 403);
    }

    const enrollmentId = enrollment.id;

    // 3. Обновляем или создаем прогресс урока
    const { error: upsertError } = await supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        watched_duration,
        is_completed,
        last_watched_at: new Date().toISOString()
      }, { onConflict: 'enrollment_id,lesson_id' });

    if (upsertError) throw upsertError;

    // 4. Пересчитываем прогресс курса
    // Получаем ID модулей курса
    const { data: modules } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId);

    const moduleIds = modules?.map(m => m.id) || [];

    const { data: lessonsCount, count: totalCount } = await supabase
      .from('course_lessons')
      .select('id', { count: 'exact', head: true })
      .in('module_id', moduleIds);

    const { data: completedLessons, count: completedCount } = await supabase
      .from('lesson_progress')
      .select('lesson_id', { count: 'exact', head: true })
      .eq('enrollment_id', enrollmentId)
      .eq('is_completed', true)
      .in('lesson_id', (await supabase.from('course_lessons').select('id').in('module_id', moduleIds)).data?.map(l => l.id) || []);

    const total = totalCount || 0;
    const completed = completedCount || 0;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 5. Обновляем прогресс enrollment
    await supabase
      .from('enrollments')
      .update({
        progress_percent: progressPercent,
        lessons_completed: completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

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

