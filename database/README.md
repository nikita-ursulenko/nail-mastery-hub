# База данных Nail Mastery Hub

## Структура

```
database/
├── config.ts              # Конфигурация подключения к БД
├── schema.sql             # Исходная схема (для справки, не используется)
├── migrations/            # Папка с миграциями
│   └── README.md          # Документация по миграциям
├── migrate.ts             # Скрипт для выполнения миграций
├── TABLES.md              # Описание всех таблиц БД
└── README.md              # Эта документация
```

**Примечание:** Таблицы создаются по мере необходимости через миграции.

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

Это установит все необходимые пакеты, включая `pg`, `@types/pg`, `dotenv` и `tsx`.

### 2. Создайте файл `.env` в корне проекта

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nail_mastery_hub
DB_USER=nailmastery
DB_PASSWORD=nailmastery123
DB_SSL=false
```

⚠️ **Важно:** Файл `.env` уже добавлен в `.gitignore` и не будет попадать в репозиторий.

### 3. Запустите базу данных

```bash
npm run db:up
```

Или вручную:
```bash
docker-compose up -d
```

### 4. Выполните миграции

```bash
npm run migrate
```

Готово! База данных настроена и готова к работе.

## Миграции

### Подход

**Таблицы создаются по мере необходимости.** Когда нужна новая функциональность, создается миграция с соответствующей таблицей.

### Создание новой миграции

1. Определите, какая таблица нужна для текущей задачи
2. Создайте файл в `database/migrations/` с именем:
   ```
   XXXX_create_table_name.sql
   ```
   где `XXXX` - порядковый номер (например, `0001`, `0002`)

3. Пример создания таблицы:
   ```sql
   -- Миграция: 0001_create_users
   -- Описание: Создание таблицы пользователей
   -- Дата: 2024-01-07

   CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### Выполнение миграций

```bash
# Выполнить все новые миграции
npm run migrate

# Показать статус миграций
npm run migrate:status
```

### Правила именования миграций

- Формат: `XXXX_description.sql`
- `XXXX` - 4-значный номер с ведущими нулями (0001, 0002, ...)
- `description` - краткое описание на английском, слова разделены подчеркиванием
- Примеры:
  - `0000_create_migrations_table.sql` - системная таблица
  - `0001_create_users.sql` - создание таблицы пользователей
  - `0002_create_courses.sql` - создание таблицы курсов
  - `0003_add_user_avatar.sql` - изменение существующей таблицы

## Подключение к БД

### Из кода (TypeScript/JavaScript)

```typescript
import { getDatabaseConfig, getConnectionString } from './database/config.js';
import pg from 'pg';

const { Client } = pg;
const config = getDatabaseConfig();

const client = new Client(config);
await client.connect();

// Использование
const result = await client.query('SELECT * FROM users');
```

### Из командной строки

```bash
# Через docker
docker exec -it nail-mastery-db psql -U nailmastery -d nail_mastery_hub

# Или напрямую (если PostgreSQL установлен локально)
psql -h localhost -U nailmastery -d nail_mastery_hub
```

## Безопасность

⚠️ **ВАЖНО:**

1. **Никогда не коммитьте `.env` файл** в репозиторий
2. Используйте разные пароли для development и production
3. В продакшене используйте переменные окружения сервера
4. Регулярно обновляйте пароли
5. Используйте SSL для подключения в продакшене

## pgAdmin

Веб-интерфейс для управления БД доступен на:
- URL: http://localhost:5050
- Email: `admin@nailmastery.com`
- Password: `admin123`

## Запуск БД

```bash
# Запустить контейнеры
docker-compose up -d

# Остановить контейнеры
docker-compose down

# Остановить и удалить данные
docker-compose down -v
```

## Полезные команды

```bash
# Проверить статус контейнеров
docker-compose ps

# Просмотреть логи PostgreSQL
docker-compose logs postgres

# Создать резервную копию
docker exec nail-mastery-db pg_dump -U nailmastery nail_mastery_hub > backup.sql

# Восстановить из резервной копии
docker exec -i nail-mastery-db psql -U nailmastery -d nail_mastery_hub < backup.sql
```
