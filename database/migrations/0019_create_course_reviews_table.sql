-- Миграция: 0019_create_course_reviews_table
-- Описание: Создание таблицы для отзывов о курсах
-- Дата: 2024-01-08

CREATE TABLE IF NOT EXISTS course_reviews (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_id INTEGER REFERENCES enrollments(id), -- Связь с записью
    
    -- Отзыв
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Модерация
    is_approved BOOLEAN DEFAULT FALSE, -- Одобрен ли отзыв админом
    is_featured BOOLEAN DEFAULT FALSE, -- Показывать в топе
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Один отзыв от пользователя на курс
    UNIQUE(course_id, user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON course_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_enrollment_id ON course_reviews(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_is_approved ON course_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_course_reviews_is_featured ON course_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON course_reviews(course_id, rating);

-- Комментарии
COMMENT ON TABLE course_reviews IS 'Отзывы пользователей о курсах';
COMMENT ON COLUMN course_reviews.rating IS 'Оценка курса (1-5)';
COMMENT ON COLUMN course_reviews.is_approved IS 'Одобрен ли отзыв администратором для публикации';
COMMENT ON COLUMN course_reviews.is_featured IS 'Показывать ли отзыв в топе на странице курса';

