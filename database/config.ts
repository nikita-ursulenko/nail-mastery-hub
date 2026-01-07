/**
 * Конфигурация подключения к базе данных
 * 
 * ВАЖНО: В продакшене используйте переменные окружения!
 * Не коммитьте .env файл с реальными паролями в репозиторий.
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

/**
 * Получение конфигурации из переменных окружения или значений по умолчанию
 */
export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'nail_mastery_hub',
    user: process.env.DB_USER || 'nailmastery',
    password: process.env.DB_PASSWORD || 'nailmastery123',
    ssl: process.env.DB_SSL === 'true',
  };
}

/**
 * Формирование connection string для PostgreSQL
 */
export function getConnectionString(): string {
  const config = getDatabaseConfig();
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
}

/**
 * Конфигурация для pgAdmin (для справки)
 */
export const pgAdminConfig = {
  url: process.env.PGADMIN_URL || 'http://localhost:5050',
  email: process.env.PGADMIN_EMAIL || 'admin@nailmastery.com',
  password: process.env.PGADMIN_PASSWORD || 'admin123',
};

