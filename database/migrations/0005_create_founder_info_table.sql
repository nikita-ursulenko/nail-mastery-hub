-- Создание таблицы для информации об основателе
CREATE TABLE IF NOT EXISTS founder_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    greeting VARCHAR(255) NOT NULL DEFAULT 'Привет! Я',
    role TEXT NOT NULL,
    image_url TEXT,
    image_upload_path TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0,
    experience_label VARCHAR(100) NOT NULL DEFAULT 'лет опыта работы',
    achievements TEXT[] NOT NULL DEFAULT '{}',
    button_text VARCHAR(100) NOT NULL DEFAULT 'Узнать больше',
    button_link VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса
CREATE INDEX IF NOT EXISTS idx_founder_info_is_active ON founder_info(is_active);

