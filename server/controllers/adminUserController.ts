import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

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

  let query = supabase
    .from('users')
    .select('id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at', { count: 'exact' });

  if (search) {
    const searchTerm = `%${(search as string).toLowerCase()}%`;
    query = query.or(`email.ilike.${searchTerm},name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
  }

  const { data: users, count: total, error } = await query
    .order('created_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1);

  if (error) throw error;

  const formattedUsers = users?.map((user: any) => ({
    ...user,
    avatar_url: user.avatar_upload_path
      ? `/uploads/avatars/${user.avatar_upload_path}`
      : user.avatar_url || null,
  })) || [];

  res.json({ users: formattedUsers, total: total || 0 });
});

// Получить пользователя по ID
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    throw new AppError('Пользователь не найден', 404);
  }

  const formattedUser = {
    ...user,
    avatar_url: user.avatar_upload_path
      ? `/uploads/avatars/${user.avatar_upload_path}`
      : user.avatar_url || null,
  };

  res.json({ user: formattedUser });
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
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    throw new AppError('Пользователь с таким email уже существует', 409);
  }

  // Хеширование пароля
  const passwordHash = await bcrypt.hash(password, 10);

  // Создание пользователя
  const { data: user, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        password_hash: passwordHash,
        name,
        phone: phone || null,
        avatar_url: avatar_url || null,
        avatar_upload_path: avatar_upload_path || null,
        is_active: is_active !== undefined ? is_active : true,
        email_verified: email_verified !== undefined ? email_verified : false,
      }
    ])
    .select('id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at')
    .single();

  if (error || !user) throw error;

  const formattedUser = {
    ...user,
    avatar_url: user.avatar_upload_path
      ? `/uploads/avatars/${user.avatar_upload_path}`
      : user.avatar_url || null,
  };

  res.status(201).json({ user: formattedUser });
});

// Обновить пользователя
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { email, password, name, phone, avatar_url, avatar_upload_path, is_active, email_verified }: User = req.body;

  // Проверка существования пользователя
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', id)
    .single();

  if (checkError || !existingUser) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверка уникальности email (если изменился)
  if (email && email !== existingUser.email) {
    const { data: emailCheck } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .maybeSingle();

    if (emailCheck) {
      throw new AppError('Пользователь с таким email уже существует', 409);
    }
  }

  // Формируем объект обновлений
  const updates: any = {
    updated_at: new Date().toISOString()
  };

  if (email !== undefined) updates.email = email;
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (avatar_upload_path !== undefined) updates.avatar_upload_path = avatar_upload_path;
  if (is_active !== undefined) updates.is_active = is_active;
  if (email_verified !== undefined) updates.email_verified = email_verified;

  if (password) {
    if (password.length < 6) {
      throw new AppError('Пароль должен быть не менее 6 символов', 400);
    }
    updates.password_hash = await bcrypt.hash(password, 10);
  }

  const { data: user, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at')
    .single();

  if (updateError || !user) throw updateError;

  const formattedUser = {
    ...user,
    avatar_url: user.avatar_upload_path
      ? `/uploads/avatars/${user.avatar_upload_path}`
      : user.avatar_url || null,
  };

  res.json({ user: formattedUser });
});

// Удалить пользователя
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('Ошибка при удалении пользователя или пользователь не найден', 404);
  }

  res.json({ message: 'Пользователь успешно удален' });
});

// Переключить статус активности пользователя
export const toggleUserActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Сначала получаем текущий статус
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', id)
    .single();

  if (findError || !user) {
    throw new AppError('Пользователь не найден', 404);
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, email, name, phone, avatar_url, avatar_upload_path, is_active, email_verified, created_at, updated_at')
    .single();

  if (updateError || !updatedUser) throw updateError;

  const formattedUser = {
    ...updatedUser,
    avatar_url: updatedUser.avatar_upload_path
      ? `/uploads/avatars/${updatedUser.avatar_upload_path}`
      : updatedUser.avatar_url || null,
  };

  res.json({ user: formattedUser });
});

