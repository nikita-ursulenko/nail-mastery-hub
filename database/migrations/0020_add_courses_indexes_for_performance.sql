-- Миграция: 0020_add_courses_indexes_for_performance
-- Описание: Дополнительные индексы для оптимизации запросов курсов
-- Дата: 2024-01-08

-- Составные индексы для частых запросов
CREATE INDEX IF NOT EXISTS idx_courses_active_featured ON courses(is_active, is_featured) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_category_level ON courses(category, level) WHERE is_active = TRUE;

-- Индекс для поиска по slug (уже есть, но убедимся)
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique ON courses(slug);

-- Индекс для сортировки курсов
CREATE INDEX IF NOT EXISTS idx_courses_display_order_active ON courses(display_order, is_active) WHERE is_active = TRUE;

-- Индекс для enrollments с фильтром по статусу
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON enrollments(user_id, course_id) WHERE status = 'active';

-- Индекс для прогресса уроков (для быстрого подсчета завершенных)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(enrollment_id, is_completed) WHERE is_completed = TRUE;

-- Комментарии
COMMENT ON INDEX idx_courses_active_featured IS 'Индекс для быстрого поиска активных и featured курсов';
COMMENT ON INDEX idx_courses_category_level IS 'Индекс для фильтрации по категории и уровню';
COMMENT ON INDEX idx_enrollments_active IS 'Индекс для быстрого поиска активных записей пользователя';

