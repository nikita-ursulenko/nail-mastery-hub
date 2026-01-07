# Backend Server

Backend API сервер для админ-панели Nail Mastery Hub.

## Структура

```
server/
├── index.ts              # Точка входа сервера
├── routes/               # API роуты
│   ├── auth.ts          # Роуты аутентификации
│   └── admin.ts         # Роуты админ-панели
├── controllers/         # Контроллеры
│   ├── authController.ts
│   └── adminController.ts
├── middleware/          # Middleware
│   └── auth.ts          # Middleware для проверки JWT токенов
└── scripts/             # Вспомогательные скрипты
    └── create-admin.ts  # Скрипт для создания администратора
```

## Запуск

### Разработка

Запустить только сервер:
```bash
npm run dev:server
```

Запустить frontend и backend одновременно:
```bash
npm run dev:all
```

### Production

```bash
npm run server
```

## API Endpoints

### Аутентификация

- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/verify` - Проверка токена (требует аутентификации)

### Админ-панель

Все админские роуты требуют JWT токен в заголовке `Authorization: Bearer <token>`

- `GET /api/admin/dashboard/stats` - Получить статистику дашборда

## Создание администратора

```bash
npm run create-admin
```

Скрипт попросит ввести:
- Email
- Имя
- Пароль (минимум 6 символов)

**Важно:** Перед созданием администратора убедитесь, что миграция `0001_create_admins_table.sql` выполнена:

```bash
npm run migrate:up
```

## Переменные окружения

См. `env.template` для списка необходимых переменных окружения.

## Безопасность

- JWT токены используются для аутентификации
- Пароли хешируются с помощью bcrypt
- CORS настроен для работы с frontend
- Все админские роуты защищены middleware `authenticateToken`

