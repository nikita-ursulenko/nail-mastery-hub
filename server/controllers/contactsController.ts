import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';

const pool = new Pool(getDatabaseConfig());

interface Contact {
  id?: number;
  type: string;
  title: string;
  content: string;
  href?: string | null;
  subtitle?: string | null;
  icon: string;
  display_order?: number;
  is_active?: boolean;
}

export const getContacts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, type, title, content, href, subtitle, icon, display_order, is_active, created_at, updated_at 
       FROM contacts 
       WHERE is_active = true 
       ORDER BY display_order ASC, created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении контактов' });
  }
};

export const getAllContacts = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, type, title, content, href, subtitle, icon, display_order, is_active, created_at, updated_at 
       FROM contacts 
       ORDER BY display_order ASC, created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении контактов' });
  }
};

export const getContactById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Контакт не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении контакта' });
  }
};

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, content, href, subtitle, icon, display_order, is_active }: Contact = req.body;

    if (!type || !title || !content || !icon) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const result = await pool.query(
      `INSERT INTO contacts (type, title, content, href, subtitle, icon, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [type, title, content, href || null, subtitle || null, icon, display_order || 0, is_active !== undefined ? is_active : true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании контакта' });
  }
};

export const updateContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, title, content, href, subtitle, icon, display_order, is_active }: Contact = req.body;

    if (!type || !title || !content || !icon) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const result = await pool.query(
      `UPDATE contacts
       SET type = $1, title = $2, content = $3, href = $4, subtitle = $5, icon = $6, 
           display_order = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [type, title, content, href || null, subtitle || null, icon, display_order || 0, is_active !== undefined ? is_active : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Контакт не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении контакта' });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM contacts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Контакт не найден' });
    }

    res.json({ message: 'Контакт успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении контакта' });
  }
};

