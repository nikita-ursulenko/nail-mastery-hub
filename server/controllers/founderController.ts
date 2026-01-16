import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import { getFounderImageUrl } from '../middleware/upload';

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
    const { data: founder, error } = await supabase
      .from('founder_info')
      .select('id, name, greeting, role, image_url, image_upload_path, experience_years, experience_label, achievements, button_text, button_link, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
    }

    res.json(founder);
  } catch (error) {
    console.error('Error fetching founder info:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
  }
};

export const getAllFounderInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { data: founderList, error } = await supabase
      .from('founder_info')
      .select('id, name, greeting, role, image_url, image_upload_path, experience_years, experience_label, achievements, button_text, button_link, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
    }

    res.json(founderList);
  } catch (error) {
    console.error('Error fetching all founder info:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
  }
};

export const getFounderInfoById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data: founder, error } = await supabase
      .from('founder_info')
      .select('id, name, greeting, role, image_url, image_upload_path, experience_years, experience_label, achievements, button_text, button_link, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !founder) {
      if (error?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Информация об основателе не найдена' });
      }
      return res.status(500).json({ error: 'Ошибка при получении информации об основателе' });
    }

    res.json(founder);
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

    const { data: founder, error } = await supabase
      .from('founder_info')
      .insert([
        {
          name,
          greeting: greeting || 'Привет! Я',
          role,
          image_url: image_url || null,
          image_upload_path: image_upload_path || null,
          experience_years,
          experience_label: experience_label || 'лет опыта работы',
          achievements: achievements || [],
          button_text: button_text || 'Узнать больше',
          button_link: button_link || null,
          is_active: is_active !== undefined ? is_active : true,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при создании информации об основателе' });
    }

    res.status(201).json(founder);
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
    }: FounderInfo = req.body;

    if (!name || !role || experience_years === undefined) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const { data: founder, error } = await supabase
      .from('founder_info')
      .update({
        name,
        greeting: greeting || 'Привет! Я',
        role,
        image_url: image_upload_path ? null : (image_url || null),
        image_upload_path: image_upload_path || null,
        experience_years,
        experience_label: experience_label || 'лет опыта работы',
        achievements: achievements || [],
        button_text: button_text || 'Узнать больше',
        button_link: button_link || null,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !founder) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Информация об основателе не найдена' });
    }

    res.json(founder);
  } catch (error) {
    console.error('Error updating founder info:', error);
    res.status(500).json({ error: 'Ошибка при обновлении информации об основателе' });
  }
};

export const deleteFounderInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('founder_info')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
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

