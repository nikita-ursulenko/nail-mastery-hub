import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

async function checkSeoTable() {
  try {
    // Проверяем существование таблицы
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'seo_settings'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Таблица seo_settings существует');

      // Проверяем структуру таблицы
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'seo_settings'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Структура таблицы:');
      columns.rows.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
      });

      // Проверяем количество записей
      const count = await pool.query('SELECT COUNT(*) FROM seo_settings');
      console.log(`\n📊 Количество записей: ${count.rows[0].count}`);

      // Показываем индексы
      const indexes = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'seo_settings';
      `);

      if (indexes.rows.length > 0) {
        console.log('\n🔍 Индексы:');
        indexes.rows.forEach((idx) => {
          console.log(`  - ${idx.indexname}`);
        });
      }
    } else {
      console.log('❌ Таблица seo_settings НЕ существует');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при проверке таблицы:', error);
    process.exit(1);
  }
}

checkSeoTable();

