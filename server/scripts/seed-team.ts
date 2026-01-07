import { Pool } from 'pg';
import { getDatabaseConfig } from '../../database/config';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

const defaultTeamMembers = [
  {
    name: "Анна Петрова",
    role: "Основатель и главный преподаватель",
    bio: "Международный судья, призёр чемпионатов по nail-art. Обучила более 15 000 мастеров по всему миру.",
    image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    achievements: [
      "12 лет опыта в индустрии",
      "Автор уникальных техник",
      "Эксперт beauty-изданий",
    ],
    display_order: 1,
    is_active: true,
  },
  {
    name: "Мария Соколова",
    role: "Преподаватель дизайна",
    bio: "Специалист по художественному дизайну ногтей. Работает с топовыми салонами Москвы и Санкт-Петербурга.",
    image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    achievements: [
      "8 лет в профессии",
      "Мастер международного класса",
      "Победитель конкурсов дизайна",
    ],
    display_order: 2,
    is_active: true,
  },
  {
    name: "Елена Новикова",
    role: "Преподаватель наращивания",
    bio: "Эксперт по наращиванию гелем и акрилом. Помогла сотням мастеров освоить сложные техники.",
    image_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    achievements: [
      "10 лет опыта",
      "Сертифицированный тренер",
      "Автор курсов по архитектуре",
    ],
    display_order: 3,
    is_active: true,
  },
];

async function seedTeam() {
  console.log('Начало заполнения команды...');
  try {
    for (const member of defaultTeamMembers) {
      const result = await pool.query(
        `INSERT INTO team_members (name, role, bio, image_url, achievements, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          member.name,
          member.role,
          member.bio,
          member.image_url,
          member.achievements,
          member.display_order,
          member.is_active,
        ]
      );
      if (result.rows.length > 0) {
        console.log(`✓ Добавлен член команды: ${member.name}`);
      } else {
        console.log(`- Пропущен (уже существует): ${member.name}`);
      }
    }
    console.log(`\n✓ Успешно добавлено ${defaultTeamMembers.length} членов команды в базу данных`);
  } catch (error) {
    console.error('Ошибка при заполнении команды:', error);
  } finally {
    await pool.end();
  }
}

seedTeam();

