/**
 * Middleware для аутентификации пользователей (не админов)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const pool = new Pool(getDatabaseConfig());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedUserRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

/**
 * Middleware для проверки JWT токена пользователя
 */
export const authenticateUserToken = async (
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Проверяем, что это токен пользователя (не админа)
    if (decoded.role !== 'user') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    // Проверяем, существует ли пользователь в БД
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    // Добавляем пользователя в request
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Неверный токен' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Токен истек' });
    }
    console.error('User auth error:', error);
    return res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};

