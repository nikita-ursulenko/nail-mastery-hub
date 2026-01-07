import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Magic bytes для проверки реального типа файла
const MAGIC_BYTES: { [key: string]: number[][] } = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (нужна дополнительная проверка)
};

// Проверка magic bytes файла
const checkMagicBytes = (filePath: string, expectedMime: string): boolean => {
  try {
    const buffer = fs.readFileSync(filePath);
    const magicBytes = MAGIC_BYTES[expectedMime];
    
    if (!magicBytes) {
      return true; // Если нет проверки для этого типа, пропускаем
    }
    
    for (const pattern of magicBytes) {
      let matches = true;
      for (let i = 0; i < pattern.length; i++) {
        if (buffer[i] !== pattern[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

// Проверка на path traversal
const isPathTraversal = (filename: string): boolean => {
  const normalized = path.normalize(filename);
  return normalized.includes('..') || path.isAbsolute(normalized);
};

// Middleware для дополнительной валидации загруженных файлов
export const validateUploadedFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Если файл не загружен, пропускаем (может быть опциональная загрузка)
  if (!req.file) {
    return next();
  }

  // Проверяем, что файл был успешно сохранен
  if (!req.file.path) {
    return res.status(400).json({ error: 'Ошибка при сохранении файла' });
  }

  const file = req.file;
  
  // Проверка на path traversal в имени файла
  if (isPathTraversal(file.originalname)) {
    return res.status(400).json({ error: 'Недопустимое имя файла' });
  }

  // Проверка расширения файла
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (!allowedExts.includes(ext)) {
    return res.status(400).json({ 
      error: 'Недопустимый тип файла. Разрешены только изображения.' 
    });
  }

  // Проверка MIME типа
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return res.status(400).json({ 
      error: 'Недопустимый MIME тип файла.' 
    });
  }

  // Проверка magic bytes (реальный тип файла)
  if (!checkMagicBytes(file.path, file.mimetype)) {
    // Удаляем загруженный файл, если он не прошел проверку
    fs.unlinkSync(file.path);
    return res.status(400).json({ 
      error: 'Файл не соответствует заявленному типу.' 
    });
  }

  // Проверка размера файла (дополнительная проверка)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ 
      error: 'Файл слишком большой. Максимальный размер: 10MB.' 
    });
  }

  next();
};

