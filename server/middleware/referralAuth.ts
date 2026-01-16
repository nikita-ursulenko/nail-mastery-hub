import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../../database/config';

const REFERRAL_JWT_SECRET = process.env.REFERRAL_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface ReferralAuthRequest extends Request {
  referral?: {
    id: number;
    email: string;
    name: string;
  };
}

/**
 * Middleware для проверки JWT токена реферала
 * Добавляет информацию о реферале в req.referral
 */
export const authenticateReferralToken = async (
  req: ReferralAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    const token = authHeader.substring(7);

    // Проверяем токен
    const decoded = jwt.verify(token, REFERRAL_JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    // Проверяем, что это токен реферала
    if (decoded.role !== 'referral') {
      res.status(403).json({ error: 'Недостаточно прав доступа' });
      return;
    }

    // Проверяем, что партнер существует и активен
    const { data: partner, error } = await supabase
      .from('referral_partners')
      .select('id, email, name, is_active')
      .eq('id', decoded.id)
      .single();

    if (error || !partner) {
      res.status(401).json({ error: 'Партнер не найден' });
      return;
    }

    if (!partner.is_active) {
      res.status(403).json({ error: 'Аккаунт заблокирован' });
      return;
    }

    // Добавляем информацию о партнере в запрос
    req.referral = {
      id: partner.id,
      email: partner.email,
      name: partner.name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Недействительный токен' });
      return;
    }

    console.error('Error in authenticateReferralToken:', error);
    res.status(500).json({ error: 'Ошибка при проверке токена' });
  }
};
