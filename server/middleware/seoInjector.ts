import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const pool = new Pool(getDatabaseConfig());

// Кэш для HTML шаблона
let htmlTemplate: string | null = null;

// Функция для получения HTML шаблона
const getHtmlTemplate = (): string => {
  if (htmlTemplate) {
    return htmlTemplate;
  }

  // Путь к собранному index.html (в production) или исходному (в development)
  const distPath = path.join(process.cwd(), 'dist', 'index.html');
  const srcPath = path.join(process.cwd(), 'index.html');

  let htmlPath: string;
  if (fs.existsSync(distPath)) {
    htmlPath = distPath;
  } else if (fs.existsSync(srcPath)) {
    htmlPath = srcPath;
  } else {
    throw new Error('index.html not found');
  }

  htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');
  return htmlTemplate;
};

// Функция для нормализации пути
const normalizePath = (url: string): string => {
  // Убираем query параметры и hash
  const pathname = new URL(url, 'http://localhost').pathname;
  
  // Нормализуем путь
  if (pathname === '' || pathname === '/') {
    return '/';
  }
  
  // Убираем trailing slash (кроме корня)
  return pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname;
};

// Функция для получения SEO из статьи блога
const getBlogPostSEO = async (slug: string, baseUrl: string): Promise<any | null> => {
  try {
    const result = await pool.query(
      `SELECT title, excerpt, image_url, image_upload_path, author, category, tags
       FROM blog_posts 
       WHERE slug = $1 AND is_active = TRUE`,
      [slug]
    );

    if (result.rows.length > 0) {
      const post = result.rows[0];
      const imageUrl = post.image_upload_path
        ? `${baseUrl}/uploads/blog/${post.image_upload_path}`
        : post.image_url || `${baseUrl}/uploads/default-blog.jpg`;

      return {
        title: `${post.title} | NailArt Academy`,
        description: post.excerpt || post.title,
        keywords: post.tags ? post.tags.join(', ') : post.category,
        og_title: post.title,
        og_description: post.excerpt || post.title,
        og_image: imageUrl,
        og_type: 'article',
        og_url: `${baseUrl}/blog/${slug}`,
        twitter_card: 'summary_large_image',
        twitter_title: post.title,
        twitter_description: post.excerpt || post.title,
        twitter_image: imageUrl,
        canonical_url: `${baseUrl}/blog/${slug}`,
        robots: 'index, follow',
      };
    }
  } catch (error) {
    console.error('Error fetching blog post SEO:', error);
  }
  return null;
};

// Функция для получения SEO настроек из БД или автоматической генерации
const getSEOData = async (path: string, baseUrl: string): Promise<any> => {
  try {
    // Сначала проверяем, есть ли настройки в БД для этого пути
    const result = await pool.query(
      'SELECT * FROM seo_settings WHERE path = $1',
      [path]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Если это статья блога (/blog/:slug), пытаемся получить SEO из статьи
    if (path.startsWith('/blog/') && path !== '/blog') {
      const slug = path.replace('/blog/', '');
      const blogSEO = await getBlogPostSEO(slug, baseUrl);
      if (blogSEO) {
        return blogSEO;
      }
    }

    // Для других динамических путей можно добавить логику здесь
    // Например, для /courses/:id, /about и т.д.
  } catch (error) {
    console.error('Error fetching SEO data:', error);
  }

  // Возвращаем дефолтные значения
  return {
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
  };
};

// Функция для экранирования HTML
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Middleware для инжекции SEO мета-тегов
export const injectSeoMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Пропускаем API роуты и статические файлы
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/assets') ||
    req.path.startsWith('/src') ||
    req.path.startsWith('/@') || // Vite HMR
    req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i)
  ) {
    return next();
  }

  // Пропускаем если это не GET запрос
  if (req.method !== 'GET') {
    return next();
  }

  // Пропускаем если Accept заголовок не содержит text/html
  const accept = req.get('accept') || '';
  if (!accept.includes('text/html')) {
    return next();
  }

  try {
    // Получаем нормализованный путь
    const normalizedPath = normalizePath(req.url);
    
    // Получаем базовый URL для canonical и og:url
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const fullUrl = `${baseUrl}${normalizedPath}`;
    
    // Получаем SEO данные (передаем baseUrl для генерации полных URL)
    const seo = await getSEOData(normalizedPath, baseUrl);

    // Получаем HTML шаблон
    let html = getHtmlTemplate();

    // Заменяем плейсхолдеры (используем replaceAll для надежности)
    const replacements: [RegExp, string][] = [
      [/__TITLE__/g, escapeHtml(seo.title)],
      [/__DESCRIPTION__/g, escapeHtml(seo.description)],
      [/__KEYWORDS__/g, escapeHtml(seo.keywords || '')],
      [/__OG_TITLE__/g, escapeHtml(seo.og_title || seo.title)],
      [/__OG_DESCRIPTION__/g, escapeHtml(seo.og_description || seo.description)],
      [/__OG_IMAGE__/g, escapeHtml(seo.og_image || '')],
      [/__OG_TYPE__/g, escapeHtml(seo.og_type || 'website')],
      [/__OG_URL__/g, escapeHtml(seo.og_url || fullUrl)],
      [/__TWITTER_CARD__/g, escapeHtml(seo.twitter_card || 'summary_large_image')],
      [/__TWITTER_TITLE__/g, escapeHtml(seo.twitter_title || seo.og_title || seo.title)],
      [/__TWITTER_DESCRIPTION__/g, escapeHtml(seo.twitter_description || seo.og_description || seo.description)],
      [/__TWITTER_IMAGE__/g, escapeHtml(seo.twitter_image || seo.og_image || '')],
      [/__CANONICAL_URL__/g, escapeHtml(seo.canonical_url || fullUrl)],
      [/__ROBOTS__/g, escapeHtml(seo.robots || 'index, follow')],
    ];

    for (const [pattern, replacement] of replacements) {
      html = html.replace(pattern, replacement);
    }

    // Проверяем, что все плейсхолдеры заменены
    if (html.includes('__TITLE__') || html.includes('__DESCRIPTION__')) {
      console.warn('⚠️  Warning: Some placeholders were not replaced in HTML');
    }

    // Отправляем HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error in SEO injector:', error);
    // В случае ошибки просто отдаем оригинальный HTML
    try {
      const html = getHtmlTemplate();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (e) {
      next(error);
    }
  }
};

