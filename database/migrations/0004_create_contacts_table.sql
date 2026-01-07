-- Создание таблицы контактов
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'phone', 'email', 'address', 'social'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  href TEXT,
  subtitle TEXT,
  icon VARCHAR(50) NOT NULL, -- 'Phone', 'Mail', 'MapPin', 'Instagram', etc.
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для сортировки
CREATE INDEX IF NOT EXISTS idx_contacts_display_order ON contacts(display_order);
CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active);

