import bcrypt from 'bcryptjs';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

const testimonials = [
  {
    name: "Анна Козлова",
    role: "Выпускница базового курса",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    text: "Благодаря курсу я смогла уволиться с нелюбимой работы и открыть свой кабинет. Уже через 3 месяца полностью окупила обучение!",
    rating: 5,
  },
  {
    name: "Мария Соколова",
    role: "Мастер маникюра",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    text: "Курс по дизайну полностью изменил мой подход к работе. Клиенты в восторге, записываются за месяц вперёд!",
    rating: 5,
  },
  {
    name: "Елена Новикова",
    role: "Начинающий мастер",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    text: "Очень понравился формат обучения. Куратор всегда на связи, материалы понятные даже для новичка.",
    rating: 5,
  },
  {
    name: "Ольга Петрова",
    role: "Владелец салона",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    text: "Прошла все курсы от базового до VIP. Теперь у меня свой салон с 5 мастерами. Качество обучения на высшем уровне!",
    rating: 5,
  },
  {
    name: "Татьяна Иванова",
    role: "Выпускница курса наращивания",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    text: "Долго искала хороший курс по наращиванию. Здесь всё объясняют детально, с примерами. Теперь делаю идеальные ногти!",
    rating: 5,
  },
  {
    name: "Светлана Волкова",
    role: "Мастер nail-арта",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    text: "Курс по дизайну открыл для меня новые техники. Теперь я создаю уникальные дизайны, которых нет ни у кого в городе.",
    rating: 5,
  },
  {
    name: "Ирина Смирнова",
    role: "Выпускница аппаратного маникюра",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
    text: "Боялась работать с аппаратом, но курс развеял все страхи. Теперь аппаратный маникюр - моя специализация.",
    rating: 5,
  },
  {
    name: "Наталья Федорова",
    role: "Начинающий мастер",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
    text: "Начала с нуля, без опыта. Благодаря поддержке куратора и качественным материалам быстро освоила профессию.",
    rating: 5,
  },
  {
    name: "Юлия Морозова",
    role: "Мастер с опытом",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
    text: "Уже работала мастером, но хотела повысить квалификацию. Курсы помогли освоить новые техники и увеличить доход.",
    rating: 5,
  },
];

async function seedTestimonials() {
  try {
    console.log('Начало переноса отзывов в БД...\n');

    // Проверяем, существует ли таблица
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'testimonials'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ Таблица testimonials не найдена. Запустите миграции: npm run migrate:up');
      process.exit(1);
    }

    // Проверяем, есть ли уже отзывы
    const existingCount = await pool.query('SELECT COUNT(*) FROM testimonials');
    const count = parseInt(existingCount.rows[0].count);

    if (count > 0) {
      console.log(`⚠️  В базе уже есть ${count} отзывов. Пропускаем добавление.`);
      await pool.end();
      return;
    }

    // Добавляем отзывы
    for (const testimonial of testimonials) {
      await pool.query(
        'INSERT INTO testimonials (name, role, avatar, text, rating) VALUES ($1, $2, $3, $4, $5)',
        [testimonial.name, testimonial.role, testimonial.avatar, testimonial.text, testimonial.rating]
      );
    }

    console.log(`✅ Успешно добавлено ${testimonials.length} отзывов в базу данных!`);
  } catch (error) {
    console.error('❌ Ошибка при добавлении отзывов:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedTestimonials();

