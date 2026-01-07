import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Валидация email
export const emailSchema = z.string().email().min(1).max(255);

// Валидация пароля
export const passwordSchema = z.string().min(8).max(100);

// Валидация slug
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы').min(1).max(255);

// Валидация URL
export const urlSchema = z.string().url().max(2048).or(z.literal(''));

// Валидация текста
export const textSchema = z.string().min(1).max(10000);

// Валидация длинного текста
export const longTextSchema = z.string().min(1).max(50000);

// Валидация массива строк
export const stringArraySchema = z.array(z.string()).max(50);

// Валидация даты
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Валидация логина
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Middleware для валидации запросов
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Ошибка валидации',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Ошибка валидации данных' });
    }
  };
};

// Санитизация строки (удаление опасных символов)
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Удаляем < и >
    .replace(/javascript:/gi, '') // Удаляем javascript:
    .replace(/on\w+=/gi, ''); // Удаляем обработчики событий
};

// Санитизация объекта
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
};

// Middleware для санитизации входных данных
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

