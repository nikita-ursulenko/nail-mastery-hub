import { Request, Response } from 'express';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

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

  const { data: seo, error } = await supabase
    .from('seo_settings')
    .select('*')
    .eq('path', normalizedPath)
    .single();

  if (error || !seo) {
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

  res.json(seo);
});

// Получить все SEO настройки (для админки)
export const getAllSEO = asyncHandler(async (req: Request, res: Response) => {
  const { data: seoList, error } = await supabase
    .from('seo_settings')
    .select('*')
    .order('path', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw new AppError('Ошибка при получении SEO настроек', 500);
  }

  res.json(seoList);
});

// Получить SEO по ID (для админки)
export const getSEOById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data: seo, error } = await supabase
    .from('seo_settings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !seo) {
    throw new AppError('SEO настройки не найдены', 404);
  }

  res.json(seo);
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

  const { data: seo, error } = await supabase
    .from('seo_settings')
    .upsert({
      path: normalizedPath,
      title,
      description,
      keywords: keywords || null,
      og_title: og_title || title,
      og_description: og_description || description,
      og_image: og_image || null,
      og_type: og_type || 'website',
      og_url: og_url || null,
      twitter_card: twitter_card || 'summary_large_image',
      twitter_title: twitter_title || og_title || title,
      twitter_description: twitter_description || og_description || description,
      twitter_image: twitter_image || og_image || null,
      canonical_url: canonical_url || null,
      robots: robots || 'index, follow',
      updated_at: new Date().toISOString()
    }, { onConflict: 'path' })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new AppError('Ошибка при сохранении SEO настроек', 500);
  }

  res.json(seo);
});

// Удалить SEO настройки
export const deleteSEO = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: seo, error } = await supabase
    .from('seo_settings')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error || !seo) {
    throw new AppError('SEO настройки не найдены', 404);
  }

  res.json({ message: 'SEO настройки удалены', deleted: seo });
});

