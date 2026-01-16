import { Request, Response } from 'express';
import { supabase } from '../../database/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { getAvatarUrl } from '../middleware/upload';

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
  const { data: existingUser, error: checkError } = await supabase
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
  const { data: user, error: insertError } = await supabase
    .from('users')
    .insert([
      { email, password_hash: passwordHash, name, phone: phone || null }
    ])
    .select('id, email, name, phone, avatar_url, avatar_upload_path, created_at')
    .single();

  if (insertError || !user) {
    console.error('Supabase error:', insertError);
    throw new AppError('Ошибка при регистрации пользователя', 500);
  }

  // Обработка реферального кода (если передан)
  if (req.body.referral_code) {
    try {
      // Импортируем функцию отслеживания регистрации
      const { trackRegistration } = await import('./referralTrackingController');
      // Вызываем напрямую логику отслеживания
      await trackRegistration(
        { body: { referral_code: req.body.referral_code, user_id: user.id } } as any,
        { json: () => { }, status: () => ({ json: () => { } }) } as any,
        () => { }
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
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('id, email, password_hash, name, phone, avatar_url, avatar_upload_path, is_active')
    .eq('email', email)
    .single();

  if (findError || !user) {
    throw new AppError('Неверный email или пароль', 401);
  }

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
  // Получаем пользователя из req.user (будет установлено в middleware)
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new AppError('Токен недействителен', 401);
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, phone, avatar_url, avatar_upload_path')
    .eq('id', userId)
    .eq('is_active', true)
    .single();

  if (error || !user) {
    throw new AppError('Пользователь не найден', 404);
  }

  res.json({
    valid: true,
    user: user,
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
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .single();

  if (findError || !existingUser) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверка уникальности email (если изменился)
  if (email && email !== existingUser.email) {
    const { data: emailCheck } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (emailCheck) {
      throw new AppError('Пользователь с таким email уже существует', 409);
    }
  }

  // Формируем объект обновлений
  const updates: any = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (avatar_upload_path !== undefined) updates.avatar_upload_path = avatar_upload_path;

  if (Object.keys(updates).length === 0) {
    throw new AppError('Нет данных для обновления', 400);
  }

  updates.updated_at = new Date().toISOString();

  const { data: user, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, name, phone, avatar_url, avatar_upload_path, created_at, updated_at')
    .single();

  if (updateError) {
    console.error('Supabase error:', updateError);
    throw new AppError('Ошибка при обновлении профиля', 500);
  }

  res.json({ user });
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
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (findError || !user) {
    throw new AppError('Пользователь не найден', 404);
  }

  // Проверяем старый пароль
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Неверный старый пароль', 401);
  }

  // Хешируем новый пароль
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Обновляем пароль
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    console.error('Supabase error:', updateError);
    throw new AppError('Ошибка при смене пароля', 500);
  }

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
  const { error } = await supabase
    .from('users')
    .update({
      avatar_upload_path: filename,
      avatar_url: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Supabase error:', error);
    throw new AppError('Ошибка при сохранении аватара', 500);
  }

  res.json({ filename, url: avatarUrl });
});

