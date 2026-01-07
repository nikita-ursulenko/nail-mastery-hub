-- Миграция: 0000_create_migrations_table
-- Описание: Создание таблицы для отслеживания выполненных миграций
-- Дата: 2024-01-07

-- Таблица для отслеживания миграций
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_migrations_name ON schema_migrations(migration_name);

