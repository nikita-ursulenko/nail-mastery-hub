import { Request, Response } from 'express';
import { supabase } from '../../database/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { generateUniqueReferralCode } from '../utils/referralCodeGenerator';

const REFERRAL_JWT_SECRET = process.env.REFERRAL_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

/**
 * Регистрация реферала-партнера
 */
export const register = asyncHandler(async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  const { email, password, name, phone } = req.body;

  // Валидация
  if (!email || !password || !name) {
    throw new AppError('Email, пароль и имя обязательны', 400);
  }

  if (password.length < 6) {
    throw new AppError('Пароль должен быть не менее 6 символов', 400);
  }

  // Проверка, существует ли партнер
  const { data: existingPartner } = await supabase
    .from('referral_partners')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingPartner) {
    throw new AppError('Партнер с таким email уже существует', 409);
  }

  // Хеширование пароля
  const passwordHash = await bcrypt.hash(password, 10);

  // Генерация уникального реферального кода
  const referralCode = await generateUniqueReferralCode();

  // Создание партнера
  const { data: partner, error } = await supabase
    .from('referral_partners')
    .insert([
      {
        email,
        password_hash: passwordHash,
        name,
        phone: phone || null,
        referral_code: referralCode,
        level: 'novice'
      }
    ])
    .select('id, email, name, phone, referral_code, total_earnings, current_balance, withdrawn_amount, is_active, level, created_at')
    .single();

  if (error || !partner) throw error;

  // Генерация JWT токена
  const token = jwt.sign(
    { id: partner.id, email: partner.email, role: 'referral' },
    REFERRAL_JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    token,
    partner: {
      ...partner,
      total_earnings: parseFloat(partner.total_earnings as any),
      current_balance: parseFloat(partner.current_balance as any),
      withdrawn_amount: parseFloat(partner.withdrawn_amount as any),
    },
  });
});

/**
 * Вход реферала-партнера
 */
export const login = asyncHandler(async (req: Request<{}, {}, LoginBody>, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email и пароль обязательны', 400);
  }

  // Поиск партнера
  const { data: partner, error } = await supabase
    .from('referral_partners')
    .select('id, email, password_hash, name, phone, referral_code, total_earnings, current_balance, withdrawn_amount, is_active, level')
    .eq('email', email)
    .maybeSingle();

  if (error || !partner) {
    throw new AppError('Неверный email или пароль', 401);
  }

  // Проверка активности
  if (!partner.is_active) {
    throw new AppError('Аккаунт заблокирован', 403);
  }

  // Проверка пароля
  const isPasswordValid = await bcrypt.compare(password, partner.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Неверный email или пароль', 401);
  }

  // Генерация JWT токена
  const token = jwt.sign(
    { id: partner.id, email: partner.email, role: 'referral' },
    REFERRAL_JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    partner: {
      ...partner,
      total_earnings: parseFloat(partner.total_earnings as any),
      current_balance: parseFloat(partner.current_balance as any),
      withdrawn_amount: parseFloat(partner.withdrawn_amount as any),
    },
  });
});

/**
 * Проверка токена реферала
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const referral = (req as any).referral;

  if (!referral) {
    throw new AppError('Токен недействителен', 401);
  }

  // Получаем полную информацию о партнере
  const { data: partner, error } = await supabase
    .from('referral_partners')
    .select('id, email, name, phone, referral_code, total_earnings, current_balance, withdrawn_amount, is_active, level')
    .eq('id', referral.id)
    .single();

  if (error || !partner) {
    throw new AppError('Партнер не найден', 404);
  }

  res.json({
    valid: true,
    partner: {
      ...partner,
      total_earnings: parseFloat(partner.total_earnings as any),
      current_balance: parseFloat(partner.current_balance as any),
      withdrawn_amount: parseFloat(partner.withdrawn_amount as any),
    },
  });
});
