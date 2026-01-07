-- Создание таблицы для статей блога
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON массив параграфов или просто текст
    image_url TEXT,
    image_upload_path TEXT,
    author VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    author_bio TEXT,
    date DATE NOT NULL,
    read_time VARCHAR(50) NOT NULL DEFAULT '5 мин',
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_active ON blog_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_date ON blog_posts(date DESC);

