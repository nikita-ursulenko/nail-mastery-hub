-- Миграция: 0016_create_course_materials_table
-- Описание: Создание таблицы для необходимых материалов курса
-- Дата: 2024-01-08

CREATE TABLE IF NOT EXISTS course_materials (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- "Аппарат для маникюра (от 100 €)"
    price_info VARCHAR(100), -- "(от 100 €)"
    link VARCHAR(500), -- Ссылка на магазин (опционально)
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_display_order ON course_materials(course_id, display_order);

-- Комментарии
COMMENT ON TABLE course_materials IS 'Необходимые материалы для прохождения курса';
COMMENT ON COLUMN course_materials.name IS 'Название материала с ценой, например: "Аппарат для маникюра (от 100 €)"';

