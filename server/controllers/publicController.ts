import { Request, Response } from 'express';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const pool = new Pool(getDatabaseConfig());

export const getPublicTestimonials = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, 
       COALESCE(avatar_upload_path, avatar) as avatar, 
       text, rating 
       FROM testimonials ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
};

