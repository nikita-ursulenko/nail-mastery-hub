/**
 * Скрипт для создания SEO настроек для админ-панели
 */

import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

const adminPages = [
  {
    path: '/admin/login',
    title: 'Вход в админ-панель | NailArt Academy',
    description: 'Вход в административную панель NailArt Academy для управления контентом сайта',
    keywords: 'админ панель, вход, управление контентом',
    og_title: 'Вход в админ-панель | NailArt Academy',
    og_description: 'Вход в административную панель NailArt Academy',
  },
  {
    path: '/admin/dashboard',
    title: 'Админ панель | NailArt Academy',
    description: 'Административная панель NailArt Academy для управления контентом сайта',
    keywords: 'админ панель, управление контентом, администратор',
    og_title: 'Админ панель | NailArt Academy',
    og_description: 'Административная панель NailArt Academy',
  },
  {
    path: '/admin/testimonials',
    title: 'Управление отзывами | Админ панель | NailArt Academy',
    description: 'Управление отзывами клиентов в административной панели NailArt Academy',
    keywords: 'админ панель, отзывы, управление',
    og_title: 'Управление отзывами | Админ панель',
    og_description: 'Управление отзывами клиентов',
  },
  {
    path: '/admin/contacts',
    title: 'Управление контактами | Админ панель | NailArt Academy',
    description: 'Управление контактной информацией в административной панели NailArt Academy',
    keywords: 'админ панель, контакты, управление',
    og_title: 'Управление контактами | Админ панель',
    og_description: 'Управление контактной информацией',
  },
  {
    path: '/admin/founder',
    title: 'Управление информацией о основателе | Админ панель | NailArt Academy',
    description: 'Управление информацией о основателе в административной панели NailArt Academy',
    keywords: 'админ панель, основатель, управление',
    og_title: 'Управление информацией о основателе | Админ панель',
    og_description: 'Управление информацией о основателе',
  },
  {
    path: '/admin/team',
    title: 'Управление командой | Админ панель | NailArt Academy',
    description: 'Управление информацией о команде в административной панели NailArt Academy',
    keywords: 'админ панель, команда, управление',
    og_title: 'Управление командой | Админ панель',
    og_description: 'Управление информацией о команде',
  },
  {
    path: '/admin/blog',
    title: 'Управление блогом | Админ панель | NailArt Academy',
    description: 'Управление статьями блога в административной панели NailArt Academy',
    keywords: 'админ панель, блог, статьи, управление',
    og_title: 'Управление блогом | Админ панель',
    og_description: 'Управление статьями блога',
  },
  {
    path: '/admin/seo',
    title: 'Управление SEO | Админ панель | NailArt Academy',
    description: 'Управление SEO настройками в административной панели NailArt Academy',
    keywords: 'админ панель, SEO, управление',
    og_title: 'Управление SEO | Админ панель',
    og_description: 'Управление SEO настройками',
  },
];

async function seedAdminSEO() {
  try {
    console.log('🌱 Создание SEO настроек для админ-панели...\n');

    for (const page of adminPages) {
      // Проверяем, существует ли уже запись
      const existing = await pool.query(
        'SELECT id FROM seo_settings WHERE path = $1',
        [page.path]
      );

      if (existing.rows.length > 0) {
        // Обновляем существующую запись
        await pool.query(
          `UPDATE seo_settings SET
            title = $1,
            description = $2,
            keywords = $3,
            og_title = $4,
            og_description = $5,
            og_type = 'website',
            twitter_card = 'summary_large_image',
            robots = 'noindex, nofollow',
            updated_at = CURRENT_TIMESTAMP
          WHERE path = $6`,
          [
            page.title,
            page.description,
            page.keywords,
            page.og_title,
            page.og_description,
            page.path,
          ]
        );
        console.log(`✅ Обновлено: ${page.path}`);
      } else {
        // Создаем новую запись
        await pool.query(
          `INSERT INTO seo_settings (
            path, title, description, keywords, og_title, og_description,
            og_type, twitter_card, robots
          ) VALUES ($1, $2, $3, $4, $5, $6, 'website', 'summary_large_image', 'noindex, nofollow')`,
          [
            page.path,
            page.title,
            page.description,
            page.keywords,
            page.og_title,
            page.og_description,
          ]
        );
        console.log(`✅ Создано: ${page.path}`);
      }
    }

    console.log('\n✨ SEO настройки для админ-панели успешно созданы/обновлены!');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    await pool.end();
    process.exit(1);
  }
}

seedAdminSEO();

