import { Pool } from 'pg';
import { getDatabaseConfig } from '../../database/config';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

const defaultFounderInfo = {
  name: "Анна Петрова",
  greeting: "Привет! Я",
  role: "Основатель NailArt Academy, международный судья и призёр чемпионатов по nail-art",
  image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop",
  experience_years: 12,
  experience_label: "лет опыта работы",
  achievements: [
    "Обучила более 15 000 мастеров по всему миру",
    "Автор уникальных техник, признанных международным сообществом",
    "Постоянный эксперт beauty-изданий",
    "Амбассадор ведущих брендов nail-индустрии"
  ],
  button_text: "Узнать больше",
  button_link: "/about",
  is_active: true,
};

async function seedFounder() {
  console.log('Начало заполнения информации об основателе...');
  try {
    // Проверяем, есть ли уже запись
    const existing = await pool.query(
      'SELECT id FROM founder_info WHERE is_active = TRUE LIMIT 1'
    );

    if (existing.rows.length > 0) {
      // Обновляем существующую запись
      const result = await pool.query(
        `UPDATE founder_info 
         SET name = $1, greeting = $2, role = $3, image_url = $4, 
             experience_years = $5, experience_label = $6, achievements = $7,
             button_text = $8, button_link = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
         WHERE id = $11
         RETURNING id`,
        [
          defaultFounderInfo.name,
          defaultFounderInfo.greeting,
          defaultFounderInfo.role,
          defaultFounderInfo.image_url,
          defaultFounderInfo.experience_years,
          defaultFounderInfo.experience_label,
          defaultFounderInfo.achievements,
          defaultFounderInfo.button_text,
          defaultFounderInfo.button_link,
          defaultFounderInfo.is_active,
          existing.rows[0].id,
        ]
      );
      console.log(`✓ Обновлена информация об основателе: ${defaultFounderInfo.name}`);
    } else {
      // Создаем новую запись
      const result = await pool.query(
        `INSERT INTO founder_info 
         (name, greeting, role, image_url, experience_years, experience_label, 
          achievements, button_text, button_link, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          defaultFounderInfo.name,
          defaultFounderInfo.greeting,
          defaultFounderInfo.role,
          defaultFounderInfo.image_url,
          defaultFounderInfo.experience_years,
          defaultFounderInfo.experience_label,
          defaultFounderInfo.achievements,
          defaultFounderInfo.button_text,
          defaultFounderInfo.button_link,
          defaultFounderInfo.is_active,
        ]
      );
      console.log(`✓ Добавлена информация об основателе: ${defaultFounderInfo.name}`);
    }
    console.log(`\n✓ Успешно сохранена информация об основателе в базу данных`);
  } catch (error) {
    console.error('Ошибка при заполнении информации об основателе:', error);
  } finally {
    await pool.end();
  }
}

seedFounder();

