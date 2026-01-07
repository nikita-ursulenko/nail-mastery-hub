/**
 * Скрипт для предоставления доступа пользователю к курсу
 */

import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

async function grantCourseAccess() {
  try {
    console.log('🎓 Предоставление доступа пользователю к базовому курсу...\n');

    // Получаем первого пользователя
    const userResult = await pool.query('SELECT id, email FROM users LIMIT 1');

    if (userResult.rows.length === 0) {
      console.log('⚠️  Пользователей не найдено');
      await pool.end();
      process.exit(0);
    }

    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;

    // Получаем базовый курс
    const courseResult = await pool.query(
      "SELECT id, title FROM courses WHERE slug = 'basic-manicure' LIMIT 1"
    );

    if (courseResult.rows.length === 0) {
      console.log('⚠️  Базовый курс не найден');
      await pool.end();
      process.exit(0);
    }

    const courseId = courseResult.rows[0].id;
    const courseTitle = courseResult.rows[0].title;

    // Получаем тариф "С куратором"
    const tariffResult = await pool.query(
      "SELECT id, name FROM course_tariffs WHERE course_id = $1 AND tariff_type = 'curator' LIMIT 1",
      [courseId]
    );

    if (tariffResult.rows.length === 0) {
      console.log('⚠️  Тариф "С куратором" не найден');
      await pool.end();
      process.exit(0);
    }

    const tariffId = tariffResult.rows[0].id;
    const tariffName = tariffResult.rows[0].name;

    // Проверяем, есть ли уже доступ
    const existingEnrollment = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      console.log(`ℹ️  Пользователь ${userEmail} уже имеет доступ к курсу "${courseTitle}"`);
    } else {
      // Подсчитываем общее количество уроков в курсе
      const lessonsCountResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM course_lessons cl
         JOIN course_modules cm ON cl.module_id = cm.id
         WHERE cm.course_id = $1`,
        [courseId]
      );
      const totalLessons = parseInt(lessonsCountResult.rows[0].total);

      // Создаем enrollment
      await pool.query(
        `INSERT INTO enrollments (
          user_id, course_id, tariff_id, status,
          purchased_at, expires_at, started_at,
          total_lessons, lessons_completed, progress_percent,
          payment_status, amount_paid
        ) VALUES ($1, $2, $3, $4, NOW(), NULL, NOW(), $5, 0, 0, 'paid', 0)`,
        [userId, courseId, tariffId, 'active', totalLessons]
      );

      console.log(`✅ Пользователю ${userEmail} предоставлен доступ к курсу "${courseTitle}"`);
      console.log(`   Тариф: ${tariffName}`);
      console.log(`   Статус: Активный`);
      console.log(`   Всего уроков: ${totalLessons}`);
    }

    await pool.end();
    console.log('\n✨ Готово!\n');
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

grantCourseAccess();

