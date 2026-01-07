-- Добавление поля для загруженного аватара автора
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS author_avatar_upload_path TEXT;

