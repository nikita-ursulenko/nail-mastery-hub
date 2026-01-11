import { Request, Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { generateUniqueReferralCode } from '../utils/referralCodeGenerator';
import { calculatePartnerLevel } from '../utils/referralLevel';

const pool = new Pool(getDatabaseConfig());
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
  const existingPartner = await pool.query(
    'SELECT id FROM referral_partners WHERE email = $1',
    [email]
  );
  
  if (existingPartner.rows.length > 0) {
    throw new AppError('Партнер с таким email уже существует', 409);
  }

  // Хеширование пароля
  const passwordHash = await bcrypt.hash(password, 10);

  // Генерация уникального реферального кода
  const referralCode = await generateUniqueReferralCode();

  // Создание партнера
  const result = await pool.query(
    `INSERT INTO referral_partners (email, password_hash, name, phone, referral_code, level)
     VALUES ($1, $2, $3, $4, $5, 'novice')
     RETURNING id, email, name, phone, referral_code, total_earnings, current_balance, 
               withdrawn_amount, is_active, level, created_at`,
    [email, passwordHash, name, phone || null, referralCode]
  );

  const partner = result.rows[0];

  // Генерация JWT токена
  const token = jwt.sign(
    { id: partner.id, email: partner.email, role: 'referral' },
    REFERRAL_JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    token,
    partner: {
      id: partner.id,
      email: partner.email,
      name: partner.name,
      phone: partner.phone,
      referral_code: partner.referral_code,
      total_earnings: parseFloat(partner.total_earnings),
      current_balance: parseFloat(partner.current_balance),
      withdrawn_amount: parseFloat(partner.withdrawn_amount),
      is_active: partner.is_active,
      level: partner.level,
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
  const result = await pool.query(
    `SELECT id, email, password_hash, name, phone, referral_code, total_earnings, 
            current_balance, withdrawn_amount, is_active, level 
     FROM referral_partners WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Неверный email или пароль', 401);
  }

  const partner = result.rows[0];

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
      id: partner.id,
      email: partner.email,
      name: partner.name,
      phone: partner.phone,
      referral_code: partner.referral_code,
      total_earnings: parseFloat(partner.total_earnings),
      current_balance: parseFloat(partner.current_balance),
      withdrawn_amount: parseFloat(partner.withdrawn_amount),
      is_active: partner.is_active,
      level: partner.level,
    },
  });
});

/**
 * Проверка токена реферала
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // Если middleware authenticateReferralToken прошел, значит токен валидный
  // req.referral уже установлен в middleware
  const referral = (req as any).referral;

  if (!referral) {
    throw new AppError('Токен недействителен', 401);
  }

  // Получаем полную информацию о партнере
  const result = await pool.query(
    `SELECT id, email, name, phone, referral_code, total_earnings, 
            current_balance, withdrawn_amount, is_active, level 
     FROM referral_partners WHERE id = $1`,
    [referral.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Партнер не найден', 404);
  }

  const partner = result.rows[0];

  res.json({
    valid: true,
    partner: {
      id: partner.id,
      email: partner.email,
      name: partner.name,
      phone: partner.phone,
      referral_code: partner.referral_code,
      total_earnings: parseFloat(partner.total_earnings),
      current_balance: parseFloat(partner.current_balance),
      withdrawn_amount: parseFloat(partner.withdrawn_amount),
      is_active: partner.is_active,
      level: partner.level,
    },
  });
});
