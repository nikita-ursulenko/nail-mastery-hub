import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const pool = new Pool(getDatabaseConfig());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Нормализуем email (убираем пробелы, приводим к нижнему регистру)
    const normalizedEmail = email.trim().toLowerCase();

    // Проверяем, существует ли таблица admins
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return res.status(500).json({ 
        error: 'Таблица админов не найдена. Запустите миграции.' 
      });
    }

    // Ищем админа по email (также нормализуем email в запросе)
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM admins WHERE LOWER(TRIM(email)) = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const admin = result.rows[0];

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
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
    res.status(500).json({ error: 'Ошибка при входе в систему' });
  }
};

export const logout = (req: Request, res: Response) => {
  // В случае JWT, logout происходит на клиенте (удаление токена)
  // Но можно добавить blacklist токенов, если нужно
  res.json({ message: 'Выход выполнен успешно' });
};

export const verifyToken = (req: Request, res: Response) => {
  // Если middleware authenticateToken прошел, токен валиден
  res.json({ 
    valid: true,
    admin: (req as any).admin 
  });
};

