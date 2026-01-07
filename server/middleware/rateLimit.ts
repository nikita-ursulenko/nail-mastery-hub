import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Очистка старых записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

// Получение IP адреса клиента
const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

// Rate limiting middleware
export const rateLimit = (options: {
  windowMs: number; // Время окна в миллисекундах
  max: number; // Максимальное количество запросов
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${getClientIp(req)}:${req.path}`;
    const now = Date.now();
    
    // Проверяем существующую запись
    if (store[key] && store[key].resetTime > now) {
      store[key].count++;
      
      if (store[key].count > options.max) {
        return res.status(429).json({
          error: options.message || 'Слишком много запросов. Попробуйте позже.',
        });
      }
    } else {
      // Создаем новую запись
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
    }
    
    // Сохраняем время ответа для skipSuccessfulRequests
    if (options.skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode < 400) {
          const key = `${getClientIp(req)}:${req.path}`;
          if (store[key]) {
            store[key].count = Math.max(0, store[key].count - 1);
          }
        }
        return originalSend.call(this, body);
      };
    }
    
    next();
  };
};

// Специфичные лимиты для разных эндпоинтов
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: 'Слишком много попыток входа. Попробуйте через 15 минут.',
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 100, // 100 запросов
  message: 'Слишком много запросов. Попробуйте позже.',
});

export const uploadRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 10, // 10 загрузок
  message: 'Слишком много загрузок. Попробуйте позже.',
});

