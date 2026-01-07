import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const pool = new Pool(getDatabaseConfig());

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Здесь можно добавить запросы к БД для получения статистики
    // Пока возвращаем заглушку
    
    const stats = {
      totalUsers: 0,
      totalCourses: 0,
      totalOrders: 0,
      totalRevenue: 0,
    };

    // Пример запросов (когда таблицы будут созданы):
    // const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    // stats.totalUsers = parseInt(usersResult.rows[0].count);

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
};

