-- Миграция: 0021_add_author_id_to_blog_posts
-- Описание: Добавление поля author_id для связи с team_members
-- Дата: 2024-01-08

-- Добавляем поле author_id
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL;

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Комментарий
COMMENT ON COLUMN blog_posts.author_id IS 'ID автора из таблицы team_members. Если NULL, используется поле author';

