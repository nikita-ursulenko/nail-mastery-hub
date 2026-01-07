import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const pool = new Pool(getDatabaseConfig());

interface Setting {
  key: string;
  value: string | boolean | number;
  type: string;
  description?: string;
}

// Получить все настройки
export const getAllSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT setting_key, setting_value, setting_type, description, updated_at
     FROM admin_settings
     ORDER BY setting_key`
  );

  const settings: { [key: string]: any } = {};
  result.rows.forEach((row: any) => {
    let value: any = row.setting_value;
    
    // Преобразуем значение в зависимости от типа
    if (row.setting_type === 'boolean') {
      value = value === 'true' || value === true;
    } else if (row.setting_type === 'number') {
      value = parseFloat(value) || 0;
    } else if (row.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = value;
      }
    }
    
    settings[row.setting_key] = {
      value,
      type: row.setting_type,
      description: row.description,
      updated_at: row.updated_at,
    };
  });

  res.json({ settings });
});

// Получить настройку по ключу
export const getSettingByKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  
  const result = await pool.query(
    `SELECT setting_key, setting_value, setting_type, description, updated_at
     FROM admin_settings 
     WHERE setting_key = $1`,
    [key]
  );

  if (result.rows.length === 0) {
    throw new AppError('Настройка не найдена', 404);
  }

  const row = result.rows[0];
  let value: any = row.setting_value;
  
  // Преобразуем значение в зависимости от типа
  if (row.setting_type === 'boolean') {
    value = value === 'true' || value === true;
  } else if (row.setting_type === 'number') {
    value = parseFloat(value) || 0;
  } else if (row.setting_type === 'json') {
    try {
      value = JSON.parse(value);
    } catch (e) {
      value = value;
    }
  }

  res.json({
    key: row.setting_key,
    value,
    type: row.setting_type,
    description: row.description,
    updated_at: row.updated_at,
  });
});

// Обновить настройку
export const updateSetting = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value, type } = req.body;

  if (value === undefined) {
    throw new AppError('Значение настройки обязательно', 400);
  }

  // Преобразуем значение в строку для хранения
  let stringValue: string;
  if (type === 'boolean') {
    stringValue = value ? 'true' : 'false';
  } else if (type === 'number') {
    stringValue = String(value);
  } else if (type === 'json') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  // Проверяем существование настройки
  const existing = await pool.query(
    'SELECT setting_key, setting_type FROM admin_settings WHERE setting_key = $1',
    [key]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Настройка не найдена', 404);
  }

  const settingType = type || existing.rows[0].setting_type;

  // Обновляем настройку
  const result = await pool.query(
    `UPDATE admin_settings 
     SET setting_value = $1, setting_type = $2, updated_at = CURRENT_TIMESTAMP
     WHERE setting_key = $3
     RETURNING setting_key, setting_value, setting_type, description, updated_at`,
    [stringValue, settingType, key]
  );

  const row = result.rows[0];
  let parsedValue: any = row.setting_value;
  
  // Преобразуем значение обратно
  if (row.setting_type === 'boolean') {
    parsedValue = parsedValue === 'true' || parsedValue === true;
  } else if (row.setting_type === 'number') {
    parsedValue = parseFloat(parsedValue) || 0;
  } else if (row.setting_type === 'json') {
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch (e) {
      parsedValue = parsedValue;
    }
  }

  res.json({
    key: row.setting_key,
    value: parsedValue,
    type: row.setting_type,
    description: row.description,
    updated_at: row.updated_at,
  });
});

// Обновить несколько настроек сразу
export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    throw new AppError('Настройки должны быть объектом', 400);
  }

  const updatedSettings: { [key: string]: any } = {};

  // Обновляем каждую настройку
  for (const [key, value] of Object.entries(settings)) {
    // Получаем тип настройки из БД
    const existing = await pool.query(
      'SELECT setting_type FROM admin_settings WHERE setting_key = $1',
      [key]
    );

    if (existing.rows.length === 0) {
      continue; // Пропускаем несуществующие настройки
    }

    const settingType = existing.rows[0].setting_type;
    
    // Преобразуем значение в строку для хранения
    let stringValue: string;
    if (settingType === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else if (settingType === 'number') {
      stringValue = String(value);
    } else if (settingType === 'json') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    // Обновляем настройку
    const result = await pool.query(
      `UPDATE admin_settings 
       SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
       WHERE setting_key = $2
       RETURNING setting_key, setting_value, setting_type, description, updated_at`,
      [stringValue, key]
    );

    const row = result.rows[0];
    let parsedValue: any = row.setting_value;
    
    // Преобразуем значение обратно
    if (row.setting_type === 'boolean') {
      parsedValue = parsedValue === 'true' || parsedValue === true;
    } else if (row.setting_type === 'number') {
      parsedValue = parseFloat(parsedValue) || 0;
    } else if (row.setting_type === 'json') {
      try {
        parsedValue = JSON.parse(parsedValue);
      } catch (e) {
        parsedValue = parsedValue;
      }
    }

    updatedSettings[row.setting_key] = {
      value: parsedValue,
      type: row.setting_type,
      description: row.description,
      updated_at: row.updated_at,
    };
  }

  res.json({ settings: updatedSettings });
});

