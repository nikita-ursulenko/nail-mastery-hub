-- Миграция: 0018_create_lesson_progress_table
-- Описание: Создание таблицы для прогресса прохождения уроков
-- Дата: 2024-01-08

CREATE TABLE IF NOT EXISTS lesson_progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    
    -- Прогресс
    watched_duration INTEGER DEFAULT 0 CHECK (watched_duration >= 0), -- Секунды просмотра
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Один прогресс на урок для каждой записи
    UNIQUE(enrollment_id, lesson_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_is_completed ON lesson_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_lesson ON lesson_progress(enrollment_id, lesson_id);

-- Комментарии
COMMENT ON TABLE lesson_progress IS 'Прогресс прохождения уроков пользователями';
COMMENT ON COLUMN lesson_progress.watched_duration IS 'Время просмотра урока в секундах';
COMMENT ON COLUMN lesson_progress.is_completed IS 'Завершен ли урок';

