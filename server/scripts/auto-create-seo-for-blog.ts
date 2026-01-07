/**
 * Скрипт для автоматического создания SEO настроек для всех статей блога
 * Запускать после создания/обновления статей
 */

import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

async function autoCreateSEOForBlog() {
  try {
    console.log('🔍 Поиск статей блога без SEO настроек...\n');

    // Получаем все активные статьи блога
    const blogPosts = await pool.query(`
      SELECT id, slug, title, excerpt, image_url, image_upload_path, category, tags
      FROM blog_posts
      WHERE is_active = TRUE
      ORDER BY created_at DESC
    `);

    console.log(`Найдено статей: ${blogPosts.rows.length}\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const post of blogPosts.rows) {
      const path = `/blog/${post.slug}`;
      
      // Проверяем, существует ли уже SEO для этого пути
      const existing = await pool.query(
        'SELECT id FROM seo_settings WHERE path = $1',
        [path]
      );

      const imageUrl = post.image_upload_path
        ? `/uploads/blog/${post.image_upload_path}`
        : post.image_url || 'https://lovable.dev/opengraph-image-p98pqg.png';

      const seoData = {
        path,
        title: `${post.title} | NailArt Academy`,
        description: post.excerpt || post.title,
        keywords: post.tags && post.tags.length > 0 ? post.tags.join(', ') : post.category,
        og_title: post.title,
        og_description: post.excerpt || post.title,
        og_image: imageUrl,
        og_type: 'article',
        og_url: null, // Будет заполнено автоматически
        twitter_card: 'summary_large_image',
        twitter_title: post.title,
        twitter_description: post.excerpt || post.title,
        twitter_image: imageUrl,
        canonical_url: null, // Будет заполнено автоматически
        robots: 'index, follow',
      };

      if (existing.rows.length > 0) {
        // Обновляем существующую запись
        await pool.query(
          `UPDATE seo_settings SET
            title = $1, description = $2, keywords = $3,
            og_title = $4, og_description = $5, og_image = $6, og_type = $7,
            twitter_title = $8, twitter_description = $9, twitter_image = $10,
            updated_at = CURRENT_TIMESTAMP
          WHERE path = $11`,
          [
            seoData.title,
            seoData.description,
            seoData.keywords,
            seoData.og_title,
            seoData.og_description,
            seoData.og_image,
            seoData.og_type,
            seoData.twitter_title,
            seoData.twitter_description,
            seoData.twitter_image,
            path,
          ]
        );
        updated++;
        console.log(`  ✓ Обновлено: ${path}`);
      } else {
        // Создаем новую запись
        await pool.query(
          `INSERT INTO seo_settings (
            path, title, description, keywords, og_title, og_description,
            og_image, og_type, twitter_card, twitter_title, twitter_description,
            twitter_image, robots
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            seoData.path,
            seoData.title,
            seoData.description,
            seoData.keywords,
            seoData.og_title,
            seoData.og_description,
            seoData.og_image,
            seoData.og_type,
            seoData.twitter_card,
            seoData.twitter_title,
            seoData.twitter_description,
            seoData.twitter_image,
            seoData.robots,
          ]
        );
        created++;
        console.log(`  + Создано: ${path}`);
      }
    }

    console.log(`\n✅ Готово!`);
    console.log(`   Создано: ${created}`);
    console.log(`   Обновлено: ${updated}`);
    console.log(`   Пропущено: ${skipped}`);

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    await pool.end();
    process.exit(1);
  }
}

autoCreateSEOForBlog();

