/**
 * Скрипт для заполнения тестовыми данными курсов
 * Переносит статические данные из frontend в БД
 */

import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(getDatabaseConfig());

// Функция для создания курса в БД
async function createCourse(courseData: CourseData, instructorId: number | null) {
  // Проверяем, существует ли курс
  const existing = await pool.query('SELECT id FROM courses WHERE slug = $1', [courseData.slug]);
  if (existing.rows.length > 0) {
    console.log(`⏭️  Курс "${courseData.title}" уже существует, пропускаем`);
    return;
  }

  // Создаем курс
  const courseResult = await pool.query(
    `INSERT INTO courses (
      slug, title, subtitle, description, level, category, duration,
      students_count, rating, reviews_count, instructor_id,
      is_featured, is_new, display_order, includes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
    [
      courseData.slug,
      courseData.title,
      courseData.subtitle,
      courseData.description,
      courseData.level,
      courseData.category,
      courseData.duration,
      courseData.students_count,
      courseData.rating,
      courseData.reviews_count,
      instructorId,
      courseData.is_featured,
      courseData.is_new,
      courseData.display_order,
      JSON.stringify(courseData.includes),
    ]
  );

  const courseId = courseResult.rows[0].id;
  console.log(`✅ Создан курс: ${courseData.title} (ID: ${courseId})`);

  // Создаем модули и уроки
  for (const moduleData of courseData.modules) {
    const moduleResult = await pool.query(
      `INSERT INTO course_modules (course_id, title, order_index)
       VALUES ($1, $2, $3) RETURNING id`,
      [courseId, moduleData.title, moduleData.order_index]
    );
    const moduleId = moduleResult.rows[0].id;
    console.log(`  📦 Создан модуль: ${moduleData.title}`);

    // Создаем уроки в модуле
    for (const lessonData of moduleData.lessons) {
      await pool.query(
        `INSERT INTO course_lessons (module_id, title, order_index, duration)
         VALUES ($1, $2, $3, $4)`,
        [moduleId, lessonData.title, lessonData.order_index, lessonData.duration]
      );
    }
    console.log(`    ✅ Создано уроков: ${moduleData.lessons.length}`);
  }

  // Создаем тарифы
  for (const tariffData of courseData.tariffs) {
    await pool.query(
      `INSERT INTO course_tariffs (
        course_id, tariff_type, name, price, old_price,
        is_popular, display_order, features, not_included,
        homework_reviews_limit, curator_support_months
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        courseId,
        tariffData.tariff_type,
        tariffData.name,
        tariffData.price,
        tariffData.old_price,
        tariffData.is_popular,
        tariffData.display_order,
        JSON.stringify(tariffData.features),
        JSON.stringify(tariffData.not_included),
        tariffData.homework_reviews_limit || null,
        tariffData.curator_support_months || null,
      ]
    );
    console.log(`  💰 Создан тариф: ${tariffData.name}`);
  }

  // Создаем материалы
  for (const materialData of courseData.materials) {
    await pool.query(
      `INSERT INTO course_materials (course_id, name, price_info, display_order)
       VALUES ($1, $2, $3, $4)`,
      [courseId, materialData.name, materialData.price_info, materialData.display_order]
    );
  }
  console.log(`  📋 Создано материалов: ${courseData.materials.length}`);

  console.log(`\n✅ Курс "${courseData.title}" успешно создан!`);
  console.log(`   Модулей: ${courseData.modules.length}`);
  console.log(`   Уроков: ${courseData.modules.reduce((sum, m) => sum + m.lessons.length, 0)}`);
  console.log(`   Тарифов: ${courseData.tariffs.length}`);
  console.log(`   Материалов: ${courseData.materials.length}\n`);
}

// Тип для курса
interface CourseData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'basics' | 'hardware' | 'extension' | 'design';
  duration: string;
  students_count: number;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  is_new: boolean;
  display_order: number;
  includes: string[];
  modules: Array<{
    title: string;
    order_index: number;
    lessons: Array<{
      title: string;
      order_index: number;
      duration: number;
    }>;
  }>;
  tariffs: Array<{
    tariff_type: 'self' | 'curator' | 'vip';
    name: string;
    price: number;
    old_price?: number;
    is_popular: boolean;
    display_order: number;
    homework_reviews_limit?: number;
    curator_support_months?: number;
    features: string[];
    not_included: string[];
  }>;
  materials: Array<{
    name: string;
    price_info: string;
    display_order: number;
  }>;
}

// Данные для "Базовый курс маникюра"
const basicManicureCourse: CourseData = {
  slug: 'basic-manicure',
  title: 'Базовый курс маникюра',
  subtitle: 'От новичка до профессионала за 4 недели',
  description: 'Комплексная программа обучения для тех, кто хочет освоить профессию nail-мастера с нуля. Вы научитесь выполнять классический и аппаратный маникюр, работать с гель-лаком и создавать идеальное покрытие.',
  level: 'beginner',
  category: 'basics',
  duration: '4 недели',
  students_count: 2847,
  rating: 4.9,
  reviews_count: 456,
  is_featured: true,
  is_new: true,
  display_order: 1,
  includes: [
    '32 видеоурока в HD качестве',
    'Проверка домашних заданий куратором',
    'Сертификат о прохождении курса',
    'Бессрочный доступ к материалам',
    'Закрытый чат с участниками',
    'Список материалов для работы',
  ],
  modules: [
    {
      title: 'Модуль 1. Введение в профессию',
      order_index: 1,
      lessons: [
        { title: 'Обзор профессии nail-мастера', order_index: 1, duration: 1200 },
        { title: 'Организация рабочего места', order_index: 2, duration: 900 },
        { title: 'Инструменты и материалы', order_index: 3, duration: 1500 },
        { title: 'Санитарные нормы и стерилизация', order_index: 4, duration: 1800 },
      ],
    },
    {
      title: 'Модуль 2. Классический маникюр',
      order_index: 2,
      lessons: [
        { title: 'Строение ногтя', order_index: 1, duration: 1000 },
        { title: 'Опил ногтевой пластины', order_index: 2, duration: 2000 },
        { title: 'Техника обрезного маникюра', order_index: 3, duration: 2400 },
        { title: 'Работа с кутикулой', order_index: 4, duration: 1800 },
      ],
    },
    {
      title: 'Модуль 3. Аппаратный маникюр',
      order_index: 3,
      lessons: [
        { title: 'Выбор аппарата и фрез', order_index: 1, duration: 1500 },
        { title: 'Техники работы с аппаратом', order_index: 2, duration: 3000 },
        { title: 'Комбинированная техника', order_index: 3, duration: 2500 },
        { title: 'Работа с проблемными ногтями', order_index: 4, duration: 2200 },
      ],
    },
    {
      title: 'Модуль 4. Покрытие гель-лаком',
      order_index: 4,
      lessons: [
        { title: 'Подготовка ногтя к покрытию', order_index: 1, duration: 1200 },
        { title: 'Нанесение базы и цвета', order_index: 2, duration: 2800 },
        { title: 'Идеальные торцы и блики', order_index: 3, duration: 2000 },
        { title: 'Снятие покрытия', order_index: 4, duration: 1500 },
      ],
    },
  ],
  tariffs: [
    {
      tariff_type: 'self',
      name: 'Самостоятельный',
      price: 129,
      old_price: 199,
      is_popular: false,
      display_order: 1,
      features: [
        'Доступ ко всем урокам',
        'Бессрочный доступ',
        'Закрытый чат',
        'Сертификат',
      ],
      not_included: ['Проверка ДЗ', 'Обратная связь'],
    },
    {
      tariff_type: 'curator',
      name: 'С куратором',
      price: 199,
      old_price: 299,
      is_popular: true,
      display_order: 2,
      homework_reviews_limit: 16,
      curator_support_months: 2,
      features: [
        "Всё из тарифа 'Самостоятельный'",
        'Проверка 16 домашних заданий',
        'Обратная связь в течение 24 часов',
        '2 месяца поддержки куратора',
      ],
      not_included: [],
    },
    {
      tariff_type: 'vip',
      name: 'VIP',
      price: 349,
      old_price: 499,
      is_popular: false,
      display_order: 3,
      homework_reviews_limit: null, // безлимит
      curator_support_months: null, // пожизненно
      features: [
        "Всё из тарифа 'С куратором'",
        'Индивидуальные созвоны с экспертом',
        'Помощь в поиске первых клиентов',
        'Пожизненная поддержка',
        'Бонусные мастер-классы',
      ],
      not_included: [],
    },
  ],
  materials: [
    { name: 'Аппарат для маникюра', price_info: '(от 100 €)', display_order: 1 },
    { name: 'Набор фрез', price_info: '(от 20 €)', display_order: 2 },
    { name: 'Лампа для сушки', price_info: '(от 30 €)', display_order: 3 },
    { name: 'База, топ, гель-лаки', price_info: '(от 50 €)', display_order: 4 },
    { name: 'Инструменты', price_info: '(от 30 €)', display_order: 5 },
  ],
};

// Данные для "Аппаратный маникюр"
const hardwareManicureCourse: CourseData = {
  slug: 'hardware-manicure',
  title: 'Аппаратный маникюр',
  subtitle: 'Профессиональное владение аппаратом за 3 недели',
  description: 'Профессиональное владение аппаратом. Фрезы, техники, работа с проблемными ногтями. Научитесь выполнять аппаратный маникюр на высоком уровне.',
  level: 'beginner',
  category: 'hardware',
  duration: '3 недели',
  students_count: 1892,
  rating: 4.7,
  reviews_count: 234,
  is_featured: false,
  is_new: false,
  display_order: 2,
  includes: [
    '24 видеоурока в HD качестве',
    'Проверка домашних заданий куратором',
    'Сертификат о прохождении курса',
    'Бессрочный доступ к материалам',
    'Закрытый чат с участниками',
    'Список материалов для работы',
  ],
  modules: [
    {
      title: 'Модуль 1. Основы аппаратного маникюра',
      order_index: 1,
      lessons: [
        { title: 'Введение в аппаратный маникюр', order_index: 1, duration: 1000 },
        { title: 'Выбор аппарата и фрез', order_index: 2, duration: 2000 },
        { title: 'Настройка аппарата', order_index: 3, duration: 1500 },
        { title: 'Безопасность и санитария', order_index: 4, duration: 1200 },
      ],
    },
    {
      title: 'Модуль 2. Техники работы с фрезами',
      order_index: 2,
      lessons: [
        { title: 'Виды фрез и их применение', order_index: 1, duration: 1800 },
        { title: 'Техника опила ногтевой пластины', order_index: 2, duration: 2500 },
        { title: 'Работа с кутикулой аппаратом', order_index: 3, duration: 2200 },
        { title: 'Обработка боковых валиков', order_index: 4, duration: 2000 },
      ],
    },
    {
      title: 'Модуль 3. Работа с проблемными ногтями',
      order_index: 3,
      lessons: [
        { title: 'Тонкие и ломкие ногти', order_index: 1, duration: 2000 },
        { title: 'Вросшие ногти', order_index: 2, duration: 2400 },
        { title: 'Грибковые поражения', order_index: 3, duration: 1800 },
        { title: 'Травмированные ногти', order_index: 4, duration: 2000 },
      ],
    },
  ],
  tariffs: [
    {
      tariff_type: 'self',
      name: 'Самостоятельный',
      price: 99,
      old_price: 149,
      is_popular: false,
      display_order: 1,
      features: [
        'Доступ ко всем урокам',
        'Бессрочный доступ',
        'Закрытый чат',
        'Сертификат',
      ],
      not_included: ['Проверка ДЗ', 'Обратная связь'],
    },
    {
      tariff_type: 'curator',
      name: 'С куратором',
      price: 149,
      old_price: 199,
      is_popular: true,
      display_order: 2,
      homework_reviews_limit: 12,
      curator_support_months: 2,
      features: [
        "Всё из тарифа 'Самостоятельный'",
        'Проверка 12 домашних заданий',
        'Обратная связь в течение 24 часов',
        '2 месяца поддержки куратора',
      ],
      not_included: [],
    },
    {
      tariff_type: 'vip',
      name: 'VIP',
      price: 249,
      old_price: 349,
      is_popular: false,
      display_order: 3,
      homework_reviews_limit: null,
      curator_support_months: null,
      features: [
        "Всё из тарифа 'С куратором'",
        'Индивидуальные созвоны с экспертом',
        'Помощь в поиске первых клиентов',
        'Пожизненная поддержка',
        'Бонусные мастер-классы',
      ],
      not_included: [],
    },
  ],
  materials: [
    { name: 'Аппарат для маникюра', price_info: '(от 100 €)', display_order: 1 },
    { name: 'Набор фрез (базовый)', price_info: '(от 25 €)', display_order: 2 },
    { name: 'Антисептик и стерилизатор', price_info: '(от 15 €)', display_order: 3 },
    { name: 'Крем для рук', price_info: '(от 10 €)', display_order: 4 },
  ],
};

// Массив всех курсов для создания
const coursesToSeed: CourseData[] = [
  basicManicureCourse,
  hardwareManicureCourse,
];

async function seedCourses() {
  try {
    console.log('🌱 Заполнение тестовыми данными курсов...\n');

    // Получаем первого преподавателя из team_members (если есть)
    const instructorResult = await pool.query(
      'SELECT id FROM team_members WHERE is_active = TRUE LIMIT 1'
    );
    const instructorId = instructorResult.rows[0]?.id || null;

    // Создаем все курсы
    for (const courseData of coursesToSeed) {
      await createCourse(courseData, instructorId);
    }

    console.log(`\n✨ Все курсы обработаны!`);
    console.log(`   Всего курсов в БД: ${coursesToSeed.length}`);

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.code) {
      console.error('   Код ошибки:', error.code);
    }
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

seedCourses();

