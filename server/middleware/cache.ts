import { Request, Response, NextFunction } from 'express';

// Простой in-memory кэш для статических данных
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live в миллисекундах
}

const cache = new Map<string, CacheEntry>();

// Очистка устаревших записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Middleware для кэширования ответов
export const cacheMiddleware = (ttl: number = 5 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Кэшируем только GET запросы
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.path}${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      // Устанавливаем заголовки кэширования
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Сохраняем оригинальный метод res.json
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Кэшируем ответ
      cache.set(cacheKey, {
        data: body,
        timestamp: Date.now(),
        ttl,
      });
      
      // Устанавливаем заголовки кэширования
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
      res.setHeader('X-Cache', 'MISS');
      
      return originalJson(body);
    };

    next();
  };
};

// Очистка кэша для конкретного пути
export const clearCache = (pattern: string) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

