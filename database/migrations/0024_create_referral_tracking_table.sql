-- Миграция: 0024_create_referral_tracking_table
-- Описание: Создание таблицы для отслеживания переходов, регистраций и покупок по реферальным ссылкам
-- Дата: 2026-01-11

CREATE TABLE IF NOT EXISTS referral_tracking (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
    visitor_ip VARCHAR(45),
    visitor_user_agent TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    registered_at TIMESTAMP WITH TIME ZONE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'visited' CHECK (status IN ('visited', 'registered', 'purchased')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_referral_tracking_partner_id ON referral_tracking(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_user_id ON referral_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_visited_at ON referral_tracking(visited_at);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_partner_status ON referral_tracking(partner_id, status);

-- Комментарии
COMMENT ON TABLE referral_tracking IS 'Отслеживание переходов, регистраций и покупок по реферальным ссылкам';
COMMENT ON COLUMN referral_tracking.partner_id IS 'ID реферала-партнера';
COMMENT ON COLUMN referral_tracking.visitor_ip IS 'IP адрес посетителя';
COMMENT ON COLUMN referral_tracking.visitor_user_agent IS 'User Agent браузера';
COMMENT ON COLUMN referral_tracking.visited_at IS 'Дата первого посещения';
COMMENT ON COLUMN referral_tracking.registered_at IS 'Дата регистрации (если зарегистрировался)';
COMMENT ON COLUMN referral_tracking.user_id IS 'ID зарегистрированного пользователя (NULL если не зарегистрировался)';
COMMENT ON COLUMN referral_tracking.status IS 'Статус: visited, registered, purchased';
