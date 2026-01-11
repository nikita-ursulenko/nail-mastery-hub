-- Создание таблицы для уведомлений партнеров
CREATE TABLE IF NOT EXISTS referral_notifications (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('registration', 'purchase', 'withdrawal_status', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    related_enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
    related_withdrawal_id INTEGER REFERENCES referral_withdrawals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_referral_notifications_partner_id ON referral_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_notifications_is_read ON referral_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_referral_notifications_created_at ON referral_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_notifications_partner_read ON referral_notifications(partner_id, is_read);
