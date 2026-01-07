-- Таблица для хранения обычных пользователей (не админов)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    avatar_upload_path VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- Комментарии
COMMENT ON TABLE users IS 'Обычные пользователи платформы (студенты)';
COMMENT ON COLUMN users.email IS 'Email пользователя (уникальный)';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля (bcrypt)';
COMMENT ON COLUMN users.name IS 'Имя пользователя';
COMMENT ON COLUMN users.phone IS 'Телефон пользователя (опционально)';
COMMENT ON COLUMN users.avatar_url IS 'URL аватара (если загружен по ссылке)';
COMMENT ON COLUMN users.avatar_upload_path IS 'Путь к загруженному аватару';
COMMENT ON COLUMN users.is_active IS 'Активен ли пользователь';
COMMENT ON COLUMN users.email_verified IS 'Подтвержден ли email';

