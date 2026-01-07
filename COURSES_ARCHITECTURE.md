# Архитектура системы курсов

## 📊 Структура базы данных

### 1. Таблица `courses` (Основная информация о курсах)

```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly идентификатор
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT NOT NULL,
    
    -- Медиа
    image_url VARCHAR(500), -- URL изображения
    image_upload_path VARCHAR(255), -- Путь к загруженному изображению
    video_preview_url VARCHAR(500), -- URL превью видео (для публичной страницы)
    
    -- Метаданные
    level VARCHAR(50) NOT NULL, -- 'beginner', 'intermediate', 'advanced'
    category VARCHAR(50) NOT NULL, -- 'basics', 'hardware', 'extension', 'design'
    duration VARCHAR(100), -- "4 недели"
    
    -- Статистика (вычисляется автоматически)
    students_count INTEGER DEFAULT 0, -- Количество студентов
    rating DECIMAL(3,2) DEFAULT 0, -- Средний рейтинг (0.00 - 5.00)
    reviews_count INTEGER DEFAULT 0, -- Количество отзывов
    
    -- Преподаватель
    instructor_id INTEGER REFERENCES team_members(id), -- FK к team_members
    
    -- Настройки
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE, -- Показывать на главной
    is_new BOOLEAN DEFAULT FALSE, -- Бейдж "Новый"
    display_order INTEGER DEFAULT 0, -- Порядок сортировки
    
    -- Включено в курс (JSON массив строк)
    includes JSONB DEFAULT '[]', -- ["32 видеоурока", "Проверка ДЗ", ...]
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Таблица `course_modules` (Модули курса)

```sql
CREATE TABLE course_modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL, -- Порядок модулей в курсе
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Таблица `course_lessons` (Уроки в модулях)

```sql
CREATE TABLE course_lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Видео
    video_url VARCHAR(500), -- URL видео (YouTube, Vimeo, или собственный хостинг)
    video_upload_path VARCHAR(255), -- Путь к загруженному видео
    preview_video_url VARCHAR(500), -- Превью для публичной страницы (опционально)
    duration INTEGER, -- Длительность в секундах
    
    -- Материалы урока (JSON массив)
    materials JSONB DEFAULT '[]', -- [{"type": "pdf", "url": "...", "name": "..."}, ...]
    
    -- Настройки
    is_preview BOOLEAN DEFAULT FALSE, -- Можно ли смотреть без оплаты
    order_index INTEGER NOT NULL, -- Порядок урока в модуле
    
    -- Временные метки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Таблица `course_tariffs` (Тарифы курса)

```sql
CREATE TABLE course_tariffs (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tariff_type VARCHAR(50) NOT NULL, -- 'self', 'curator', 'vip'
    name VARCHAR(255) NOT NULL, -- "Самостоятельный", "С куратором", "VIP"
    
    -- Цены
    price DECIMAL(10,2) NOT NULL, -- Цена в евро
    old_price DECIMAL(10,2), -- Старая цена (для скидки)
    
    -- Особенности тарифа (JSON массив)
    features JSONB DEFAULT '[]', -- ["Доступ ко всем урокам", "Проверка ДЗ", ...]
    not_included JSONB DEFAULT '[]', -- ["Проверка ДЗ", "Обратная связь"] (для тарифа self)
    
    -- Настройки
    is_popular BOOLEAN DEFAULT FALSE, -- Бейдж "Популярный"
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- Лимиты для тарифа
    homework_reviews_limit INTEGER, -- Сколько ДЗ проверяется (NULL = безлимит)
    curator_support_months INTEGER, -- Месяцы поддержки куратора
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Таблица `course_materials` (Необходимые материалы)

```sql
CREATE TABLE course_materials (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- "Аппарат для маникюра (от 100 €)"
    price_info VARCHAR(100), -- "(от 100 €)"
    link VARCHAR(500), -- Ссылка на магазин (опционально)
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Таблица `enrollments` (Записи пользователей на курсы)

```sql
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tariff_id INTEGER NOT NULL REFERENCES course_tariffs(id),
    
    -- Статус
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
    
    -- Доступ
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = бессрочный доступ
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Прогресс (вычисляется автоматически)
    progress_percent INTEGER DEFAULT 0, -- 0-100
    lessons_completed INTEGER DEFAULT 0,
    total_lessons INTEGER, -- Кэш для быстрого доступа
    
    -- Оплата
    payment_id VARCHAR(255), -- ID платежа в платежной системе
    payment_status VARCHAR(50), -- 'pending', 'paid', 'failed', 'refunded'
    amount_paid DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, course_id) -- Один пользователь может быть записан на курс только один раз
);
```

### 7. Таблица `lesson_progress` (Прогресс прохождения уроков)

```sql
CREATE TABLE lesson_progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    
    -- Прогресс
    watched_duration INTEGER DEFAULT 0, -- Секунды просмотра
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(enrollment_id, lesson_id) -- Один прогресс на урок для каждой записи
);
```

### 8. Таблица `course_reviews` (Отзывы о курсах)

```sql
CREATE TABLE course_reviews (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_id INTEGER REFERENCES enrollments(id), -- Связь с записью
    
    -- Отзыв
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Модерация
    is_approved BOOLEAN DEFAULT FALSE, -- Одобрен ли отзыв админом
    is_featured BOOLEAN DEFAULT FALSE, -- Показывать в топе
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(course_id, user_id) -- Один отзыв от пользователя на курс
);
```

## 🔄 Логика работы

### Публичная страница курса (`/courses/:slug`)

1. **Загрузка данных:**
   - Основная информация курса
   - Модули и уроки (только названия, без видео)
   - Тарифы
   - Материалы
   - Преподаватель
   - Статистика (студенты, рейтинг, отзывы)

2. **Что показывается:**
   - ✅ Всё, кроме видеоуроков
   - ✅ Превью видео (если есть `video_preview_url`)
   - ✅ Программа курса (модули и названия уроков)
   - ✅ Тарифы с кнопкой "Выбрать тариф"

3. **Действия:**
   - Кнопка "Выбрать тариф" → проверка авторизации:
     - Не авторизован → `/login?redirect=/courses/:slug`
     - Авторизован → переход на оплату

### Страница курса в ЛК (`/dashboard/courses/:slug`)

1. **Проверка доступа:**
   - Есть ли `enrollment` для этого курса?
   - Если нет → редирект на `/courses/:slug` с сообщением "Купите курс"

2. **Что показывается:**
   - ✅ Все модули и уроки
   - ✅ Видео для каждого урока
   - ✅ Материалы к урокам
   - ✅ Прогресс по каждому уроку
   - ✅ Домашние задания (если тариф позволяет)
   - ✅ Чат с куратором (если тариф позволяет)

### Страница урока (`/dashboard/courses/:slug/lessons/:lessonId`)

1. **Проверка доступа:**
   - Есть ли `enrollment`?
   - Принадлежит ли урок курсу?

2. **Что показывается:**
   - Видеоплеер
   - Описание урока
   - Материалы урока
   - Навигация (предыдущий/следующий урок)
   - Отметка "Пройдено"

3. **Отслеживание прогресса:**
   - При просмотре видео обновляется `watched_duration`
   - При завершении урока → `is_completed = TRUE`
   - Обновляется `progress_percent` в `enrollments`

## 🎯 API Endpoints

### Публичные (без авторизации)

```
GET /api/public/courses
  - Список всех активных курсов
  - Параметры: category, level, search, limit, offset
  - Возвращает: массив курсов (без модулей/уроков)

GET /api/public/courses/:slug
  - Детали курса (публичные)
  - Возвращает: курс + модули (только названия) + тарифы + материалы
```

### Для авторизованных пользователей

```
GET /api/courses/:slug
  - Детали курса (полные, с уроками)
  - Требует: enrollment для этого курса
  - Возвращает: курс + модули + уроки (с видео) + материалы

GET /api/courses/:slug/lessons/:lessonId
  - Детали урока
  - Требует: enrollment
  - Возвращает: урок + видео + материалы

POST /api/courses/:slug/lessons/:lessonId/progress
  - Обновление прогресса урока
  - Body: { watched_duration, is_completed }

GET /api/courses/:slug/progress
  - Общий прогресс по курсу
  - Возвращает: процент, пройдено уроков, время обучения
```

### Для записи на курс

```
POST /api/courses/:slug/enroll
  - Запись на курс (после оплаты)
  - Body: { tariff_id, payment_id, payment_status }
  - Создает: enrollment
```

### Админ-панель

```
GET /api/admin/courses
  - Список всех курсов (включая неактивные)

GET /api/admin/courses/:id
  - Детали курса для редактирования

POST /api/admin/courses
  - Создание курса

PUT /api/admin/courses/:id
  - Обновление курса

DELETE /api/admin/courses/:id
  - Удаление курса (soft delete)

# Аналогично для модулей, уроков, тарифов
GET/POST/PUT/DELETE /api/admin/courses/:id/modules
GET/POST/PUT/DELETE /api/admin/courses/:id/modules/:moduleId/lessons
GET/POST/PUT/DELETE /api/admin/courses/:id/tariffs
```

## 📱 Админ-панель для управления курсами

### Структура страниц:

1. **`/admin/courses`** — Список всех курсов
   - Таблица с фильтрами (активные/неактивные, категории)
   - Кнопки: Создать, Редактировать, Удалить
   - Статистика по каждому курсу

2. **`/admin/courses/new`** — Создание курса
   - Основная информация
   - Загрузка изображения
   - Выбор преподавателя
   - Настройки (активен, featured, new)

3. **`/admin/courses/:id/edit`** — Редактирование курса
   - Вкладки:
     - **Основное** — информация о курсе
     - **Модули и уроки** — дерево модулей/уроков (drag & drop для порядка)
     - **Тарифы** — управление тарифами
     - **Материалы** — список необходимых материалов
     - **Статистика** — студенты, прогресс, отзывы

4. **Управление модулями:**
   - Создание/редактирование модулей
   - Drag & drop для изменения порядка

5. **Управление уроками:**
   - Создание/редактирование уроков
   - Загрузка видео (URL или файл)
   - Добавление материалов к уроку
   - Настройка превью

6. **Управление тарифами:**
   - Создание/редактирование тарифов
   - Настройка цен и фич
   - Установка лимитов (ДЗ, поддержка)

## 🔐 Логика доступа

### Публичная страница:
- ✅ Все могут видеть описание курса
- ✅ Все могут видеть программу (названия)
- ❌ Видео только для купивших

### Личный кабинет:
- ✅ Только авторизованные пользователи
- ✅ Только те, кто купил курс (enrollment)
- ✅ Видео доступны только для купивших

### Админ-панель:
- ✅ Только админы
- ✅ Полный доступ ко всем данным

## 📈 Автоматические вычисления

1. **`courses.students_count`** — обновляется при создании enrollment
2. **`courses.rating`** — среднее из `course_reviews.rating`
3. **`courses.reviews_count`** — количество одобренных отзывов
4. **`enrollments.progress_percent`** — процент пройденных уроков
5. **`enrollments.lessons_completed`** — количество завершенных уроков

## 🎬 Видео

### Варианты хостинга:

1. **YouTube/Vimeo** (рекомендуется для начала)
   - Просто вставить embed URL
   - Бесплатно
   - Нет проблем с хостингом

2. **Собственный хостинг**
   - Загрузка через админку
   - Хранение в `public/uploads/videos/`
   - Требует CDN для больших файлов

3. **Специализированные сервисы** (Wistia, Vimeo Pro)
   - Платно, но с аналитикой
   - Защита от скачивания

**Рекомендация:** Начать с YouTube/Vimeo, потом можно мигрировать.

## 💳 Система оплаты

### Варианты:

1. **Stripe** (международные платежи)
   - Поддержка карт, PayPal
   - Комиссия ~3%

2. **YooKassa** (для РФ/СНГ)
   - Карты, СБП, электронные кошельки
   - Комиссия ~3-4%

3. **Оба** (рекомендуется)
   - Stripe для международных
   - YooKassa для РФ/СНГ

### Процесс оплаты:

1. Пользователь выбирает тариф → `/payment?course=:slug&tariff=:id`
2. Создается платеж в платежной системе
3. После успешной оплаты:
   - Webhook от платежной системы
   - Создается `enrollment`
   - Редирект в `/dashboard/courses/:slug`

## 📝 Домашние задания (будущее)

### Структура:

```sql
CREATE TABLE course_homeworks (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES course_lessons(id),
    title VARCHAR(255),
    description TEXT,
    requirements TEXT, -- Что нужно сделать
    order_index INTEGER
);

CREATE TABLE homework_submissions (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES enrollments(id),
    homework_id INTEGER REFERENCES course_homeworks(id),
    files JSONB, -- Загруженные файлы
    comment TEXT, -- Комментарий студента
    status VARCHAR(50), -- 'submitted', 'reviewed', 'approved'
    curator_comment TEXT,
    curator_rating INTEGER,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP
);
```

## 🎓 Сертификаты (будущее)

### Структура:

```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES enrollments(id),
    certificate_number VARCHAR(100) UNIQUE,
    pdf_path VARCHAR(255), -- Путь к PDF файлу
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 План реализации

### Этап 1: База данных (MVP)
1. ✅ Создать миграции для всех таблиц
2. ✅ Создать индексы для производительности
3. ✅ Создать скрипт для заполнения тестовыми данными

### Этап 2: Backend API
4. ✅ Создать контроллеры для курсов
5. ✅ Создать публичные роуты
6. ✅ Создать защищенные роуты (для авторизованных)
7. ✅ Создать админские роуты

### Этап 3: Frontend
8. ✅ Обновить `/courses` — загрузка из API
9. ✅ Обновить `/courses/:slug` — загрузка из API
10. ✅ Создать `/dashboard/courses/:slug` — страница курса в ЛК
11. ✅ Создать `/dashboard/courses/:slug/lessons/:id` — страница урока

### Этап 4: Оплата
12. ✅ Интеграция с платежной системой
13. ✅ Создание enrollment после оплаты

### Этап 5: Админ-панель
14. ✅ Создать `/admin/courses` — список курсов
15. ✅ Создать CRUD для курсов
16. ✅ Создать управление модулями/уроками
17. ✅ Создать управление тарифами

---

**Готов начать с создания миграций БД!** 🎯

