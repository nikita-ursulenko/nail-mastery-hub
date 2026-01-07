import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// Создаем папку для загрузок, если её нет
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// Фильтр файлов (только изображения)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp)'));
  }
};

// Настройка multer
export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// Функция для получения URL загруженного файла
export const getAvatarUrl = (filename: string): string => {
  return `/uploads/avatars/${filename}`;
};

// Создаем папку для загрузок основателя, если её нет
const founderUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'founder');
if (!fs.existsSync(founderUploadsDir)) {
  fs.mkdirSync(founderUploadsDir, { recursive: true });
}

// Настройка хранилища для изображений основателя
const founderStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, founderUploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `founder-${uniqueSuffix}${ext}`);
  },
});

// Настройка multer для изображений основателя
export const uploadFounderImage = multer({
  storage: founderStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// Функция для получения URL загруженного изображения основателя
export const getFounderImageUrl = (filename: string): string => {
  return `/uploads/founder/${filename}`;
};

// Создаем папку для загрузок команды, если её нет
const teamUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'team');
if (!fs.existsSync(teamUploadsDir)) {
  fs.mkdirSync(teamUploadsDir, { recursive: true });
}

// Настройка хранилища для изображений команды
const teamStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, teamUploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `team-${uniqueSuffix}${ext}`);
  },
});

// Настройка multer для изображений команды
export const uploadTeamImage = multer({
  storage: teamStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// Функция для получения URL загруженного изображения команды
export const getTeamImageUrl = (filename: string): string => {
  return `/uploads/team/${filename}`;
};

