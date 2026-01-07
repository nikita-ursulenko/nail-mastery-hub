import { Request, Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

// Получить список всех активных курсов (публичный)
export const getPublicCourses = asyncHandler(async (req: Request, res: Response) => {
  const { category, level, search, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT 
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
      c.students_count,
      c.rating,
      c.reviews_count,
      c.is_new,
      c.is_featured,
      c.display_order,
      tm.name as instructor_name,
      tm.role as instructor_role,
      tm.image_url as instructor_image_url,
      tm.image_upload_path as instructor_image_upload_path,
      (
        SELECT MIN(price) 
        FROM course_tariffs 
        WHERE course_id = c.id AND is_active = TRUE
      ) as min_price,
      (
        SELECT old_price 
        FROM course_tariffs 
        WHERE course_id = c.id AND is_active = TRUE 
        ORDER BY price ASC 
        LIMIT 1
      ) as min_old_price
    FROM courses c
    LEFT JOIN team_members tm ON c.instructor_id = tm.id
    WHERE c.is_active = TRUE
  `;

  const params: any[] = [];
  let paramCount = 0;

  if (category && category !== 'all') {
    paramCount++;
    query += ` AND c.category = $${paramCount}`;
    params.push(category);
  }

  if (level && level !== 'all') {
    paramCount++;
    query += ` AND c.level = $${paramCount}`;
    params.push(level);
  }

  if (search) {
    paramCount++;
    query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  // Подсчет общего количества (отдельный запрос без подзапросов)
  let countQuery = `
    SELECT COUNT(*) as count
    FROM courses c
    WHERE c.is_active = TRUE
  `;
  const countParams: any[] = [];
  let countParamCount = 0;

  if (category && category !== 'all') {
    countParamCount++;
    countQuery += ` AND c.category = $${countParamCount}`;
    countParams.push(category);
  }

  if (level && level !== 'all') {
    countParamCount++;
    countQuery += ` AND c.level = $${countParamCount}`;
    countParams.push(level);
  }

  if (search) {
    countParamCount++;
    countQuery += ` AND (c.title ILIKE $${countParamCount} OR c.description ILIKE $${countParamCount})`;
    countParams.push(`%${search}%`);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  // Добавляем сортировку, лимит и оффсет
  query += ` ORDER BY c.display_order ASC, c.created_at DESC`;

  paramCount++;
  query += ` LIMIT $${paramCount}`;
  params.push(parseInt(limit as string));

  paramCount++;
  query += ` OFFSET $${paramCount}`;
  params.push(parseInt(offset as string));

  const result = await pool.query(query, params);

  // Форматируем результат
  const courses = result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    image_url: row.image_url,
    image_upload_path: row.image_upload_path,
    level: row.level,
    category: row.category,
    duration: row.duration,
    students: row.students_count,
    rating: parseFloat(row.rating) || 0,
    reviews: row.reviews_count || 0,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    price: parseFloat(row.min_price) || 0,
    oldPrice: row.min_old_price ? parseFloat(row.min_old_price) : null,
    instructor: row.instructor_name
      ? {
          name: row.instructor_name,
          role: row.instructor_role,
          image_url: row.instructor_image_url,
          image_upload_path: row.instructor_image_upload_path,
        }
      : null,
  }));

  res.json({
    courses,
    total,
    hasMore: offset + courses.length < total,
  });
});

// Получить детали курса (публичный - без видео)
export const getPublicCourseBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  // Получаем курс
  const courseResult = await pool.query(
    `SELECT 
      c.*,
      tm.name as instructor_name,
      tm.role as instructor_role,
      tm.image_url as instructor_image_url,
      tm.image_upload_path as instructor_image_upload_path,
      tm.bio as instructor_bio
    FROM courses c
    LEFT JOIN team_members tm ON c.instructor_id = tm.id
    WHERE c.slug = $1 AND c.is_active = TRUE`,
    [slug]
  );

  if (courseResult.rows.length === 0) {
    throw new AppError('Курс не найден', 404);
  }

  const course = courseResult.rows[0];

  // Получаем модули (только названия, без уроков с видео)
  const modulesResult = await pool.query(
    `SELECT 
      cm.id,
      cm.title,
      cm.description,
      cm.order_index,
      (
        SELECT COUNT(*) 
        FROM course_lessons 
        WHERE module_id = cm.id
      ) as lessons_count
    FROM course_modules cm
    WHERE cm.course_id = $1
    ORDER BY cm.order_index ASC`,
    [course.id]
  );

  // Получаем уроки для каждого модуля (только названия)
  const modules = await Promise.all(
    modulesResult.rows.map(async (module) => {
      const lessonsResult = await pool.query(
        `SELECT 
          id,
          title,
          order_index,
          duration,
          is_preview
        FROM course_lessons
        WHERE module_id = $1
        ORDER BY order_index ASC`,
        [module.id]
      );

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        order_index: module.order_index,
        lessons_count: parseInt(module.lessons_count),
        lessons: lessonsResult.rows.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order_index: lesson.order_index,
          duration: lesson.duration,
          is_preview: lesson.is_preview,
        })),
      };
    })
  );

  // Получаем тарифы
  const tariffsResult = await pool.query(
    `SELECT 
      id,
      tariff_type,
      name,
      price,
      old_price,
      features,
      not_included,
      is_popular,
      display_order,
      homework_reviews_limit,
      curator_support_months
    FROM course_tariffs
    WHERE course_id = $1 AND is_active = TRUE
    ORDER BY display_order ASC`,
    [course.id]
  );

  // Получаем материалы
  const materialsResult = await pool.query(
    `SELECT name, price_info, link
    FROM course_materials
    WHERE course_id = $1
    ORDER BY display_order ASC`,
    [course.id]
  );

  // Форматируем ответ
  res.json({
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    image_url: course.image_url,
    image_upload_path: course.image_upload_path,
    video_preview_url: course.video_preview_url,
    level: course.level,
    category: course.category,
    duration: course.duration,
    students: course.students_count,
    rating: parseFloat(course.rating) || 0,
    reviews: course.reviews_count || 0,
    includes: course.includes || [],
    modules,
    tariffs: tariffsResult.rows.map((tariff) => ({
      id: tariff.id,
      tariff_type: tariff.tariff_type,
      name: tariff.name,
      price: parseFloat(tariff.price),
      oldPrice: tariff.old_price ? parseFloat(tariff.old_price) : null,
      features: tariff.features || [],
      notIncluded: tariff.not_included || [],
      popular: tariff.is_popular,
      homework_reviews_limit: tariff.homework_reviews_limit,
      curator_support_months: tariff.curator_support_months,
    })),
    materials: materialsResult.rows.map((m) => ({
      name: m.name,
      price_info: m.price_info,
      link: m.link,
    })),
    instructor: course.instructor_name
      ? {
          name: course.instructor_name,
          role: course.instructor_role,
          image_url: course.instructor_image_url,
          image_upload_path: course.instructor_image_upload_path,
          bio: course.instructor_bio,
        }
      : null,
  });
});

