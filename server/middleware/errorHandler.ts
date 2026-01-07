import { Request, Response, NextFunction } from 'express';

// Кастомный класс ошибок
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Обработчик ошибок
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Логируем ошибку
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Если это наша кастомная ошибка
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Ошибки базы данных
  if (err.name === 'ValidationError' || err.message.includes('validation')) {
    return res.status(400).json({
      error: 'Ошибка валидации данных',
    });
  }

  // Ошибки JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Недействительный токен',
    });
  }

  // Общая ошибка сервера (не раскрываем детали в production)
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Внутренняя ошибка сервера';

  return res.status(statusCode).json({
    error: message,
  });
};

// Обработчик для несуществующих роутов
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    error: 'Маршрут не найден',
  });
};

