import { Request, Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

// Получить SEO настройки по пути
export const getSEOByPath = asyncHandler(async (req: Request, res: Response) => {
  const { path } = req.params;
  
  // Нормализуем путь: убираем начальный слэш, добавляем если пусто
  let normalizedPath = path || '';
  if (normalizedPath && !normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  if (!normalizedPath) {
    normalizedPath = '/';
  }

  const result = await pool.query(
    'SELECT * FROM seo_settings WHERE path = $1',
    [normalizedPath]
  );

  if (result.rows.length === 0) {
    // Возвращаем дефолтные значения
    return res.json({
      path: normalizedPath,
      title: 'NailArt Academy — Онлайн-курсы маникюра',
      description: 'Онлайн-школа маникюра для начинающих и профессионалов. Освойте профессию nail-мастера и начните зарабатывать от 1 000 € в месяц.',
      keywords: null,
      og_title: 'NailArt Academy — Онлайн-курсы маникюра',
      og_description: 'Онлайн-школа маникюра для начинающих и профессионалов. Освойте профессию nail-мастера.',
      og_image: 'https://lovable.dev/opengraph-image-p98pqg.png',
      og_type: 'website',
      og_url: null,
      twitter_card: 'summary_large_image',
      twitter_title: null,
      twitter_description: null,
      twitter_image: 'https://lovable.dev/opengraph-image-p98pqg.png',
      canonical_url: null,
      robots: 'index, follow',
    });
  }

  res.json(result.rows[0]);
});

// Получить все SEO настройки (для админки)
export const getAllSEO = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM seo_settings ORDER BY path ASC'
  );
  res.json(result.rows);
});

// Получить SEO по ID (для админки)
export const getSEOById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT * FROM seo_settings WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('SEO настройки не найдены', 404);
  }

  res.json(result.rows[0]);
});

// Создать или обновить SEO настройки
export const upsertSEO = asyncHandler(async (req: Request, res: Response) => {
  const {
    path,
    title,
    description,
    keywords,
    og_title,
    og_description,
    og_image,
    og_type,
    og_url,
    twitter_card,
    twitter_title,
    twitter_description,
    twitter_image,
    canonical_url,
    robots,
  } = req.body;

  // Валидация обязательных полей
  if (!path || !title || !description) {
    throw new AppError('Путь, заголовок и описание обязательны', 400);
  }

  // Нормализуем путь
  let normalizedPath = path;
  if (normalizedPath && !normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  if (!normalizedPath || normalizedPath === '') {
    normalizedPath = '/';
  }

  // Проверяем, существует ли запись
  const existing = await pool.query(
    'SELECT id FROM seo_settings WHERE path = $1',
    [normalizedPath]
  );

  if (existing.rows.length > 0) {
    // Обновляем существующую запись
    const result = await pool.query(
      `UPDATE seo_settings SET
        title = $1,
        description = $2,
        keywords = $3,
        og_title = $4,
        og_description = $5,
        og_image = $6,
        og_type = $7,
        og_url = $8,
        twitter_card = $9,
        twitter_title = $10,
        twitter_description = $11,
        twitter_image = $12,
        canonical_url = $13,
        robots = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE path = $15
      RETURNING *`,
      [
        title,
        description,
        keywords || null,
        og_title || title,
        og_description || description,
        og_image || null,
        og_type || 'website',
        og_url || null,
        twitter_card || 'summary_large_image',
        twitter_title || og_title || title,
        twitter_description || og_description || description,
        twitter_image || og_image || null,
        canonical_url || null,
        robots || 'index, follow',
        normalizedPath,
      ]
    );

    res.json(result.rows[0]);
  } else {
    // Создаем новую запись
    const result = await pool.query(
      `INSERT INTO seo_settings (
        path, title, description, keywords, og_title, og_description,
        og_image, og_type, og_url, twitter_card, twitter_title,
        twitter_description, twitter_image, canonical_url, robots
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        normalizedPath,
        title,
        description,
        keywords || null,
        og_title || title,
        og_description || description,
        og_image || null,
        og_type || 'website',
        og_url || null,
        twitter_card || 'summary_large_image',
        twitter_title || og_title || title,
        twitter_description || og_description || description,
        twitter_image || og_image || null,
        canonical_url || null,
        robots || 'index, follow',
      ]
    );

    res.status(201).json(result.rows[0]);
  }
});

// Удалить SEO настройки
export const deleteSEO = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM seo_settings WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('SEO настройки не найдены', 404);
  }

  res.json({ message: 'SEO настройки удалены', deleted: result.rows[0] });
});

