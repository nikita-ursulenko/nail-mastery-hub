import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { getAvatarUrl } from '../middleware/upload';

const pool = new Pool(getDatabaseConfig());

interface Testimonial {
  id?: number;
  name: string;
  role: string;
  avatar?: string;
  text: string;
  rating: number;
}

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, 
       COALESCE(avatar_upload_path, avatar) as avatar, 
       text, rating, created_at, updated_at 
       FROM testimonials ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
};

export const getTestimonialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, role, 
       COALESCE(avatar_upload_path, avatar) as avatar, 
       text, rating, created_at, updated_at 
       FROM testimonials WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении отзыва' });
  }
};

export const uploadAvatarFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const avatarUrl = getAvatarUrl(req.file.filename);

    res.json({
      url: avatarUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при загрузке файла' });
  }
};

export const createTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, avatar, avatarUploadPath, text, rating }: Testimonial & { avatarUploadPath?: string } = req.body;

    if (!name || !role || !text || !rating) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
    }

    // Используем загруженный файл, если есть, иначе URL
    const avatarPath = avatarUploadPath || null;
    const avatarUrl = avatar || null;

    const result = await pool.query(
      `INSERT INTO testimonials (name, role, avatar, avatar_upload_path, text, rating)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, role, 
       COALESCE(avatar_upload_path, avatar) as avatar, 
       text, rating, created_at, updated_at`,
      [name, role, avatarUrl, avatarPath, text, rating]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании отзыва' });
  }
};

export const updateTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, avatar, avatarUploadPath, text, rating }: Testimonial & { avatarUploadPath?: string } = req.body;

    if (!name || !role || !text || !rating) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
    }

    // Используем загруженный файл, если есть, иначе URL
    const avatarPath = avatarUploadPath || null;
    const avatarUrl = avatar || null;

    const result = await pool.query(
      `UPDATE testimonials
       SET name = $1, role = $2, avatar = $3, avatar_upload_path = $4, text = $5, rating = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, role, 
       COALESCE(avatar_upload_path, avatar) as avatar, 
       text, rating, created_at, updated_at`,
      [name, role, avatarUrl, avatarPath, text, rating, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении отзыва' });
  }
};

export const deleteTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM testimonials WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    res.json({ message: 'Отзыв успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении отзыва' });
  }
};

