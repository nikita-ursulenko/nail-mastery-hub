import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { getTeamImageUrl } from '../middleware/upload';

const pool = new Pool(getDatabaseConfig());

interface TeamMember {
  id?: number;
  name: string;
  role: string;
  bio: string;
  image_url?: string | null;
  image_upload_path?: string | null;
  achievements: string[];
  display_order: number;
  is_active: boolean;
}

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, bio, image_url, image_upload_path, achievements, 
              display_order, is_active, created_at, updated_at
       FROM team_members 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC, created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Ошибка при получении членов команды' });
  }
};

export const getAllTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, bio, image_url, image_upload_path, achievements, 
              display_order, is_active, created_at, updated_at
       FROM team_members 
       ORDER BY display_order ASC, created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all team members:', error);
    res.status(500).json({ error: 'Ошибка при получении членов команды' });
  }
};

export const getTeamMemberById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, role, bio, image_url, image_upload_path, achievements, 
              display_order, is_active, created_at, updated_at
       FROM team_members 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Член команды не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching team member by id:', error);
    res.status(500).json({ error: 'Ошибка при получении члена команды' });
  }
};

export const createTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      role,
      bio,
      image_url,
      image_upload_path,
      achievements,
      display_order,
      is_active,
    }: TeamMember = req.body;

    if (!name || !role || !bio) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const result = await pool.query(
      `INSERT INTO team_members 
       (name, role, bio, image_url, image_upload_path, achievements, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, role, bio, image_url, image_upload_path, achievements, 
                 display_order, is_active, created_at, updated_at`,
      [
        name,
        role,
        bio,
        image_url || null,
        image_upload_path || null,
        achievements || [],
        display_order !== undefined ? display_order : 0,
        is_active !== undefined ? is_active : true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Ошибка при создании члена команды' });
  }
};

export const updateTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      bio,
      image_url,
      image_upload_path,
      achievements,
      display_order,
      is_active,
    }: TeamMember & { image_upload_path?: string | null } = req.body;

    if (!name || !role || !bio) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Используем загруженный файл, если есть, иначе URL
    const finalImageUrl = image_upload_path ? null : (image_url || null);
    const finalImageUploadPath = image_upload_path || null;

    const result = await pool.query(
      `UPDATE team_members
       SET name = $1, role = $2, bio = $3, image_url = $4, image_upload_path = $5,
           achievements = $6, display_order = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, name, role, bio, image_url, image_upload_path, achievements, 
                 display_order, is_active, created_at, updated_at`,
      [
        name,
        role,
        bio,
        finalImageUrl,
        finalImageUploadPath,
        achievements || [],
        display_order !== undefined ? display_order : 0,
        is_active !== undefined ? is_active : true,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Член команды не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Ошибка при обновлении члена команды' });
  }
};

export const deleteTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM team_members WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Член команды не найден' });
    }

    res.json({ message: 'Член команды успешно удален' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Ошибка при удалении члена команды' });
  }
};

export const uploadTeamImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const filename = req.file.filename;
    const imageUrl = getTeamImageUrl(filename);

    res.json({
      filename,
      url: imageUrl,
      message: 'Изображение успешно загружено',
    });
  } catch (error) {
    console.error('Error uploading team image:', error);
    res.status(500).json({ error: 'Ошибка при загрузке изображения' });
  }
};

