import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

interface User {
  id?: number;
  email: string;
  password?: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  avatar_upload_path?: string | null;
  is_active?: boolean;
  email_verified?: boolean;
}

// Получить всех пользователей
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, limit, offset } = req.query;
  
  const pageLimit = limit ? parseInt(limit as string) : 50;
  const pageOffset = offset ? parseInt(offset as string) : 0;
  
  let query = `
    SELECT id, email, name, phone, avatar_url, avatar_upload_path, 
           is_active, email_verified, created_at, updated_at
    FROM users
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (LOWER(email) LIKE $${paramIndex} OR LOWER(name) LIKE $${paramIndex} OR phone LIKE $${paramIndex})`;
    params.push(`%${(search as string).toLowerCase()}%`);
    paramIndex++;
  }

  // Получаем общее количество
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Добавляем ORDER BY, LIMIT и OFFSET
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageLimit, pageOffset);

  const result = await pool.query(query, params);
  
  const users = result.rows.map((user: any) => ({
    ...user,
    avatar_url: user.avatar_upload_path 
      ? `/uploads/avatars/${user.avatar_upload_path}`
      : user.avatar_url || null,
  }));

  res.json({ users, total });
});

// Получить пользователя по ID
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const result = await pool.query(
    `SELECT id, email, name, phone, avatar_url, avatar_upload_path, 
            is_active, email_verified, created_at, updated_at
     FROM users 
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  const user = result.rows[0];
  user.avatar_url = user.avatar_upload_path 
    ? `/uploads/avatars/${user.avatar_upload_path}`
    : user.avatar_url || null;

  res.json({ user });
});

// Создать пользователя
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, name, phone, avatar_url, avatar_upload_path, is_active, email_verified }: User = req.body;

  // Валидация
  if (!email || !name) {
    throw new AppError('Email и имя обязательны', 400);
  }

  if (!password || password.length < 6) {
    throw new AppError('Пароль обязателен и должен быть не менее 6 символов', 400);
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
    `INSERT INTO users (email, password_hash, name, phone, avatar_url, avatar_upload_path, is_active, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at`,
    [
      email,
      passwordHash,
      name,
      phone || null,
      avatar_url || null,
      avatar_upload_path || null,
      is_active !== undefined ? is_active : true,
      email_verified !== undefined ? email_verified : false,
    ]
  );

  const user = result.rows[0];
  user.avatar_url = user.avatar_upload_path 
    ? `/uploads/avatars/${user.avatar_upload_path}`
    : user.avatar_url || null;

  res.status(201).json({ user });
});

// Обновить пользователя
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { email, password, name, phone, avatar_url, avatar_upload_path, is_active, email_verified }: User = req.body;

  // Проверка существования пользователя
  const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
  if (existingUser.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверка уникальности email (если изменился)
  if (email) {
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );
    if (emailCheck.rows.length > 0) {
      throw new AppError('Пользователь с таким email уже существует', 409);
    }
  }

  // Формируем запрос на обновление
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (email) {
    updates.push(`email = $${paramIndex++}`);
    values.push(email);
  }
  if (name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
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
  if (is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }
  if (email_verified !== undefined) {
    updates.push(`email_verified = $${paramIndex++}`);
    values.push(email_verified);
  }
  if (password) {
    if (password.length < 6) {
      throw new AppError('Пароль должен быть не менее 6 символов', 400);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    updates.push(`password_hash = $${paramIndex++}`);
    values.push(passwordHash);
  }

  if (updates.length === 0) {
    throw new AppError('Нет данных для обновления', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users 
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at`,
    values
  );

  const user = result.rows[0];
  user.avatar_url = user.avatar_upload_path 
    ? `/uploads/avatars/${user.avatar_upload_path}`
    : user.avatar_url || null;

  res.json({ user });
});

// Удалить пользователя
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Проверка существования пользователя
  const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
  if (existingUser.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Удаляем пользователя
  await pool.query('DELETE FROM users WHERE id = $1', [id]);

  res.json({ message: 'Пользователь успешно удален' });
});

// Переключить статус активности пользователя
export const toggleUserActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    `UPDATE users 
     SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Пользователь не найден', 404);
  }

  const user = result.rows[0];
  user.avatar_url = user.avatar_upload_path 
    ? `/uploads/avatars/${user.avatar_upload_path}`
    : user.avatar_url || null;

  res.json({ user });
});

