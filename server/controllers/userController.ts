import { Request, Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { getAvatarUrl } from '../middleware/upload';

const pool = new Pool(getDatabaseConfig());
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  phone?: string;
  referral_code?: string;
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

  // Обработка реферального кода (если передан)
  if (req.body.referral_code) {
    try {
      // Импортируем функцию отслеживания регистрации
      const { trackRegistration } = await import('./referralTrackingController');
      // Вызываем напрямую логику отслеживания
      await trackRegistration(
        { body: { referral_code: req.body.referral_code, user_id: user.id } } as any,
        { json: () => {}, status: () => ({ json: () => {} }) } as any,
        () => {}
      );
    } catch (error) {
      // Не прерываем регистрацию, если ошибка с реферальным кодом
      console.error('Error tracking referral registration:', error);
    }
  }

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

// Обновление профиля пользователя
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new AppError('Пользователь не аутентифицирован', 401);
  }

  const { name, email, phone, avatar_url, avatar_upload_path } = req.body;

  // Проверка существования пользователя
  const existingUser = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
  if (existingUser.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверка уникальности email (если изменился)
  if (email && email !== existingUser.rows[0].email) {
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    if (emailCheck.rows.length > 0) {
      throw new AppError('Пользователь с таким email уже существует', 409);
    }
  }

  // Формируем запрос на обновление
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email) {
    updates.push(`email = $${paramIndex++}`);
    values.push(email);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(phone);
  }
  if (avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(avatar_url);
  }
  if (avatar_upload_path !== undefined) {
    updates.push(`avatar_upload_path = $${paramIndex++}`);
    values.push(avatar_upload_path);
  }

  if (updates.length === 0) {
    throw new AppError('Нет данных для обновления', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await pool.query(
    `UPDATE users 
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, name, phone, avatar_url, avatar_upload_path, created_at, updated_at`,
    values
  );

  res.json({ user: result.rows[0] });
});

// Смена пароля пользователя
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new AppError('Пользователь не аутентифицирован', 401);
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new AppError('Старый и новый пароль обязательны', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Новый пароль должен быть не менее 6 символов', 400);
  }

  // Получаем текущий пароль
  const result = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверяем старый пароль
  const isPasswordValid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
  if (!isPasswordValid) {
    throw new AppError('Неверный старый пароль', 401);
  }

  // Хешируем новый пароль
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Обновляем пароль
  await pool.query(
    `UPDATE users 
     SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [newPasswordHash, userId]
  );

  res.json({ message: 'Пароль успешно изменен' });
});

// Загрузка аватара пользователя
export const uploadUserAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new AppError('Пользователь не аутентифицирован', 401);
  }

  if (!req.file) {
    throw new AppError('Файл не был загружен', 400);
  }

  const filename = req.file.filename;
  const avatarUrl = getAvatarUrl(filename);

  // Обновляем путь к аватару в БД
  await pool.query(
    `UPDATE users 
     SET avatar_upload_path = $1, avatar_url = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [filename, userId]
  );

  res.json({ filename, url: avatarUrl });
});

