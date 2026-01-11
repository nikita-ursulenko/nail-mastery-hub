import { Pool } from 'pg';
import { getDatabaseConfig } from '../../database/config';

const pool = new Pool(getDatabaseConfig());

/**
 * Генерирует случайный реферальный код из 8 символов (буквы + цифры)
 * @returns Случайный код формата: ABC123XY
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Валидирует формат реферального кода
 * @param code - Код для проверки
 * @returns true если код валидный (8 символов, буквы и цифры)
 */
export function validateReferralCode(code: string): boolean {
  if (!code || code.length !== 8) {
    return false;
  }
  
  const regex = /^[A-Z0-9]{8}$/;
  return regex.test(code);
}

/**
 * Проверяет уникальность кода в базе данных
 * @param code - Код для проверки
 * @returns Promise<boolean> - true если код уникальный
 */
export async function checkCodeUniqueness(code: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT id FROM referral_partners WHERE referral_code = $1',
      [code]
    );
    return result.rows.length === 0;
  } catch (error) {
    console.error('Error checking code uniqueness:', error);
    return false;
  }
}

/**
 * Генерирует уникальный реферальный код
 * Проверяет уникальность и генерирует новый код если нужно
 * @param maxAttempts - Максимальное количество попыток (по умолчанию 10)
 * @returns Promise<string> - Уникальный реферальный код
 */
export async function generateUniqueReferralCode(maxAttempts: number = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateReferralCode();
    const isUnique = await checkCodeUniqueness(code);
    
    if (isUnique) {
      return code;
    }
  }
  
  // Если не удалось сгенерировать за maxAttempts попыток, выбрасываем ошибку
  throw new Error('Не удалось сгенерировать уникальный реферальный код');
}
