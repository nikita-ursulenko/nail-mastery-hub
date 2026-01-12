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
const normalizePath = (path: string): string => {
  // Убираем query параметры и hash
  const pathname = path.split('?')[0].split('#')[0];
  
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
    // Получаем нормализованный путь (req.path уже содержит путь без query параметров)
    const normalizedPath = normalizePath(req.path || '/');
    
    // Получаем базовый URL для canonical и og:url
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const fullUrl = `${baseUrl}${normalizedPath}`;
    
    // Получаем SEO данные (передаем baseUrl для генерации полных URL)
    const seo = await getSEOData(normalizedPath, baseUrl);

    // Получаем HTML шаблон
    let html = getHtmlTemplate();

    // Заменяем мета-теги используя регулярные выражения для поиска атрибутов content
    // Это работает как с плейсхолдерами, так и с дефолтными значениями
    
    // Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);
    
    // Description
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta name="description" content="${escapeHtml(seo.description)}" />`);
    
    // Keywords
    if (seo.keywords) {
      html = html.replace(/<meta\s+name=["']keywords["']\s+content=["'][^"']*["']\s*\/?>/, 
        `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`);
    }
    
    // Robots
    html = html.replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta name="robots" content="${escapeHtml(seo.robots || 'index, follow')}" />`);
    
    // Canonical URL
    html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/, 
      `<link rel="canonical" href="${escapeHtml(seo.canonical_url || fullUrl)}" />`);
    
    // Open Graph Title
    html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta property="og:title" content="${escapeHtml(seo.og_title || seo.title)}" />`);
    
    // Open Graph Description
    html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta property="og:description" content="${escapeHtml(seo.og_description || seo.description)}" />`);
    
    // Open Graph Image
    if (seo.og_image) {
      html = html.replace(/<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/, 
        `<meta property="og:image" content="${escapeHtml(seo.og_image)}" />`);
    }
    
    // Open Graph Type
    html = html.replace(/<meta\s+property=["']og:type["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta property="og:type" content="${escapeHtml(seo.og_type || 'website')}" />`);
    
    // Open Graph URL
    html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta property="og:url" content="${escapeHtml(seo.og_url || fullUrl)}" />`);
    
    // Twitter Card
    html = html.replace(/<meta\s+name=["']twitter:card["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta name="twitter:card" content="${escapeHtml(seo.twitter_card || 'summary_large_image')}" />`);
    
    // Twitter Title
    html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta name="twitter:title" content="${escapeHtml(seo.twitter_title || seo.og_title || seo.title)}" />`);
    
    // Twitter Description
    html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/, 
      `<meta name="twitter:description" content="${escapeHtml(seo.twitter_description || seo.og_description || seo.description)}" />`);
    
    // Twitter Image
    if (seo.twitter_image) {
      html = html.replace(/<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/, 
        `<meta name="twitter:image" content="${escapeHtml(seo.twitter_image)}" />`);
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

