import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { getFounderImageUrl } from '../middleware/upload';

const pool = new Pool(getDatabaseConfig());

interface FounderInfo {
  id?: number;
  name: string;
  greeting: string;
  role: string;
  image_url?: string | null;
  image_upload_path?: string | null;
  experience_years: number;
  experience_label: string;
  achievements: string[];
  button_text: string;
  button_link?: string | null;
  is_active: boolean;
}

export const getFounderInfo = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, greeting, role, image_url, image_upload_path, experience_years, 
              experience_label, achievements, button_text, button_link, is_active, 
              created_at, updated_at
       FROM founder_info 
       WHERE is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching founder info:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
  }
};

export const getAllFounderInfo = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, greeting, role, image_url, image_upload_path, experience_years, 
              experience_label, achievements, button_text, button_link, is_active, 
              created_at, updated_at
       FROM founder_info 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all founder info:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
  }
};

export const getFounderInfoById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, greeting, role, image_url, image_upload_path, experience_years, 
              experience_label, achievements, button_text, button_link, is_active, 
              created_at, updated_at
       FROM founder_info 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Информация об основателе не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching founder info by id:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
  }
};

export const createFounderInfo = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      greeting,
      role,
      image_url,
      image_upload_path,
      experience_years,
      experience_label,
      achievements,
      button_text,
      button_link,
      is_active,
    }: FounderInfo = req.body;

    if (!name || !role || experience_years === undefined) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const result = await pool.query(
      `INSERT INTO founder_info 
       (name, greeting, role, image_url, image_upload_path, experience_years, 
        experience_label, achievements, button_text, button_link, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, name, greeting, role, image_url, image_upload_path, experience_years, 
                 experience_label, achievements, button_text, button_link, is_active, 
                 created_at, updated_at`,
      [
        name,
        greeting || 'Привет! Я',
        role,
        image_url || null,
        image_upload_path || null,
        experience_years,
        experience_label || 'лет опыта работы',
        achievements || [],
        button_text || 'Узнать больше',
        button_link || null,
        is_active !== undefined ? is_active : true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating founder info:', error);
    res.status(500).json({ error: 'Ошибка при создании информации об основателе' });
  }
};

export const updateFounderInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      greeting,
      role,
      image_url,
      image_upload_path,
      experience_years,
      experience_label,
      achievements,
      button_text,
      button_link,
      is_active,
    }: FounderInfo & { image_upload_path?: string | null } = req.body;

    if (!name || !role || experience_years === undefined) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Используем загруженный файл, если есть, иначе URL
    const finalImageUrl = image_upload_path ? null : (image_url || null);
    const finalImageUploadPath = image_upload_path || null;

    const result = await pool.query(
      `UPDATE founder_info
       SET name = $1, greeting = $2, role = $3, image_url = $4, image_upload_path = $5,
           experience_years = $6, experience_label = $7, achievements = $8,
           button_text = $9, button_link = $10, is_active = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING id, name, greeting, role, image_url, image_upload_path, experience_years, 
                 experience_label, achievements, button_text, button_link, is_active, 
                 created_at, updated_at`,
      [
        name,
        greeting || 'Привет! Я',
        role,
        finalImageUrl,
        finalImageUploadPath,
        experience_years,
        experience_label || 'лет опыта работы',
        achievements || [],
        button_text || 'Узнать больше',
        button_link || null,
        is_active !== undefined ? is_active : true,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Информация об основателе не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating founder info:', error);
    res.status(500).json({ error: 'Ошибка при обновлении информации об основателе' });
  }
};

export const deleteFounderInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM founder_info WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Информация об основателе не найдена' });
    }

    res.json({ message: 'Информация об основателе успешно удалена' });
  } catch (error) {
    console.error('Error deleting founder info:', error);
    res.status(500).json({ error: 'Ошибка при удалении информации об основателе' });
  }
};

export const uploadFounderImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const filename = req.file.filename;
    const imageUrl = getFounderImageUrl(filename);

    res.json({
      filename,
      url: imageUrl,
      message: 'Изображение успешно загружено',
    });
  } catch (error) {
    console.error('Error uploading founder image:', error);
    res.status(500).json({ error: 'Ошибка при загрузке изображения' });
  }
};

