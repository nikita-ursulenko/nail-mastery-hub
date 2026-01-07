-- Миграция: 0015_create_course_tariffs_table
-- Описание: Создание таблицы для тарифов курса
-- Дата: 2024-01-08

CREATE TABLE IF NOT EXISTS course_tariffs (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tariff_type VARCHAR(50) NOT NULL CHECK (tariff_type IN ('self', 'curator', 'vip')),
    name VARCHAR(255) NOT NULL, -- "Самостоятельный", "С куратором", "VIP"
    
    -- Цены
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    old_price DECIMAL(10,2) CHECK (old_price >= 0), -- Старая цена (для скидки)
    
    -- Особенности тарифа (JSON массивы)
    features JSONB DEFAULT '[]', -- ["Доступ ко всем урокам", "Проверка ДЗ", ...]
    not_included JSONB DEFAULT '[]', -- ["Проверка ДЗ", "Обратная связь"] (для тарифа self)
    
    -- Настройки
    is_popular BOOLEAN DEFAULT FALSE, -- Бейдж "Популярный"
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- Лимиты для тарифа
    homework_reviews_limit INTEGER, -- Сколько ДЗ проверяется (NULL = безлимит)
    curator_support_months INTEGER, -- Месяцы поддержки куратора
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_course_tariffs_course_id ON course_tariffs(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tariffs_tariff_type ON course_tariffs(tariff_type);
CREATE INDEX IF NOT EXISTS idx_course_tariffs_is_active ON course_tariffs(is_active);
CREATE INDEX IF NOT EXISTS idx_course_tariffs_display_order ON course_tariffs(course_id, display_order);

-- Комментарии
COMMENT ON TABLE course_tariffs IS 'Тарифы курса (self, curator, vip)';
COMMENT ON COLUMN course_tariffs.tariff_type IS 'Тип тарифа: self, curator, vip';
COMMENT ON COLUMN course_tariffs.features IS 'JSON массив строк с преимуществами тарифа';
COMMENT ON COLUMN course_tariffs.not_included IS 'JSON массив строк с тем, чего нет в тарифе';

