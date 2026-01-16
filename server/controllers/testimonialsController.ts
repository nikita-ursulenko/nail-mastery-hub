import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import { getAvatarUrl } from '../middleware/upload';

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
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select('id, name, role, avatar, avatar_upload_path, text, rating, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении отзывов' });
    }

    const formattedTestimonials = (testimonials || []).map(t => ({
      ...t,
      avatar: t.avatar_upload_path || t.avatar
    }));

    res.json(formattedTestimonials);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
};

export const getTestimonialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .select('id, name, role, avatar, avatar_upload_path, text, rating, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !testimonial) {
      if (error?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Отзыв не найден' });
      }
      return res.status(500).json({ error: 'Ошибка при получении отзыва' });
    }

    res.json({
      ...testimonial,
      avatar: testimonial.avatar_upload_path || testimonial.avatar
    });
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

    const { data: newTestimonial, error } = await supabase
      .from('testimonials')
      .insert([
        {
          name,
          role,
          avatar: avatar || null,
          avatar_upload_path: avatarUploadPath || null,
          text,
          rating
        }
      ])
      .select('id, name, role, avatar, avatar_upload_path, text, rating, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при создании отзыва' });
    }

    res.status(201).json({
      ...newTestimonial,
      avatar: newTestimonial.avatar_upload_path || newTestimonial.avatar
    });
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

    const { data: updatedTestimonial, error } = await supabase
      .from('testimonials')
      .update({
        name,
        role,
        avatar: avatar || null,
        avatar_upload_path: avatarUploadPath || null,
        text,
        rating,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, role, avatar, avatar_upload_path, text, rating, created_at, updated_at')
      .single();

    if (error || !updatedTestimonial) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    res.json({
      ...updatedTestimonial,
      avatar: updatedTestimonial.avatar_upload_path || updatedTestimonial.avatar
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении отзыва' });
  }
};

export const deleteTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    res.json({ message: 'Отзыв успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении отзыва' });
  }
};

