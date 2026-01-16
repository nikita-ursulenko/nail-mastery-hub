/**
 * Middleware для аутентификации пользователей (не админов)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../../database/config';

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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      if (error?.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Supabase error checking user:', error);
      }
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    // Добавляем пользователя в request
    req.user = user;
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

