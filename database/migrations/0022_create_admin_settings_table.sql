-- Таблица для хранения настроек админ-панели
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, boolean, number, json
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Комментарии
COMMENT ON TABLE admin_settings IS 'Настройки админ-панели';
COMMENT ON COLUMN admin_settings.setting_key IS 'Ключ настройки (уникальный)';
COMMENT ON COLUMN admin_settings.setting_value IS 'Значение настройки';
COMMENT ON COLUMN admin_settings.setting_type IS 'Тип настройки (string, boolean, number, json)';
COMMENT ON COLUMN admin_settings.description IS 'Описание настройки';

-- Вставляем дефолтные настройки
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
    ('theme', 'light', 'string', 'Цвет темы админ-панели (light/dark)')
ON CONFLICT (setting_key) DO NOTHING;

