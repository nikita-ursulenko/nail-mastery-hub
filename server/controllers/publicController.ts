import { Request, Response } from 'express';
import { supabase } from '../../database/config';

export const getPublicTestimonials = async (req: Request, res: Response) => {
  try {
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select('id, name, role, avatar_upload_path, avatar, text, rating')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении отзывов' });
    }

    // Transform avatar logic if needed, but Supabase usually returns what's stored.
    // The original SQL had: COALESCE(avatar_upload_path, avatar) as avatar
    // We can do this transformation in code or trust the client to handle it.
    // For now, let's keep it close to the original SQL intent by mapping.
    const transformedTestimonials = (testimonials || []).map(t => ({
      ...t,
      avatar: t.avatar_upload_path || t.avatar
    }));

    res.json(transformedTestimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
};

