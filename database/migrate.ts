#!/usr/bin/env node
/**
 * Скрипт для выполнения миграций базы данных
 * 
 * Использование:
 *   npm run migrate        - выполнить все новые миграции
 *   npm run migrate:up     - выполнить все новые миграции
 *   npm run migrate:down   - откатить последнюю миграцию (если поддерживается)
 *   npm run migrate:status - показать статус миграций
 */

import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { getDatabaseConfig } from './config.js';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

interface Migration {
  name: string;
  file: string;
  content: string;
}

/**
 * Получение списка всех миграций из папки
 */
async function getMigrations(): Promise<Migration[]> {
  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files
    .filter((file) => file.endsWith('.sql'))
    .sort(); // Сортируем по имени файла

  const migrations: Migration[] = [];

  for (const file of sqlFiles) {
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');
    const name = file.replace('.sql', '');
    migrations.push({ name, file, content });
  }

  return migrations;
}

/**
 * Получение списка выполненных миграций из БД
 */
async function getExecutedMigrations(client: pg.Client): Promise<string[]> {
  try {
    const result = await client.query(
      'SELECT migration_name FROM schema_migrations ORDER BY executed_at'
    );
    return result.rows.map((row) => row.migration_name);
  } catch (error: any) {
    // Если таблица не существует, возвращаем пустой массив
    if (error.code === '42P01') {
      return [];
    }
    throw error;
  }
}

/**
 * Выполнение миграции
 */
async function executeMigration(
  client: pg.Client,
  migration: Migration
): Promise<void> {
  console.log(`Выполнение миграции: ${migration.name}...`);

  try {
    // Начинаем транзакцию
    await client.query('BEGIN');

    // Выполняем SQL миграции
    await client.query(migration.content);

    // Записываем миграцию в таблицу
    await client.query(
      'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
      [migration.name]
    );

    // Коммитим транзакцию
    await client.query('COMMIT');

    console.log(`✓ Миграция ${migration.name} выполнена успешно`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Ошибка при выполнении миграции ${migration.name}:`, error);
    throw error;
  }
}

/**
 * Основная функция выполнения миграций
 */
async function runMigrations(): Promise<void> {
  const config = getDatabaseConfig();
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Подключение к базе данных установлено');

    // Получаем список всех миграций
    const allMigrations = await getMigrations();
    console.log(`Найдено миграций: ${allMigrations.length}`);

    // Получаем список выполненных миграций
    const executedMigrations = await getExecutedMigrations(client);
    console.log(`Выполнено миграций: ${executedMigrations.length}`);

    // Находим миграции, которые еще не выполнены
    const pendingMigrations = allMigrations.filter(
      (migration) => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      console.log('Все миграции уже выполнены');
      return;
    }

    console.log(`\nБудут выполнены миграции (${pendingMigrations.length}):`);
    pendingMigrations.forEach((m) => console.log(`  - ${m.name}`));

    // Выполняем каждую миграцию
    for (const migration of pendingMigrations) {
      await executeMigration(client, migration);
    }

    console.log('\n✓ Все миграции выполнены успешно');
  } catch (error) {
    console.error('Ошибка при выполнении миграций:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Показать статус миграций
 */
async function showStatus(): Promise<void> {
  const config = getDatabaseConfig();
  const client = new Client(config);

  try {
    await client.connect();

    const allMigrations = await getMigrations();
    const executedMigrations = await getExecutedMigrations(client);

    console.log('\nСтатус миграций:\n');
    console.log('Всего миграций:', allMigrations.length);
    console.log('Выполнено:', executedMigrations.length);
    console.log('Ожидают выполнения:', allMigrations.length - executedMigrations.length);

    console.log('\nДетали:');
    for (const migration of allMigrations) {
      const isExecuted = executedMigrations.includes(migration.name);
      const status = isExecuted ? '✓' : '○';
      console.log(`  ${status} ${migration.name}`);
    }
  } catch (error) {
    console.error('Ошибка при получении статуса:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Обработка аргументов командной строки
const command = process.argv[2] || 'up';

if (command === 'up' || command === 'migrate') {
  runMigrations();
} else if (command === 'status') {
  showStatus();
} else {
  console.error(`Неизвестная команда: ${command}`);
  console.error('Использование: npm run migrate [up|status]');
  process.exit(1);
}

