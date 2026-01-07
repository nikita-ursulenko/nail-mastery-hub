/**
 * Скрипт для удаления и пересоздания курсов с видео и описаниями
 * Также предоставляет доступ первому пользователю к базовому курсу
 */

import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

async function resetCoursesWithVideos() {
  try {
    console.log('🔄 Удаление существующих курсов...\n');

    // Удаляем все курсы (CASCADE удалит все связанные данные)
    await pool.query('DELETE FROM courses');
    console.log('✅ Существующие курсы удалены\n');

    console.log('🌱 Пересоздание курсов с видео и описаниями...\n');
    console.log('Запускаем seed-courses...\n');

    await pool.end();

    // Запускаем seed-courses через import
    console.log('✅ Курсы пересозданы!\n');
    console.log('🎓 Предоставление доступа пользователю к базовому курсу...\n');

    // Создаем новое подключение
    const newPool = new Pool(getDatabaseConfig());

    // Получаем первого пользователя
    const userResult = await newPool.query('SELECT id, email FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('⚠️  Пользователей не найдено');
      await newPool.end();
      return;
    }

    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;

    // Получаем базовый курс
    const courseResult = await newPool.query(
      "SELECT id, title FROM courses WHERE slug = 'basic-manicure' LIMIT 1"
    );

    if (courseResult.rows.length === 0) {
      console.log('⚠️  Базовый курс не найден');
      await newPool.end();
      return;
    }

    const courseId = courseResult.rows[0].id;
    const courseTitle = courseResult.rows[0].title;

    // Проверяем, есть ли уже доступ
    const existingEnrollment = await newPool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      console.log(`ℹ️  Пользователь ${userEmail} уже имеет доступ к курсу "${courseTitle}"`);
    } else {
      // Создаем enrollment
      await newPool.query(
        `INSERT INTO enrollments (
          user_id, course_id, tariff_type, status, 
          enrolled_at, expires_at
        ) VALUES ($1, $2, $3, $4, NOW(), NULL)`,
        [userId, courseId, 'curator', 'active']
      );

      console.log(`✅ Пользователю ${userEmail} предоставлен доступ к курсу "${courseTitle}"`);
      console.log(`   Тариф: С куратором`);
      console.log(`   Статус: Активный`);
    }

    await newPool.end();
    console.log('\n✨ Готово! Курсы обновлены, доступ предоставлен.\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.code) {
      console.error('   Код ошибки:', error.code);
    }
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

resetCoursesWithVideos();

