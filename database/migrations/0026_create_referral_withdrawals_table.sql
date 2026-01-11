-- Миграция: 0026_create_referral_withdrawals_table
-- Описание: Создание таблицы для запросов на вывод средств
-- Дата: 2026-01-11

CREATE TABLE IF NOT EXISTS referral_withdrawals (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_details TEXT NOT NULL,
    telegram_tag VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    admin_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by INTEGER REFERENCES admins(id) ON DELETE SET NULL
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_partner_id ON referral_withdrawals(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_status ON referral_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_requested_at ON referral_withdrawals(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_withdrawals_partner_status ON referral_withdrawals(partner_id, status);

-- Комментарии
COMMENT ON TABLE referral_withdrawals IS 'Запросы рефералов-партнеров на вывод средств';
COMMENT ON COLUMN referral_withdrawals.partner_id IS 'ID реферала-партнера';
COMMENT ON COLUMN referral_withdrawals.amount IS 'Сумма к выводу в EUR';
COMMENT ON COLUMN referral_withdrawals.payment_details IS 'Номер карты/счета для выплаты';
COMMENT ON COLUMN referral_withdrawals.telegram_tag IS 'Телеграм тег для связи';
COMMENT ON COLUMN referral_withdrawals.status IS 'Статус: pending, approved, paid, rejected';
COMMENT ON COLUMN referral_withdrawals.admin_notes IS 'Заметки администратора';
COMMENT ON COLUMN referral_withdrawals.requested_at IS 'Дата запроса';
COMMENT ON COLUMN referral_withdrawals.processed_at IS 'Дата обработки';
COMMENT ON COLUMN referral_withdrawals.processed_by IS 'ID администратора, обработавшего запрос';
