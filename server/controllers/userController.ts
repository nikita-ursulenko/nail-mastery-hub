import { Request, Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// Регистрация пользователя
export const register = asyncHandler(async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  const { email, password, name, phone } = req.body;

  // Валидация
  if (!email || !password || !name) {
    throw new AppError('Email, пароль и имя обязательны', 400);
  }

  if (password.length < 6) {
    throw new AppError('Пароль должен быть не менее 6 символов', 400);
  }

  // Проверка, существует ли пользователь
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('Пользователь с таким email уже существует', 409);
  }

  // Хеширование пароля
  const passwordHash = await bcrypt.hash(password, 10);

  // Создание пользователя
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, phone, avatar_url, avatar_upload_path, created_at`,
    [email, passwordHash, name, phone || null]
  );

  const user = result.rows[0];

  // Генерация JWT токена
  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      avatar_upload_path: user.avatar_upload_path,
    },
  });
});

// Вход пользователя
export const login = asyncHandler(async (req: Request<{}, {}, LoginBody>, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email и пароль обязательны', 400);
  }

  // Поиск пользователя
  const result = await pool.query(
    'SELECT id, email, password_hash, name, phone, avatar_url, avatar_upload_path, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Неверный email или пароль', 401);
  }

  const user = result.rows[0];

  // Проверка активности
  if (!user.is_active) {
    throw new AppError('Аккаунт заблокирован', 403);
  }

  // Проверка пароля
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Неверный email или пароль', 401);
  }

  // Генерация JWT токена
  const token = jwt.sign(
    { id: user.id, email: user.email, role: 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      avatar_upload_path: user.avatar_upload_path,
    },
  });
});

// Проверка токена пользователя
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // Если middleware authenticateUserToken прошел, значит токен валиден
  // Получаем пользователя из req.user (будет установлено в middleware)
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new AppError('Токен недействителен', 401);
  }

  const result = await pool.query(
    'SELECT id, email, name, phone, avatar_url, avatar_upload_path FROM users WHERE id = $1 AND is_active = TRUE',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  res.json({
    valid: true,
    user: result.rows[0],
  });
});

