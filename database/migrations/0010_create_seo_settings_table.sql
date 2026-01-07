-- Таблица для хранения SEO настроек для разных страниц
CREATE TABLE IF NOT EXISTS seo_settings (
    id SERIAL PRIMARY KEY,
    path VARCHAR(500) NOT NULL UNIQUE, -- Путь страницы (например: '/', '/blog', '/blog/my-article')
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    keywords VARCHAR(500), -- Опционально
    og_title VARCHAR(255), -- Open Graph title
    og_description TEXT, -- Open Graph description
    og_image VARCHAR(500), -- Open Graph image URL
    og_type VARCHAR(50) DEFAULT 'website', -- website, article, etc.
    og_url VARCHAR(500), -- Canonical URL
    twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image VARCHAR(500),
    canonical_url VARCHAR(500), -- Canonical URL для дубликатов
    robots VARCHAR(100) DEFAULT 'index, follow', -- robots meta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по пути
CREATE INDEX IF NOT EXISTS idx_seo_settings_path ON seo_settings (path);

-- Комментарии
COMMENT ON TABLE seo_settings IS 'SEO настройки для разных страниц сайта';

COMMENT ON COLUMN seo_settings.path IS 'Путь страницы (уникальный)';

COMMENT ON COLUMN seo_settings.title IS 'Title страницы';

COMMENT ON COLUMN seo_settings.description IS 'Meta description';

COMMENT ON COLUMN seo_settings.og_image IS 'URL изображения для Open Graph';
