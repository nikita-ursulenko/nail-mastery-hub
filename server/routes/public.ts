import express from 'express';
import { getPublicTestimonials } from '../controllers/publicController';
import { getContacts } from '../controllers/contactsController';
import { getFounderInfo } from '../controllers/founderController';
import { getTeamMembers } from '../controllers/teamController';
import { getBlogPosts, getBlogPostBySlug } from '../controllers/blogController';
import { getPublicCourses, getPublicCourseBySlug } from '../controllers/coursesController';
import { cacheMiddleware } from '../middleware/cache';
import { supabase } from '../../database/config';

const router = express.Router();

// Публичные роуты (без авторизации) с кэшированием
// Кэш на 5 минут для статических данных
router.get('/testimonials', cacheMiddleware(5 * 60 * 1000), getPublicTestimonials);
router.get('/contacts', cacheMiddleware(10 * 60 * 1000), getContacts); // Контакты меняются реже
router.get('/founder', cacheMiddleware(10 * 60 * 1000), getFounderInfo);
router.get('/team', cacheMiddleware(10 * 60 * 1000), getTeamMembers);
router.get('/blog', cacheMiddleware(2 * 60 * 1000), getBlogPosts); // Блог обновляется чаще
router.get('/blog/:slug', cacheMiddleware(5 * 60 * 1000), getBlogPostBySlug);
router.get('/courses', cacheMiddleware(2 * 60 * 1000), getPublicCourses); // Курсы обновляются чаще
router.get('/courses/:slug', cacheMiddleware(5 * 60 * 1000), getPublicCourseBySlug);

// SEO route для получения SEO данных по пути (для SEOUpdater компонента)
router.get('/seo/*', async (req, res) => {
  try {
    const params = req.params as any;
    const path = params[0] || '/';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Проверяем БД
    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('path', normalizedPath)
      .single();

    if (seoSettings) {
      return res.json(seoSettings);
    }

    // Если это статья блога, генерируем SEO
    if (normalizedPath.startsWith('/blog/') && normalizedPath !== '/blog') {
      const slug = normalizedPath.replace('/blog/', '');
      const { data: post, error: blogError } = await supabase
        .from('blog_posts')
        .select('title, excerpt, image_url, image_upload_path')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (post) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = post.image_upload_path
          ? `${baseUrl}/uploads/blog/${post.image_upload_path}`
          : post.image_url || '';

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

    // Дефолтные значения (если SEO не найдено в БД)
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
    // В случае ошибки возвращаем дефолтные значения, чтобы не ломать сайт
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const params = req.params as any;
    res.json({
      title: 'NailArt Academy — Онлайн-курсы маникюра',
      description: 'Онлайн-школа маникюра для начинающих и профессионалов',
      og_title: 'NailArt Academy',
      og_description: 'Онлайн-школа маникюра для начинающих и профессионалов',
      og_image: 'https://lovable.dev/opengraph-image-p98pqg.png',
      og_type: 'website',
      og_url: `${baseUrl}${params[0] || '/'}`,
      canonical_url: `${baseUrl}${params[0] || '/'}`,
      twitter_card: 'summary_large_image',
      twitter_title: 'NailArt Academy',
      twitter_description: 'Онлайн-школа маникюра для начинающих и профессионалов',
      twitter_image: 'https://lovable.dev/opengraph-image-p98pqg.png',
      robots: 'index, follow',
    });
  }
});

export default router;

