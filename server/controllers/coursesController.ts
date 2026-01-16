import { Request, Response } from 'express';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// Получить список всех активных курсов (публичный)
export const getPublicCourses = asyncHandler(async (req: Request, res: Response) => {
  const { category, level, search, limit = '50', offset = '0' } = req.query;

  const pageSize = parseInt(limit as string);
  const pageOffset = parseInt(offset as string);

  let query = supabase
    .from('courses')
    .select(`
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
      students_count,
      rating,
      reviews_count,
      is_new,
      is_featured,
      display_order,
      instructor:team_members (
        name,
        role,
        image_url,
        image_upload_path
      )
    `, { count: 'exact' })
    .eq('is_active', true);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (level && level !== 'all') {
    query = query.eq('level', level);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: coursesData, count, error } = await query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(pageOffset, pageOffset + pageSize - 1);

  if (error) {
    console.error('Supabase error:', error);
    throw new AppError('Ошибка при получении курсов', 500);
  }

  // Получаем минимальные цены для каждого курса (отдельно, так как агрегаты в select ограничены)
  const coursesWithPrices = await Promise.all((coursesData || []).map(async (course: any) => {
    const { data: tariffs } = await supabase
      .from('course_tariffs')
      .select('price, old_price')
      .eq('course_id', course.id)
      .eq('is_active', true)
      .order('price', { ascending: true })
      .limit(1);

    const minTariff = tariffs && tariffs[0];

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      image_url: course.image_url,
      image_upload_path: course.image_upload_path,
      level: course.level,
      category: course.category,
      duration: course.duration,
      students: course.students_count,
      rating: parseFloat(course.rating) || 0,
      reviews: course.reviews_count || 0,
      isNew: course.is_new,
      isFeatured: course.is_featured,
      price: minTariff ? parseFloat(minTariff.price) : 0,
      oldPrice: minTariff?.old_price ? parseFloat(minTariff.old_price) : null,
      instructor: course.instructor ? {
        name: course.instructor.name,
        role: course.instructor.role,
        image_url: course.instructor.image_url,
        image_upload_path: course.instructor.image_upload_path,
      } : null,
    };
  }));

  res.json({
    courses: coursesWithPrices,
    total: count || 0,
    hasMore: pageOffset + (coursesData?.length || 0) < (count || 0),
  });
});

// Получить детали курса (публичный - без видео)
export const getPublicCourseBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  // Получаем курс
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:team_members (
        name,
        role,
        image_url,
        image_upload_path,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (courseError || !course) {
    if (courseError?.code === 'PGRST116') {
      throw new AppError('Курс не найден', 404);
    }
    console.error('Supabase error:', courseError);
    throw new AppError('Ошибка при получении курса', 500);
  }

  // Получаем модули и уроки одним запросом или последовательно
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select(`
      id,
      title,
      description,
      order_index,
      lessons:course_lessons (
        id,
        title,
        order_index,
        duration,
        is_preview
      )
    `)
    .eq('course_id', course.id)
    .order('order_index', { ascending: true });

  if (modulesError) {
    console.error('Supabase error (modules):', modulesError);
  }

  // Получаем тарифы
  const { data: tariffs, error: tariffsError } = await supabase
    .from('course_tariffs')
    .select('*')
    .eq('course_id', course.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // Получаем материалы
  const { data: materials, error: materialsError } = await supabase
    .from('course_materials')
    .select('name, price_info, link')
    .eq('course_id', course.id)
    .order('display_order', { ascending: true });

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
    modules: (modules || []).map(m => ({
      ...m,
      lessons_count: m.lessons?.length || 0,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
    })),
    tariffs: (tariffs || []).map((tariff: any) => ({
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
    materials: (materials || []).map((m: any) => ({
      name: m.name,
      price_info: m.price_info,
      link: m.link,
    })),
    instructor: course.instructor ? {
      name: course.instructor.name,
      role: course.instructor.role,
      image_url: course.instructor.image_url,
      image_upload_path: course.instructor.image_upload_path,
      bio: course.instructor.bio,
    } : null,
  });
});

