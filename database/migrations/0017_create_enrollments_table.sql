-- Миграция: 0017_create_enrollments_table
-- Описание: Создание таблицы для записей пользователей на курсы
-- Дата: 2024-01-08

CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tariff_id INTEGER NOT NULL REFERENCES course_tariffs(id),
    
    -- Статус
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    
    -- Доступ
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = бессрочный доступ
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Прогресс (вычисляется автоматически)
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    lessons_completed INTEGER DEFAULT 0,
    total_lessons INTEGER, -- Кэш для быстрого доступа
    
    -- Оплата
    payment_id VARCHAR(255), -- ID платежа в платежной системе
    payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    amount_paid DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Один пользователь может быть записан на курс только один раз
    UNIQUE(user_id, course_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tariff_id ON enrollments(tariff_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);

-- Комментарии
COMMENT ON TABLE enrollments IS 'Записи пользователей на курсы';
COMMENT ON COLUMN enrollments.status IS 'Статус записи: active, completed, expired, cancelled';
COMMENT ON COLUMN enrollments.expires_at IS 'Дата истечения доступа (NULL = бессрочный)';
COMMENT ON COLUMN enrollments.progress_percent IS 'Процент завершения курса (0-100)';
COMMENT ON COLUMN enrollments.total_lessons IS 'Общее количество уроков (кэш для быстрого доступа)';

