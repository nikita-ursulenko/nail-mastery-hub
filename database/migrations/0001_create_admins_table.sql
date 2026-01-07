-- Миграция: 0001_create_admins_table
-- Описание: Создание таблицы для администраторов системы
-- Дата: 2024-01-07

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Комментарии к таблице
COMMENT ON TABLE admins IS 'Таблица администраторов системы';
COMMENT ON COLUMN admins.email IS 'Email админа (уникальный)';
COMMENT ON COLUMN admins.password_hash IS 'Хеш пароля (bcrypt)';
COMMENT ON COLUMN admins.name IS 'Имя администратора';

