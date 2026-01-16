import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// Получить курсы пользователя
export const getUserEnrollments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      progress_percent,
      lessons_completed,
      total_lessons,
      purchased_at,
      payment_status,
      amount_paid,
      course:courses (
        id,
        slug,
        title,
        subtitle,
        image_url,
        image_upload_path
      ),
      tariff:course_tariffs (
        id,
        name,
        tariff_type,
        price
      )
    `)
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Supabase error fetching enrollments:', error);
    throw new AppError('Ошибка при получении курсов пользователя', 500);
  }

  const formattedEnrollments = (enrollments || []).map((row: any) => ({
    enrollment_id: row.id,
    status: row.status,
    progress_percent: row.progress_percent,
    lessons_completed: row.lessons_completed,
    total_lessons: row.total_lessons,
    purchased_at: row.purchased_at,
    payment_status: row.payment_status,
    amount_paid: row.amount_paid,
    course: {
      id: row.course.id,
      slug: row.course.slug,
      title: row.course.title,
      subtitle: row.course.subtitle,
      image_url: (() => {
        const path = row.course.image_upload_path;
        if (path) {
          if (path.startsWith('/uploads/')) return path;
          return `/uploads/${path}`;
        }
        return row.course.image_url || null;
      })(),
    },
    tariff: {
      id: row.tariff.id,
      name: row.tariff.name,
      type: row.tariff.tariff_type,
      price: row.tariff.price,
    },
  }));

  res.json({ enrollments: formattedEnrollments });
});

// Добавить курс пользователю
export const addUserEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { courseId, tariffId } = req.body;

  if (!courseId || !tariffId) {
    throw new AppError('courseId и tariffId обязательны', 400);
  }

  // Проверяем, что пользователь существует
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверяем, что курс существует
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('is_active', true)
    .single();

  if (courseError || !course) {
    throw new AppError('Курс не найден', 404);
  }

  // Проверяем тариф
  const { data: tariff, error: tariffError } = await supabase
    .from('course_tariffs')
    .select('id, price')
    .eq('id', tariffId)
    .eq('course_id', courseId)
    .eq('is_active', true)
    .single();

  if (tariffError || !tariff) {
    throw new AppError('Тариф не найден', 404);
  }

  // Проверяем существование enrollment
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  // Получаем количество уроков
  const { count: totalLessons } = await supabase
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('is_preview', false); // Approximation if modules not linked directly in supbase query easily
  // Better logic: replicate join Logic

  // Alternative for total lessons query:
  // Using direct SQL replacement is hard. Let's simplify or skip exact count if not critical, 
  // OR fetch all modules and sum lessons.

  const { data: modules } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId);

  let calculatedTotal = 0;
  if (modules && modules.length > 0) {
    const moduleIds = modules.map(m => m.id);
    const { count } = await supabase
      .from('course_lessons')
      .select('id', { count: 'exact', head: true })
      .in('module_id', moduleIds);
    calculatedTotal = count || 0;
  }

  if (existingEnrollment) {
    // Update
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        tariff_id: tariffId,
        payment_status: 'paid',
        amount_paid: tariff.price,
        status: 'active',
        purchased_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (updateError) throw new AppError('Ошибка при обновлении курса', 500);
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        tariff_id: tariffId,
        payment_status: 'paid',
        amount_paid: tariff.price,
        status: 'active',
        purchased_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        total_lessons: calculatedTotal
      });

    if (insertError) throw new AppError('Ошибка при добавлении курса', 500);
  }

  res.json({ message: 'Курс успешно добавлен пользователю' });
});

// Удалить курс у пользователя
export const removeUserEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, enrollmentId } = req.params;

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('Ошибка при удалении курса', 500);
  }

  res.json({ message: 'Курс успешно удален у пользователя' });
});

// Изменить тариф курса пользователя
export const updateUserEnrollmentTariff = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, enrollmentId } = req.params;
  const { tariffId } = req.body;

  if (!tariffId) {
    throw new AppError('tariffId обязателен', 400);
  }

  // Get current enrollment to find course_id
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('id', enrollmentId)
    .eq('user_id', userId)
    .single();

  if (enrollmentError || !enrollment) {
    throw new AppError('Запись на курс не найдена', 404);
  }

  const courseId = enrollment.course_id;

  // Check tariff
  const { data: tariff, error: tariffError } = await supabase
    .from('course_tariffs')
    .select('id, price')
    .eq('id', tariffId)
    .eq('course_id', courseId)
    .eq('is_active', true)
    .single();

  if (tariffError || !tariff) {
    throw new AppError('Тариф не найден', 404);
  }

  // Update
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      tariff_id: tariffId,
      amount_paid: tariff.price,
      updated_at: new Date().toISOString()
    })
    .eq('id', enrollmentId);

  if (updateError) {
    throw new AppError('Ошибка при обновлении тарифа', 500);
  }

  res.json({ message: 'Тариф успешно изменен' });
});

