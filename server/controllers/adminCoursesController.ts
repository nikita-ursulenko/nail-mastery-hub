/**
 * Контроллер для админ-панели управления курсами
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

// Получить все курсы (для админки, включая неактивные)
export const getAllCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, category, level, is_active } = req.query;

  let query = `
    SELECT
      c.id,
      c.slug,
      c.title,
      c.subtitle,
      c.description,
      c.image_url,
      c.image_upload_path,
      c.video_preview_url,
      c.level,
      c.category,
      c.duration,
      c.students_count,
      c.rating,
      c.reviews_count,
      c.is_new,
      c.is_featured,
      c.display_order,
      c.includes,
      c.instructor_id,
      c.is_active,
      c.created_at,
      c.updated_at,
      tm.name as instructor_name
    FROM courses c
    LEFT JOIN team_members tm ON c.instructor_id = tm.id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

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

  if (is_active !== undefined) {
    paramCount++;
    query += ` AND c.is_active = $${paramCount}`;
    params.push(is_active === 'true');
  }

  query += ` ORDER BY c.display_order ASC, c.created_at DESC`;

  const result = await pool.query(query, params);

  res.json({
    courses: result.rows.map((row) => ({
      ...row,
      includes: typeof row.includes === 'string' ? JSON.parse(row.includes) : row.includes || [],
    })),
  });
});

// Получить детали курса для редактирования
export const getCourseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Получаем курс
  const courseResult = await pool.query(
    `SELECT * FROM courses WHERE id = $1`,
    [id]
  );

  if (courseResult.rows.length === 0) {
    throw new AppError('Курс не найден', 404);
  }

  const course = courseResult.rows[0];

  // Получаем модули
  const modulesResult = await pool.query(
    `SELECT * FROM course_modules WHERE course_id = $1 ORDER BY order_index ASC`,
    [id]
  );

  // Получаем уроки для каждого модуля
  const modules = await Promise.all(
    modulesResult.rows.map(async (module) => {
      const lessonsResult = await pool.query(
        `SELECT * FROM course_lessons WHERE module_id = $1 ORDER BY order_index ASC`,
        [module.id]
      );
      return {
        ...module,
        lessons: lessonsResult.rows,
      };
    })
  );

  // Получаем тарифы
  const tariffsResult = await pool.query(
    `SELECT * FROM course_tariffs WHERE course_id = $1 ORDER BY display_order ASC`,
    [id]
  );

  // Получаем материалы
  const materialsResult = await pool.query(
    `SELECT * FROM course_materials WHERE course_id = $1 ORDER BY display_order ASC`,
    [id]
  );

  res.json({
    ...course,
    includes: typeof course.includes === 'string' ? JSON.parse(course.includes) : course.includes || [],
    modules,
    tariffs: tariffsResult.rows.map((t) => ({
      ...t,
      features: typeof t.features === 'string' ? JSON.parse(t.features) : t.features || [],
      not_included: typeof t.not_included === 'string' ? JSON.parse(t.not_included) : t.not_included || [],
    })),
    materials: materialsResult.rows,
  });
});

// Создать новый курс
export const createCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    slug,
    title,
    subtitle,
    description,
    image_url,
    image_upload_path,
    video_preview_url,
    level,
    category,
    duration,
    instructor_id,
    is_featured,
    is_new,
    display_order,
    includes,
  } = req.body;

  // Проверяем уникальность slug
  const existing = await pool.query('SELECT id FROM courses WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    throw new AppError('Курс с таким slug уже существует', 400);
  }

  const result = await pool.query(
    `INSERT INTO courses (
      slug, title, subtitle, description, image_url, image_upload_path,
      video_preview_url, level, category, duration, instructor_id,
      is_featured, is_new, display_order, includes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      slug,
      title,
      subtitle || null,
      description,
      image_url || null,
      image_upload_path || null,
      video_preview_url || null,
      level,
      category,
      duration,
      instructor_id || null,
      is_featured || false,
      is_new || false,
      display_order || 0,
      JSON.stringify(includes || []),
    ]
  );

  res.status(201).json({
    ...result.rows[0],
    includes: typeof result.rows[0].includes === 'string' ? JSON.parse(result.rows[0].includes) : result.rows[0].includes || [],
  });
});

// Обновить курс
export const updateCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    slug,
    title,
    subtitle,
    description,
    image_url,
    image_upload_path,
    video_preview_url,
    level,
    category,
    duration,
    instructor_id,
    is_featured,
    is_new,
    display_order,
    includes,
    is_active,
  } = req.body;

  // Проверяем существование курса
  const existing = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Курс не найден', 404);
  }

  // Проверяем уникальность slug (если изменился)
  if (slug) {
    const slugCheck = await pool.query('SELECT id FROM courses WHERE slug = $1 AND id != $2', [slug, id]);
    if (slugCheck.rows.length > 0) {
      throw new AppError('Курс с таким slug уже существует', 400);
    }
  }

  const result = await pool.query(
    `UPDATE courses SET
      slug = COALESCE($1, slug),
      title = COALESCE($2, title),
      subtitle = COALESCE($3, subtitle),
      description = COALESCE($4, description),
      image_url = COALESCE($5, image_url),
      image_upload_path = COALESCE($6, image_upload_path),
      video_preview_url = COALESCE($7, video_preview_url),
      level = COALESCE($8, level),
      category = COALESCE($9, category),
      duration = COALESCE($10, duration),
      instructor_id = COALESCE($11, instructor_id),
      is_featured = COALESCE($12, is_featured),
      is_new = COALESCE($13, is_new),
      display_order = COALESCE($14, display_order),
      includes = COALESCE($15, includes),
      is_active = COALESCE($16, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $17
    RETURNING *`,
    [
      slug,
      title,
      subtitle,
      description,
      image_url,
      image_upload_path,
      video_preview_url,
      level,
      category,
      duration,
      instructor_id,
      is_featured,
      is_new,
      display_order,
      includes ? JSON.stringify(includes) : null,
      is_active,
      id,
    ]
  );

  res.json({
    ...result.rows[0],
    includes: typeof result.rows[0].includes === 'string' ? JSON.parse(result.rows[0].includes) : result.rows[0].includes || [],
  });
});

// Удалить курс
export const deleteCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Курс не найден', 404);
  }

  res.json({ message: 'Курс успешно удален', id: result.rows[0].id });
});

// Управление модулями
export const createModule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { course_id, title, description, order_index } = req.body;

  const result = await pool.query(
    `INSERT INTO course_modules (course_id, title, description, order_index)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [course_id, title, description || null, order_index]
  );

  res.status(201).json(result.rows[0]);
});

export const updateModule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, order_index, is_active } = req.body;

  const result = await pool.query(
    `UPDATE course_modules SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      order_index = COALESCE($3, order_index),
      is_active = COALESCE($4, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 RETURNING *`,
    [title, description, order_index, is_active, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Модуль не найден', 404);
  }

  res.json(result.rows[0]);
});

export const deleteModule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query('DELETE FROM course_modules WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Модуль не найден', 404);
  }

  res.json({ message: 'Модуль успешно удален', id: result.rows[0].id });
});

// Управление уроками
export const createLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { module_id, title, description, video_url, video_upload_path, duration, order_index, is_preview } = req.body;

  const result = await pool.query(
    `INSERT INTO course_lessons (
      module_id, title, description, video_url, video_upload_path, duration, order_index, is_preview
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [module_id, title, description || null, video_url || null, video_upload_path || null, duration || null, order_index, is_preview || false]
  );

  res.status(201).json(result.rows[0]);
});

export const updateLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, video_url, video_upload_path, duration, order_index, is_preview, is_active } = req.body;

  const result = await pool.query(
    `UPDATE course_lessons SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      video_url = COALESCE($3, video_url),
      video_upload_path = COALESCE($4, video_upload_path),
      duration = COALESCE($5, duration),
      order_index = COALESCE($6, order_index),
      is_preview = COALESCE($7, is_preview),
      is_active = COALESCE($8, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9 RETURNING *`,
    [title, description, video_url, video_upload_path, duration, order_index, is_preview, is_active, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Урок не найден', 404);
  }

  res.json(result.rows[0]);
});

export const deleteLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query('DELETE FROM course_lessons WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Урок не найден', 404);
  }

  res.json({ message: 'Урок успешно удален', id: result.rows[0].id });
});

// Управление тарифами
export const createTariff = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    course_id,
    tariff_type,
    name,
    price,
    old_price,
    features,
    not_included,
    is_popular,
    display_order,
    homework_reviews_limit,
    curator_support_months,
  } = req.body;

  const result = await pool.query(
    `INSERT INTO course_tariffs (
      course_id, tariff_type, name, price, old_price, features, not_included,
      is_popular, display_order, homework_reviews_limit, curator_support_months
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      course_id,
      tariff_type,
      name,
      price,
      old_price || null,
      JSON.stringify(features || []),
      JSON.stringify(not_included || []),
      is_popular || false,
      display_order || 0,
      homework_reviews_limit || null,
      curator_support_months || null,
    ]
  );

  res.status(201).json({
    ...result.rows[0],
    features: typeof result.rows[0].features === 'string' ? JSON.parse(result.rows[0].features) : result.rows[0].features || [],
    not_included: typeof result.rows[0].not_included === 'string' ? JSON.parse(result.rows[0].not_included) : result.rows[0].not_included || [],
  });
});

export const updateTariff = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    price,
    old_price,
    features,
    not_included,
    is_popular,
    display_order,
    homework_reviews_limit,
    curator_support_months,
    is_active,
  } = req.body;

  const result = await pool.query(
    `UPDATE course_tariffs SET
      name = COALESCE($1, name),
      price = COALESCE($2, price),
      old_price = COALESCE($3, old_price),
      features = COALESCE($4, features),
      not_included = COALESCE($5, not_included),
      is_popular = COALESCE($6, is_popular),
      display_order = COALESCE($7, display_order),
      homework_reviews_limit = COALESCE($8, homework_reviews_limit),
      curator_support_months = COALESCE($9, curator_support_months),
      is_active = COALESCE($10, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11 RETURNING *`,
    [
      name,
      price,
      old_price,
      features ? JSON.stringify(features) : null,
      not_included ? JSON.stringify(not_included) : null,
      is_popular,
      display_order,
      homework_reviews_limit,
      curator_support_months,
      is_active,
      id,
    ]
  );

  if (result.rows.length === 0) {
    throw new AppError('Тариф не найден', 404);
  }

  res.json({
    ...result.rows[0],
    features: typeof result.rows[0].features === 'string' ? JSON.parse(result.rows[0].features) : result.rows[0].features || [],
    not_included: typeof result.rows[0].not_included === 'string' ? JSON.parse(result.rows[0].not_included) : result.rows[0].not_included || [],
  });
});

export const deleteTariff = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query('DELETE FROM course_tariffs WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Тариф не найден', 404);
  }

  res.json({ message: 'Тариф успешно удален', id: result.rows[0].id });
});

// Управление материалами
export const createMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { course_id, name, price_info, link, display_order } = req.body;

  const result = await pool.query(
    `INSERT INTO course_materials (course_id, name, price_info, link, display_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [course_id, name, price_info || null, link || null, display_order || 0]
  );

  res.status(201).json(result.rows[0]);
});

export const updateMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, price_info, link, display_order, is_active } = req.body;

  const result = await pool.query(
    `UPDATE course_materials SET
      name = COALESCE($1, name),
      price_info = COALESCE($2, price_info),
      link = COALESCE($3, link),
      display_order = COALESCE($4, display_order),
      is_active = COALESCE($5, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 RETURNING *`,
    [name, price_info, link, display_order, is_active, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Материал не найден', 404);
  }

  res.json(result.rows[0]);
});

export const deleteMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query('DELETE FROM course_materials WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Материал не найден', 404);
  }

  res.json({ message: 'Материал успешно удален', id: result.rows[0].id });
});

