# ✅ Настройка завершена!

Все необходимые шаги выполнены автоматически.

## Что было сделано:

1. ✅ Создан файл `.env` с безопасным JWT_SECRET
2. ✅ База данных запущена (Docker контейнеры)
3. ✅ Миграции выполнены (таблица `admins` создана)
4. ✅ Администратор создан

## Данные для входа:

**Email:** `admin@nailmastery.com`  
**Пароль:** `admin123`

⚠️ **ВАЖНО:** Измените пароль после первого входа!

## Запуск приложения:

### Вариант 1: Запустить всё вместе (рекомендуется)

```bash
npm run dev:all
```

Это запустит:

- Frontend на http://localhost:8080
- Backend API на http://localhost:3001

### Вариант 2: Запустить отдельно

**Терминал 1 (Frontend):**

```bash
npm run dev
```

**Терминал 2 (Backend):**

```bash
npm run dev:server
```

## Доступ к админ-панели:

1. Откройте браузер: http://localhost:8080
2. Перейдите на: http://localhost:8080/admin/login
3. Войдите с указанными выше данными

## Проверка работы:

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001/api/health
- Админ-панель: http://localhost:8080/admin/login

## Изменение данных администратора:

Если нужно изменить email или пароль администратора, используйте переменные окружения:

```bash
ADMIN_EMAIL=your@email.com ADMIN_NAME="Ваше имя" ADMIN_PASSWORD=yourpassword npm run create-admin:auto
```

Или используйте интерактивный скрипт:

```bash
npm run create-admin
```

## Структура проекта:

```
nail-mastery-hub/
├── server/              # Backend API
│   ├── index.ts         # Сервер Express
│   ├── routes/          # API роуты
│   ├── controllers/     # Контроллеры
│   ├── middleware/      # Middleware
│   └── scripts/         # Скрипты
├── src/
│   ├── pages/admin/     # Страницы админ-панели
│   ├── components/admin/ # Компоненты админки
│   ├── contexts/        # React контексты
│   └── lib/             # API клиент
└── database/
    └── migrations/      # Миграции БД
```

## Следующие шаги:

1. Запустите приложение: `npm run dev:all`
2. Войдите в админ-панель
3. Начните добавлять функциональность в админ-панель
