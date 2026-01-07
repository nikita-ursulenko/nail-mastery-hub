import express from 'express';
import { getPublicTestimonials } from '../controllers/publicController';
import { getContacts } from '../controllers/contactsController';
import { getFounderInfo } from '../controllers/founderController';
import { getTeamMembers } from '../controllers/teamController';
import { getBlogPosts, getBlogPostBySlug } from '../controllers/blogController';
import { cacheMiddleware } from '../middleware/cache';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const router = express.Router();

// Публичные роуты (без авторизации) с кэшированием
// Кэш на 5 минут для статических данных
router.get('/testimonials', cacheMiddleware(5 * 60 * 1000), getPublicTestimonials);
router.get('/contacts', cacheMiddleware(10 * 60 * 1000), getContacts); // Контакты меняются реже
router.get('/founder', cacheMiddleware(10 * 60 * 1000), getFounderInfo);
router.get('/team', cacheMiddleware(10 * 60 * 1000), getTeamMembers);
router.get('/blog', cacheMiddleware(2 * 60 * 1000), getBlogPosts); // Блог обновляется чаще
router.get('/blog/:slug', cacheMiddleware(5 * 60 * 1000), getBlogPostBySlug);

// SEO route для получения SEO данных по пути (для Vite плагина)
router.get('/seo/*', async (req, res) => {
  const pool = new Pool(getDatabaseConfig());
  try {
    const path = req.params[0] || '/';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Проверяем БД
    const result = await pool.query(
      'SELECT * FROM seo_settings WHERE path = $1',
      [normalizedPath]
    );
    
    if (result.rows.length > 0) {
      await pool.end();
      return res.json(result.rows[0]);
    }
    
    // Если это статья блога, генерируем SEO
    if (normalizedPath.startsWith('/blog/') && normalizedPath !== '/blog') {
      const slug = normalizedPath.replace('/blog/', '');
      const blogResult = await pool.query(
        'SELECT title, excerpt, image_url, image_upload_path FROM blog_posts WHERE slug = $1 AND is_active = TRUE',
        [slug]
      );
      
      if (blogResult.rows.length > 0) {
        const post = blogResult.rows[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = post.image_upload_path
          ? `${baseUrl}/uploads/blog/${post.image_upload_path}`
          : post.image_url || '';
        
        await pool.end();
        return res.json({
          title: `${post.title} | NailArt Academy`,
          description: post.excerpt || post.title,
          og_title: post.title,
          og_description: post.excerpt || post.title,
          og_image: imageUrl,
          og_type: 'article',
          og_url: `${baseUrl}${normalizedPath}`,
          canonical_url: `${baseUrl}${normalizedPath}`,
          twitter_card: 'summary_large_image',
          twitter_title: post.title,
          twitter_description: post.excerpt || post.title,
          twitter_image: imageUrl,
          robots: 'index, follow',
        });
      }
    }
    
    await pool.end();
    
    // Дефолтные значения
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      title: 'NailArt Academy — Онлайн-курсы маникюра',
      description: 'Онлайн-школа маникюра для начинающих и профессионалов',
      og_title: 'NailArt Academy',
      og_description: 'Онлайн-школа маникюра для начинающих и профессионалов',
      og_image: 'https://lovable.dev/opengraph-image-p98pqg.png',
      og_type: 'website',
      og_url: `${baseUrl}${normalizedPath}`,
      canonical_url: `${baseUrl}${normalizedPath}`,
      twitter_card: 'summary_large_image',
      twitter_title: 'NailArt Academy',
      twitter_description: 'Онлайн-школа маникюра для начинающих и профессионалов',
      twitter_image: 'https://lovable.dev/opengraph-image-p98pqg.png',
      robots: 'index, follow',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ошибка получения SEO данных' });
  }
});

export default router;

