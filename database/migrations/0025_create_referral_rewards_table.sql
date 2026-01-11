-- Миграция: 0025_create_referral_rewards_table
-- Описание: Создание таблицы для хранения истории всех начислений бонусов
-- Дата: 2026-01-11

CREATE TABLE IF NOT EXISTS referral_rewards (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
    tracking_id INTEGER REFERENCES referral_tracking(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('visit', 'registration', 'purchase', 'manual')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'paid')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_referral_rewards_partner_id ON referral_rewards(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_tracking_id ON referral_rewards(tracking_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_enrollment_id ON referral_rewards(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_reward_type ON referral_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_created_at ON referral_rewards(created_at DESC);

-- Комментарии
COMMENT ON TABLE referral_rewards IS 'История всех начислений бонусов рефералам-партнерам';
COMMENT ON COLUMN referral_rewards.partner_id IS 'ID реферала-партнера';
COMMENT ON COLUMN referral_rewards.tracking_id IS 'ID записи отслеживания';
COMMENT ON COLUMN referral_rewards.user_id IS 'ID пользователя (NULL для посещений)';
COMMENT ON COLUMN referral_rewards.enrollment_id IS 'ID покупки курса (NULL для посещений/регистраций)';
COMMENT ON COLUMN referral_rewards.reward_type IS 'Тип начисления: visit, registration, purchase, manual';
COMMENT ON COLUMN referral_rewards.amount IS 'Сумма начисления в EUR';
COMMENT ON COLUMN referral_rewards.status IS 'Статус: pending, approved, paid';
COMMENT ON COLUMN referral_rewards.description IS 'Описание начисления';
