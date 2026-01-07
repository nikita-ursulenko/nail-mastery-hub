import bcrypt from 'bcryptjs';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import readline from 'readline';

const pool = new Pool(getDatabaseConfig());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('Создание администратора...\n');

    const email = await question('Email: ');
    if (!email) {
      console.error('Email обязателен!');
      process.exit(1);
    }

    const name = await question('Имя: ');
    if (!name) {
      console.error('Имя обязательно!');
      process.exit(1);
    }

    const password = await question('Пароль: ');
    if (!password || password.length < 6) {
      console.error('Пароль должен быть не менее 6 символов!');
      process.exit(1);
    }

    // Проверяем, существует ли таблица
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('Таблица admins не найдена. Запустите миграции: npm run migrate:up');
      process.exit(1);
    }

    // Проверяем, существует ли админ с таким email
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      console.error('Администратор с таким email уже существует!');
      process.exit(1);
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаем админа
    const result = await pool.query(
      'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    console.log('\n✅ Администратор успешно создан!');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Имя: ${result.rows[0].name}`);
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();

