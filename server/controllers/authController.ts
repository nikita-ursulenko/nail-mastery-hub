import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../../database/config';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Нормализуем email
    const normalizedEmail = email.trim().toLowerCase();

    // Ищем админа по email через Supabase
    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, email, password_hash, name')
      .ilike('email', normalizedEmail)
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      throw new AppError('Ошибка при входе в систему', 500);
    }

    if (!admins || admins.length === 0) {
      // Используем одинаковое сообщение для предотвращения перебора email
      throw new AppError('Неверный email или пароль', 401);
    }

    const admin = admins[0];

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      // Используем одинаковое сообщение для предотвращения перебора паролей
      throw new AppError('Неверный email или пароль', 401);
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Login error:', error);
    throw new AppError('Ошибка при входе в систему', 500);
  }
};

export const logout = (req: Request, res: Response) => {
  // В случае JWT, logout происходит на клиенте (удаление токена)
  res.json({ message: 'Выход выполнен успешно' });
};

export const verifyToken = (req: Request, res: Response) => {
  // Если middleware authenticateToken прошел, токен валиден
  res.json({
    valid: true,
    admin: (req as any).admin
  });
};
