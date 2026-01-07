-- Миграция: 0002_create_testimonials_table
-- Описание: Создание таблицы для отзывов
-- Дата: 2024-01-07

CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    text TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);

-- Комментарии к таблице
COMMENT ON TABLE testimonials IS 'Таблица отзывов клиентов';
COMMENT ON COLUMN testimonials.name IS 'Имя автора отзыва';
COMMENT ON COLUMN testimonials.role IS 'Роль/должность автора';
COMMENT ON COLUMN testimonials.avatar IS 'URL аватара автора';
COMMENT ON COLUMN testimonials.text IS 'Текст отзыва';
COMMENT ON COLUMN testimonials.rating IS 'Рейтинг от 1 до 5';

