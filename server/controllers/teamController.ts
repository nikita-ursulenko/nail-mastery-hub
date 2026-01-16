import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';
import { getTeamImageUrl } from '../middleware/upload';

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
    const { data: members, error } = await supabase
      .from('team_members')
      .select('id, name, role, bio, image_url, image_upload_path, achievements, display_order, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении членов команды' });
    }

    res.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Ошибка при получении членов команды' });
  }
};

export const getAllTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('id, name, role, bio, image_url, image_upload_path, achievements, display_order, is_active, created_at, updated_at')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении членов команды' });
    }

    res.json(members);
  } catch (error) {
    console.error('Error fetching all team members:', error);
    res.status(500).json({ error: 'Ошибка при получении членов команды' });
  }
};

export const getTeamMemberById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data: member, error } = await supabase
      .from('team_members')
      .select('id, name, role, bio, image_url, image_upload_path, achievements, display_order, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !member) {
      if (error?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Член команды не найден' });
      }
      return res.status(500).json({ error: 'Ошибка при получении члена команды' });
    }

    res.json(member);
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

    const { data: member, error } = await supabase
      .from('team_members')
      .insert([
        {
          name,
          role,
          bio,
          image_url: image_url || null,
          image_upload_path: image_upload_path || null,
          achievements: achievements || [],
          display_order: display_order !== undefined ? display_order : 0,
          is_active: is_active !== undefined ? is_active : true,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при создании члена команды' });
    }

    res.status(201).json(member);
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
    }: TeamMember = req.body;

    if (!name || !role || !bio) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const { data: member, error } = await supabase
      .from('team_members')
      .update({
        name,
        role,
        bio,
        image_url: image_upload_path ? null : (image_url || null),
        image_upload_path: image_upload_path || null,
        achievements: achievements || [],
        display_order: display_order !== undefined ? display_order : 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !member) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Член команды не найден' });
    }

    res.json(member);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Ошибка при обновлении члена команды' });
  }
};

export const deleteTeamMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
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

