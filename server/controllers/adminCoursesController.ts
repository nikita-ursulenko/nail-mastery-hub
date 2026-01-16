/**
 * Контроллер для админ-панели управления курсами
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// Получить все курсы (для админки, включая неактивные)
export const getAllCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, category, level, is_active } = req.query;

  let query = supabase
    .from('courses')
    .select(`
      *,
      instructor:team_members(name)
    `);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (level && level !== 'all') {
    query = query.eq('level', level);
  }

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  const { data: courses, error } = await query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;

  res.json({
    courses: courses?.map((row) => ({
      ...row,
      instructor_name: (row.instructor as any)?.name,
      includes: typeof row.includes === 'string' ? JSON.parse(row.includes) : row.includes || [],
    })),
  });
});

// Получить детали курса для редактирования
export const getCourseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // 1. Получаем курс
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (courseError || !course) {
    throw new AppError('Курс не найден', 404);
  }

  // 2. Получаем модули с уроками
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', id)
    .order('order_index', { ascending: true });

  if (modulesError) throw modulesError;

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('*')
    .in('module_id', modules.map(m => m.id))
    .order('order_index', { ascending: true });

  if (lessonsError) throw lessonsError;

  const modulesWithLessons = modules.map(m => ({
    ...m,
    lessons: lessons.filter(l => l.module_id === m.id)
  }));

  // 3. Получаем тарифы
  const { data: tariffs, error: tariffsError } = await supabase
    .from('course_tariffs')
    .select('*')
    .eq('course_id', id)
    .order('display_order', { ascending: true });

  if (tariffsError) throw tariffsError;

  // 4. Получаем материалы
  const { data: materials, error: materialsError } = await supabase
    .from('course_materials')
    .select('*')
    .eq('course_id', id)
    .order('display_order', { ascending: true });

  if (materialsError) throw materialsError;

  res.json({
    ...course,
    includes: typeof course.includes === 'string' ? JSON.parse(course.includes) : course.includes || [],
    modules: modulesWithLessons,
    tariffs: tariffs.map((t) => ({
      ...t,
      features: typeof t.features === 'string' ? JSON.parse(t.features) : t.features || [],
      not_included: typeof t.not_included === 'string' ? JSON.parse(t.not_included) : t.not_included || [],
    })),
    materials: materials,
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
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    throw new AppError('Курс с таким slug уже существует', 400);
  }

  const { data: course, error } = await supabase
    .from('courses')
    .insert([
      {
        slug,
        title,
        subtitle: subtitle || null,
        description,
        image_url: image_url || null,
        image_upload_path: image_upload_path || null,
        video_preview_url: video_preview_url || null,
        level,
        category,
        duration,
        instructor_id: instructor_id || null,
        is_featured: is_featured || false,
        is_new: is_new || false,
        display_order: display_order || 0,
        includes: includes || [],
      }
    ])
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({
    ...course,
    includes: typeof course.includes === 'string' ? JSON.parse(course.includes) : course.includes || [],
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
  const { data: existing, error: checkError } = await supabase
    .from('courses')
    .select('id')
    .eq('id', id)
    .single();

  if (checkError || !existing) {
    throw new AppError('Курс не найден', 404);
  }

  // Проверяем уникальность slug (если изменился)
  if (slug) {
    const { data: slugCheck } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle();

    if (slugCheck) {
      throw new AppError('Курс с таким slug уже существует', 400);
    }
  }

  const updates: any = {
    updated_at: new Date().toISOString()
  };
  if (slug !== undefined) updates.slug = slug;
  if (title !== undefined) updates.title = title;
  if (subtitle !== undefined) updates.subtitle = subtitle;
  if (description !== undefined) updates.description = description;
  if (image_url !== undefined) updates.image_url = image_url;
  if (image_upload_path !== undefined) updates.image_upload_path = image_upload_path;
  if (video_preview_url !== undefined) updates.video_preview_url = video_preview_url;
  if (level !== undefined) updates.level = level;
  if (category !== undefined) updates.category = category;
  if (duration !== undefined) updates.duration = duration;
  if (instructor_id !== undefined) updates.instructor_id = instructor_id;
  if (is_featured !== undefined) updates.is_featured = is_featured;
  if (is_new !== undefined) updates.is_new = is_new;
  if (display_order !== undefined) updates.display_order = display_order;
  if (includes !== undefined) updates.includes = includes;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data: course, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  res.json({
    ...course,
    includes: typeof course.includes === 'string' ? JSON.parse(course.includes) : course.includes || [],
  });
});

// Удалить курс
export const deleteCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: course, error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error || !course) {
    throw new AppError('Курс не найден', 404);
  }

  res.json({ message: 'Курс успешно удален', id: course.id });
});

// Управление модулями
export const createModule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { course_id, title, description, order_index } = req.body;

  const { data: module, error } = await supabase
    .from('course_modules')
    .insert([
      { course_id, title, description: description || null, order_index }
    ])
    .select()
    .single();

  if (error) throw error;

  res.status(201).json(module);
});

export const updateModule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, order_index, is_active } = req.body;

  const { data: module, error } = await supabase
    .from('course_modules')
    .update({
      title,
      description: description || null,
      order_index,
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !module) {
    throw new AppError('Модуль не найден', 404);
  }

  res.json(module);
});

export const deleteModule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: module, error } = await supabase
    .from('course_modules')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error || !module) {
    throw new AppError('Модуль не найден', 404);
  }

  res.json({ message: 'Модуль успешно удален', id: module.id });
});

// Управление уроками
export const createLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { module_id, title, description, video_url, video_upload_path, duration, order_index, is_preview } = req.body;

  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .insert([
      {
        module_id,
        title,
        description: description || null,
        video_url: video_url || null,
        video_upload_path: video_upload_path || null,
        duration: duration || null,
        order_index,
        is_preview: is_preview || false
      }
    ])
    .select()
    .single();

  if (error) throw error;

  res.status(201).json(lesson);
});

export const updateLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, video_url, video_upload_path, duration, order_index, is_preview, is_active } = req.body;

  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .update({
      title,
      description: description || null,
      video_url: video_url || null,
      video_upload_path: video_upload_path || null,
      duration: duration || null,
      order_index,
      is_preview,
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !lesson) {
    throw new AppError('Урок не найден', 404);
  }

  res.json(lesson);
});

export const deleteLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error || !lesson) {
    throw new AppError('Урок не найден', 404);
  }

  res.json({ message: 'Урок успешно удален', id: lesson.id });
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

  const { data: tariff, error } = await supabase
    .from('course_tariffs')
    .insert([
      {
        course_id,
        tariff_type,
        name,
        price,
        old_price: old_price || null,
        features: features || [],
        not_included: not_included || [],
        is_popular: is_popular || false,
        display_order: display_order || 0,
        homework_reviews_limit: homework_reviews_limit || null,
        curator_support_months: curator_support_months || null,
      }
    ])
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({
    ...tariff,
    features: typeof tariff.features === 'string' ? JSON.parse(tariff.features) : tariff.features || [],
    not_included: typeof tariff.not_included === 'string' ? JSON.parse(tariff.not_included) : tariff.not_included || [],
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

  const updates: any = {
    updated_at: new Date().toISOString()
  };
  if (name !== undefined) updates.name = name;
  if (price !== undefined) updates.price = price;
  if (old_price !== undefined) updates.old_price = old_price;
  if (features !== undefined) updates.features = features;
  if (not_included !== undefined) updates.not_included = not_included;
  if (is_popular !== undefined) updates.is_popular = is_popular;
  if (display_order !== undefined) updates.display_order = display_order;
  if (homework_reviews_limit !== undefined) updates.homework_reviews_limit = homework_reviews_limit;
  if (curator_support_months !== undefined) updates.curator_support_months = curator_support_months;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data: tariff, error } = await supabase
    .from('course_tariffs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !tariff) {
    throw new AppError('Тариф не найден', 404);
  }

  res.json({
    ...tariff,
    features: typeof tariff.features === 'string' ? JSON.parse(tariff.features) : tariff.features || [],
    not_included: typeof tariff.not_included === 'string' ? JSON.parse(tariff.not_included) : tariff.not_included || [],
  });
});

export const deleteTariff = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: tariff, error } = await supabase
    .from('course_tariffs')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error || !tariff) {
    throw new AppError('Тариф не найден', 404);
  }

  res.json({ message: 'Тариф успешно удален', id: tariff.id });
});

// Управление материалами
export const createMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { course_id, name, price_info, link, display_order } = req.body;

  const { data: material, error } = await supabase
    .from('course_materials')
    .insert([
      { course_id, name, price_info: price_info || null, link: link || null, display_order: display_order || 0 }
    ])
    .select()
    .single();

  if (error) throw error;

  res.status(201).json(material);
});

export const updateMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, price_info, link, display_order, is_active } = req.body;

  const { data: material, error } = await supabase
    .from('course_materials')
    .update({
      name,
      price_info: price_info || null,
      link: link || null,
      display_order: display_order || 0,
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !material) {
    throw new AppError('Материал не найден', 404);
  }

  res.json(material);
});

export const deleteMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: material, error } = await supabase
    .from('course_materials')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error || !material) {
    throw new AppError('Материал не найден', 404);
  }

  res.json({ message: 'Материал успешно удален', id: material.id });
});

