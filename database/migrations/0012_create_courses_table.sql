-- Миграция: 0012_create_courses_table
-- Описание: Создание таблицы для курсов
-- Дата: 2024-01-08

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT NOT NULL,
    
    -- Медиа
    image_url VARCHAR(500),
    image_upload_path VARCHAR(255),
    video_preview_url VARCHAR(500), -- URL превью видео для публичной страницы
    
    -- Метаданные
    level VARCHAR(50) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('basics', 'hardware', 'extension', 'design')),
    duration VARCHAR(100), -- "4 недели"
    
    -- Статистика (вычисляется автоматически)
    students_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER DEFAULT 0,
    
    -- Преподаватель
    instructor_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
    
    -- Настройки
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    -- Включено в курс (JSON массив строк)
    includes JSONB DEFAULT '[]',
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON courses(display_order);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);

-- Комментарии
COMMENT ON TABLE courses IS 'Основная информация о курсах';
COMMENT ON COLUMN courses.slug IS 'URL-friendly идентификатор курса (уникальный)';
COMMENT ON COLUMN courses.level IS 'Уровень сложности: beginner, intermediate, advanced';
COMMENT ON COLUMN courses.category IS 'Категория курса: basics, hardware, extension, design';
COMMENT ON COLUMN courses.students_count IS 'Количество студентов (обновляется автоматически)';
COMMENT ON COLUMN courses.rating IS 'Средний рейтинг курса (0.00 - 5.00)';
COMMENT ON COLUMN courses.includes IS 'JSON массив строк с тем, что входит в курс';

