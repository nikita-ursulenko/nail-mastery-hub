import express from 'express';
import { supabase } from '../../database/config';

const router = express.Router();

/**
 * Генерация sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Статические страницы
    const staticPages: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [
      { url: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { url: `${baseUrl}/courses`, priority: '0.9', changefreq: 'weekly' },
      { url: `${baseUrl}/blog`, priority: '0.8', changefreq: 'daily' },
      { url: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly' },
      { url: `${baseUrl}/contacts`, priority: '0.7', changefreq: 'monthly' },
      { url: `${baseUrl}/schedule`, priority: '0.7', changefreq: 'weekly' },
      { url: `${baseUrl}/faq`, priority: '0.6', changefreq: 'monthly' },
    ];

    // Получаем активные курсы
    const { data: courses } = await supabase
      .from('courses')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const coursesLinks = (courses || []).map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: course.updated_at ? new Date(course.updated_at).toISOString().split('T')[0] : undefined,
    }));

    // Получаем активные статьи блога
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    const blogLinks = (blogPosts || []).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : undefined,
    }));

    // Генерируем XML
    const urls = [...staticPages, ...coursesLinks, ...blogLinks];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
        .map(
          (url) => `  <url>
    <loc>${url.url}</loc>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`
        )
        .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
