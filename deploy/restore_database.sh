#!/bin/bash

# Скрипт для восстановления базы данных из дампа
# Использование: ./restore_database.sh [путь_к_дампу]

set -e

DUMP_FILE="${1:-database_dump.sql}"

echo "🔄 Восстановление базы данных из дампа: $DUMP_FILE"

# Проверяем, существует ли файл
if [ ! -f "$DUMP_FILE" ]; then
    echo "❌ Файл дампа не найден: $DUMP_FILE"
    exit 1
fi

# Проверяем, запущен ли Docker контейнер
if ! docker ps | grep -q nail-mastery-db; then
    echo "⚠️  Docker контейнер с БД не запущен. Запускаю..."
    docker-compose up -d postgres
    echo "⏳ Ожидание готовности БД..."
    sleep 5
fi

# Если файл сжат, распаковываем
if [[ "$DUMP_FILE" == *.gz ]]; then
    echo "📦 Распаковка дампа..."
    gunzip -c "$DUMP_FILE" | docker exec -i nail-mastery-db psql -U nailmastery -d nail_mastery_hub
else
    echo "📥 Восстановление из дампа..."
    docker exec -i nail-mastery-db psql -U nailmastery -d nail_mastery_hub < "$DUMP_FILE"
fi

echo "✅ База данных успешно восстановлена!"


