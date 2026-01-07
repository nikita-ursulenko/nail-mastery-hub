-- Миграция: 0014_create_course_lessons_table
-- Описание: Создание таблицы для уроков курса
-- Дата: 2024-01-08

CREATE TABLE IF NOT EXISTS course_lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Видео
    video_url VARCHAR(500), -- URL видео (YouTube, Vimeo, или собственный хостинг)
    video_upload_path VARCHAR(255), -- Путь к загруженному видео
    preview_video_url VARCHAR(500), -- Превью для публичной страницы (опционально)
    duration INTEGER, -- Длительность в секундах
    
    -- Материалы урока (JSON массив объектов)
    materials JSONB DEFAULT '[]', -- [{"type": "pdf", "url": "...", "name": "..."}, ...]
    
    -- Настройки
    is_preview BOOLEAN DEFAULT FALSE, -- Можно ли смотреть без оплаты
    order_index INTEGER NOT NULL DEFAULT 0,
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON course_lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_lessons_is_preview ON course_lessons(is_preview);

-- Комментарии
COMMENT ON TABLE course_lessons IS 'Уроки в модулях курса';
COMMENT ON COLUMN course_lessons.video_url IS 'URL видео (YouTube, Vimeo или собственный хостинг)';
COMMENT ON COLUMN course_lessons.is_preview IS 'Можно ли смотреть урок без оплаты курса';
COMMENT ON COLUMN course_lessons.materials IS 'JSON массив материалов урока: [{"type": "pdf", "url": "...", "name": "..."}]';

