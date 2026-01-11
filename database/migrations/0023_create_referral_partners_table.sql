-- Миграция: 0023_create_referral_partners_table
-- Описание: Создание таблицы для рефералов-партнеров
-- Дата: 2026-01-11

CREATE TABLE IF NOT EXISTS referral_partners (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    telegram_tag VARCHAR(100),
    payment_details TEXT,
    total_earnings DECIMAL(10,2) DEFAULT 0 CHECK (total_earnings >= 0),
    current_balance DECIMAL(10,2) DEFAULT 0 CHECK (current_balance >= 0),
    withdrawn_amount DECIMAL(10,2) DEFAULT 0 CHECK (withdrawn_amount >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    level VARCHAR(50) DEFAULT 'novice' CHECK (level IN ('novice', 'active', 'professional', 'expert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_partners_email ON referral_partners(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_partners_code ON referral_partners(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_partners_is_active ON referral_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_partners_level ON referral_partners(level);

-- Комментарии
COMMENT ON TABLE referral_partners IS 'Рефералы-партнеры системы';
COMMENT ON COLUMN referral_partners.email IS 'Email партнера (уникальный)';
COMMENT ON COLUMN referral_partners.password_hash IS 'Хеш пароля (bcrypt)';
COMMENT ON COLUMN referral_partners.name IS 'Имя партнера';
COMMENT ON COLUMN referral_partners.phone IS 'Телефон партнера (опционально)';
COMMENT ON COLUMN referral_partners.referral_code IS 'Уникальный реферальный код (генерируется при регистрации)';
COMMENT ON COLUMN referral_partners.telegram_tag IS 'Телеграм тег для связи';
COMMENT ON COLUMN referral_partners.payment_details IS 'Номер карты/счета для выплат';
COMMENT ON COLUMN referral_partners.total_earnings IS 'Общий заработок (все начисления) в EUR';
COMMENT ON COLUMN referral_partners.current_balance IS 'Текущий баланс (доступно к выводу) в EUR';
COMMENT ON COLUMN referral_partners.withdrawn_amount IS 'Выведено средств в EUR';
COMMENT ON COLUMN referral_partners.is_active IS 'Активен ли партнер';
COMMENT ON COLUMN referral_partners.level IS 'Уровень партнера: novice, active, professional, expert';
