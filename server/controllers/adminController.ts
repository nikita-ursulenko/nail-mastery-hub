import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Количество пользователей
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // 2. Активные пользователи (за последние 30 дней)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Получаем количество уникальных user_id из enrollments за последние 30 дней
    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('enrollments')
      .select('user_id')
      .gte('purchased_at', thirtyDaysAgo.toISOString());

    if (activeUsersError) throw activeUsersError;
    const activeUsers = new Set(activeUsersData?.map(e => e.user_id)).size;

    // 3. Новые пользователи за сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday, error: newUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (newUsersError) throw newUsersError;

    // 4. Активные курсы
    const { count: totalCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (coursesError) throw coursesError;

    // 5. Посты блога
    const { count: totalPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (postsError) throw postsError;

    // 6. Общий доход от продаж
    const { data: revenueData, error: revenueError } = await supabase
      .from('enrollments')
      .select('amount_paid')
      .eq('payment_status', 'paid');

    if (revenueError) throw revenueError;
    const totalRevenue = revenueData?.reduce((sum, e) => sum + (parseFloat(e.amount_paid as any) || 0), 0) || 0;

    // 7. Количество активных enrollments
    const { count: activeEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('payment_status', 'paid');

    if (enrollmentsError) throw enrollmentsError;

    // 8. Количество завершенных курсов
    const { count: completedCourses, error: completedError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (completedError) throw completedError;

    // 9. Покупки за сегодня
    const { data: todayOrdersData, error: todayOrdersError } = await supabase
      .from('enrollments')
      .select('amount_paid')
      .eq('payment_status', 'paid')
      .gte('purchased_at', today.toISOString());

    if (todayOrdersError) throw todayOrdersError;
    const todayOrders = todayOrdersData?.length || 0;
    const todayRevenue = todayOrdersData?.reduce((sum, e) => sum + (parseFloat(e.amount_paid as any) || 0), 0) || 0;

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers,
      newUsersToday: newUsersToday || 0,
      totalCourses: totalCourses || 0,
      totalPosts: totalPosts || 0,
      totalRevenue,
      activeEnrollments: activeEnrollments || 0,
      completedCourses: completedCourses || 0,
      todayOrders,
      todayRevenue,
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
};

