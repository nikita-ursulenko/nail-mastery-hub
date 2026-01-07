import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const pool = new Pool(getDatabaseConfig());

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Получаем количество пользователей
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Активные пользователи (за последние 30 дней)
    const activeUsersResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) 
       FROM enrollments 
       WHERE purchased_at >= CURRENT_DATE - INTERVAL '30 days'`
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count || '0');

    // Новые пользователи за сегодня
    const newUsersTodayResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE`
    );
    const newUsersToday = parseInt(newUsersTodayResult.rows[0].count || '0');

    // Получаем количество курсов (используем is_active вместо status)
    const coursesResult = await pool.query('SELECT COUNT(*) FROM courses WHERE is_active = TRUE');
    const totalCourses = parseInt(coursesResult.rows[0].count);

    // Получаем количество постов блога (используем is_active вместо status)
    const postsResult = await pool.query('SELECT COUNT(*) FROM blog_posts WHERE is_active = TRUE');
    const totalPosts = parseInt(postsResult.rows[0].count);

    // Общий доход от продаж
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0) as total_revenue
       FROM enrollments
       WHERE payment_status = 'paid'`
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue || '0');

    // Количество активных enrollments
    const activeEnrollmentsResult = await pool.query(
      `SELECT COUNT(*) FROM enrollments WHERE status = 'active' AND payment_status = 'paid'`
    );
    const activeEnrollments = parseInt(activeEnrollmentsResult.rows[0].count || '0');

    // Количество завершенных курсов
    const completedCoursesResult = await pool.query(
      `SELECT COUNT(*) FROM enrollments WHERE status = 'completed'`
    );
    const completedCourses = parseInt(completedCoursesResult.rows[0].count || '0');

    // Покупки за сегодня
    const todayOrdersResult = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount_paid), 0) as revenue
       FROM enrollments
       WHERE payment_status = 'paid' AND DATE(purchased_at) = CURRENT_DATE`
    );
    const todayOrders = parseInt(todayOrdersResult.rows[0].total || '0');
    const todayRevenue = parseFloat(todayOrdersResult.rows[0].revenue || '0');

    const stats = {
      totalUsers,
      activeUsers,
      newUsersToday,
      totalCourses,
      totalPosts,
      totalRevenue,
      activeEnrollments,
      completedCourses,
      todayOrders,
      todayRevenue,
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
};

