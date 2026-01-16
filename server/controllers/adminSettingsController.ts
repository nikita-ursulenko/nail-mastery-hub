import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

interface Setting {
  key: string;
  value: string | boolean | number;
  type: string;
  description?: string;
}

// Получить все настройки
export const getAllSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { data: result, error } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value, setting_type, description, updated_at')
    .order('setting_key');

  if (error) throw error;

  const settings: { [key: string]: any } = {};
  result?.forEach((row: any) => {
    let value: any = row.setting_value;

    // Преобразуем значение в зависимости от типа
    if (row.setting_type === 'boolean') {
      value = value === 'true' || value === true;
    } else if (row.setting_type === 'number') {
      value = parseFloat(value) || 0;
    } else if (row.setting_type === 'json') {
      try {
        value = typeof value === 'string' ? JSON.parse(value) : value;
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

  const { data: row, error } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value, setting_type, description, updated_at')
    .eq('setting_key', key)
    .single();

  if (error || !row) {
    throw new AppError('Настройка не найдена', 404);
  }

  let value: any = row.setting_value;

  // Преобразуем значение в зависимости от типа
  if (row.setting_type === 'boolean') {
    value = value === 'true' || value === true;
  } else if (row.setting_type === 'number') {
    value = parseFloat(value) || 0;
  } else if (row.setting_type === 'json') {
    try {
      value = typeof value === 'string' ? JSON.parse(value) : value;
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

  // Проверяем существование настройки
  const { data: existing, error: checkError } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_type')
    .eq('setting_key', key)
    .single();

  if (checkError || !existing) {
    throw new AppError('Настройка не найдена', 404);
  }

  const settingType = type || existing.setting_type;

  // Преобразуем значение в строку для хранения (если нужно, Supabase может принять JSON)
  let stringValue: any = value;
  if (settingType === 'boolean') {
    stringValue = value ? 'true' : 'false';
  } else if (settingType === 'number') {
    stringValue = String(value);
  } else if (settingType === 'json' && typeof value === 'object') {
    stringValue = JSON.stringify(value);
  }

  // Обновляем настройку
  const { data: row, error: updateError } = await supabase
    .from('admin_settings')
    .update({
      setting_value: stringValue,
      setting_type: settingType,
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', key)
    .select('setting_key, setting_value, setting_type, description, updated_at')
    .single();

  if (updateError || !row) throw updateError;

  let parsedValue: any = row.setting_value;

  // Преобразуем значение обратно
  if (row.setting_type === 'boolean') {
    parsedValue = parsedValue === 'true' || parsedValue === true;
  } else if (row.setting_type === 'number') {
    parsedValue = parseFloat(parsedValue) || 0;
  } else if (row.setting_type === 'json') {
    try {
      parsedValue = typeof parsedValue === 'string' ? JSON.parse(parsedValue) : parsedValue;
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
    // Получаем тип настройки
    const { data: existing } = await supabase
      .from('admin_settings')
      .select('setting_type')
      .eq('setting_key', key)
      .maybeSingle();

    if (!existing) continue;

    const settingType = existing.setting_type;

    let stringValue: any = value;
    if (settingType === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else if (settingType === 'number') {
      stringValue = String(value);
    } else if (settingType === 'json' && typeof value === 'object') {
      stringValue = JSON.stringify(value);
    }

    const { data: row, error } = await supabase
      .from('admin_settings')
      .update({
        setting_value: stringValue,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', key)
      .select('setting_key, setting_value, setting_type, description, updated_at')
      .single();

    if (error || !row) continue;

    let parsedValue: any = row.setting_value;

    if (row.setting_type === 'boolean') {
      parsedValue = parsedValue === 'true' || parsedValue === true;
    } else if (row.setting_type === 'number') {
      parsedValue = parseFloat(parsedValue) || 0;
    } else if (row.setting_type === 'json') {
      try {
        parsedValue = typeof parsedValue === 'string' ? JSON.parse(parsedValue) : parsedValue;
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

