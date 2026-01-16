import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../../database/config';

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
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, type, title, content, href, subtitle, icon, display_order, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении контактов' });
    }

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Ошибка при получении контактов' });
  }
};

export const getAllContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, type, title, content, href, subtitle, icon, display_order, is_active, created_at, updated_at')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при получении контактов' });
    }

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching all contacts:', error);
    res.status(500).json({ error: 'Ошибка при получении контактов' });
  }
};

export const getContactById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contact) {
      if (error?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Контакт не найден' });
      }
      return res.status(500).json({ error: 'Ошибка при получении контакта' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact by id:', error);
    res.status(500).json({ error: 'Ошибка при получении контакта' });
  }
};

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, content, href, subtitle, icon, display_order, is_active }: Contact = req.body;

    if (!type || !title || !content || !icon) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([
        {
          type,
          title,
          content,
          href: href || null,
          subtitle: subtitle || null,
          icon,
          display_order: display_order || 0,
          is_active: is_active !== undefined ? is_active : true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Ошибка при создании контакта' });
    }

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
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

    const { data: contact, error } = await supabase
      .from('contacts')
      .update({
        type,
        title,
        content,
        href: href || null,
        subtitle: subtitle || null,
        icon,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !contact) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Контакт не найден' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Ошибка при обновлении контакта' });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Контакт не найден' });
    }

    res.json({ message: 'Контакт успешно удален' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Ошибка при удалении контакта' });
  }
};

