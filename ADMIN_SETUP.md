# Настройка админ-панели

## Быстрый старт

### 1. Установка зависимостей

Зависимости уже установлены. Если нужно переустановить:

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте шаблон и настройте переменные:

```bash
cp env.template .env
```

Отредактируйте `.env` файл, особенно `JWT_SECRET` (минимум 32 символа для безопасности).

### 3. Запуск базы данных

```bash
npm run db:up
```

### 4. Выполнение миграций

```bash
npm run migrate:up
```

Это создаст таблицу `admins` в базе данных.

### 5. Создание первого администратора

```bash
npm run create-admin
```

Введите:
- Email (например: admin@example.com)
- Имя (например: Администратор)
- Пароль (минимум 6 символов)

### 6. Запуск приложения

#### Вариант 1: Запустить frontend и backend одновременно

```bash
npm run dev:all
```

#### Вариант 2: Запустить отдельно

В одном терминале (frontend):
```bash
npm run dev
```

В другом терминале (backend):
```bash
npm run dev:server
```

### 7. Доступ к админ-панели

1. Откройте браузер: http://localhost:8080
2. Перейдите на: http://localhost:8080/admin/login
3. Войдите с учетными данными, созданными на шаге 5

## Структура проекта

```
nail-mastery-hub/
├── server/              # Backend API
│   ├── index.ts        # Точка входа сервера
│   ├── routes/         # API роуты
│   ├── controllers/    # Контроллеры
│   ├── middleware/     # Middleware
│   └── scripts/        # Вспомогательные скрипты
├── src/
│   ├── pages/admin/   # Страницы админ-панели
│   ├── components/admin/ # Компоненты админ-панели
│   ├── contexts/        # React контексты (AuthContext)
│   └── lib/             # Утилиты (API клиент)
└── database/
    └── migrations/      # Миграции БД
```

## API Endpoints

### Публичные
- `GET /api/health` - Проверка здоровья сервера

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/verify` - Проверка токена (требует токен)

### Админ-панель (требует токен)
- `GET /api/admin/dashboard/stats` - Статистика дашборда

## Безопасность

- JWT токены хранятся в `localStorage` браузера
- Пароли хешируются с помощью bcrypt
- Все админские роуты защищены middleware аутентификации
- CORS настроен для работы только с указанным frontend URL

## Troubleshooting

### Ошибка: "Таблица admins не найдена"
Выполните миграции: `npm run migrate:up`

### Ошибка: "Cannot connect to database"
Убедитесь, что база данных запущена: `npm run db:up`

### Ошибка: "Port 3001 already in use"
Измените `SERVER_PORT` в `.env` файле или остановите процесс, использующий порт 3001

### Ошибка при установке зависимостей
Попробуйте удалить `node_modules` и `package-lock.json`, затем:
```bash
npm install
```

