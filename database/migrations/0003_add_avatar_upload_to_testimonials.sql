-- Миграция: 0003_add_avatar_upload_to_testimonials
-- Описание: Добавление поддержки загруженных аватаров (avatar_upload_path)
-- Дата: 2024-01-07

-- Добавляем поле для хранения пути к загруженному файлу
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS avatar_upload_path VARCHAR(500);

-- Комментарий к полю
COMMENT ON COLUMN testimonials.avatar_upload_path IS 'Путь к загруженному файлу аватара на сервере';

