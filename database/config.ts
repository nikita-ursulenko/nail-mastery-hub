/**
 * Конфигурация подключения к базе данных
 * 
 * Использует Supabase JS SDK - НЕ ТРЕБУЕТ ПАРОЛЯ БД!
 * Работает через REST API с VITE_SUPABASE_ANON_KEY
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton для Supabase клиента
let supabaseClient: SupabaseClient | null = null;

/**
 * Получить Supabase клиент
 * Использует VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL or Anon Key is missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

/**
 * Экспортируем клиент для использования в контроллерах
 */
export const supabase = getSupabaseClient();

/**
 * Legacy: для обратной совместимости с pg Pool (если нужно)
 * НЕ ИСПОЛЬЗУЕТСЯ с Supabase - оставлено для справки
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export function getDatabaseConfig(): DatabaseConfig {
  throw new Error(
    'getDatabaseConfig() is deprecated. Use getSupabaseClient() instead.'
  );
}

export function getConnectionString(): string {
  throw new Error(
    'getConnectionString() is deprecated. Use getSupabaseClient() instead.'
  );
}

/**
 * Конфигурация для pgAdmin (только для локальной разработки)
 */
export const pgAdminConfig = {
  url: process.env.PGADMIN_URL || 'http://localhost:5050',
  email: process.env.PGADMIN_EMAIL || 'admin@nailmastery.com',
  password: process.env.PGADMIN_PASSWORD || 'admin123',
};
