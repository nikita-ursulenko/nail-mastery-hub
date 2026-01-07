# API для управления отзывами

## Endpoints

Все endpoints требуют JWT токен в заголовке `Authorization: Bearer <token>`

### GET /api/admin/testimonials
Получить список всех отзывов

**Response:**
```json
[
  {
    "id": 1,
    "name": "Анна Козлова",
    "role": "Выпускница базового курса",
    "avatar": "https://...",
    "text": "Текст отзыва...",
    "rating": 5,
    "created_at": "2024-01-07T00:00:00.000Z",
    "updated_at": "2024-01-07T00:00:00.000Z"
  }
]
```

### GET /api/admin/testimonials/:id
Получить отзыв по ID

### POST /api/admin/testimonials
Создать новый отзыв

**Request Body:**
```json
{
  "name": "Имя автора",
  "role": "Роль автора",
  "avatar": "https://...", // опционально
  "text": "Текст отзыва",
  "rating": 5 // от 1 до 5
}
```

### PUT /api/admin/testimonials/:id
Обновить отзыв

**Request Body:** (те же поля, что и при создании)

### DELETE /api/admin/testimonials/:id
Удалить отзыв

**Response:**
```json
{
  "message": "Отзыв успешно удален"
}
```

## Защита

- Все endpoints защищены middleware `authenticateToken`
- Требуется валидный JWT токен администратора
- Валидация данных на уровне контроллера

