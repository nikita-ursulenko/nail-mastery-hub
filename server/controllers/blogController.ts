import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { getBlogImageUrl, getAvatarUrl } from '../middleware/upload';

const pool = new Pool(getDatabaseConfig());

interface BlogPost {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // JSON string или plain text
  image_url?: string | null;
  image_upload_path?: string | null;
  author: string;
  author_avatar?: string | null;
  author_avatar_upload_path?: string | null;
  author_bio?: string | null;
  date: string;
  read_time: string;
  category: string;
  tags: string[];
  featured: boolean;
  is_active: boolean;
}

export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const { category, featured, search, limit, offset } = req.query;
    
    const pageLimit = limit ? parseInt(limit as string) : 9;
    const pageOffset = offset ? parseInt(offset as string) : 0;
    
    let query = `
      SELECT id, slug, title, excerpt, content, image_url, image_upload_path, 
             author, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
             tags, featured, is_active, created_at, updated_at
      FROM blog_posts 
      WHERE is_active = TRUE
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (featured === 'true') {
      query += ` AND featured = TRUE`;
    }

    if (search) {
      query += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(excerpt) LIKE $${paramIndex} OR LOWER(author) LIKE $${paramIndex})`;
      params.push(`%${(search as string).toLowerCase()}%`);
      paramIndex++;
    }

    // Получаем общее количество для пагинации (до ORDER BY и LIMIT)
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Добавляем ORDER BY, LIMIT и OFFSET
    query += ` ORDER BY date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageLimit, pageOffset);

    const result = await pool.query(query, params);
    // Формируем правильные URL для аватаров
    const posts = result.rows.map((post: any) => {
      if (post.author_avatar_upload_path) {
        post.author_avatar = `/uploads/avatars/${post.author_avatar_upload_path}`;
      }
      return post;
    });
    
    res.json({
      posts,
      total,
      hasMore: pageOffset + posts.length < total,
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Ошибка при получении статей блога' });
  }
};

export const getAllBlogPosts = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, content, image_url, image_upload_path, 
              author, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
              tags, featured, is_active, created_at, updated_at
       FROM blog_posts 
       ORDER BY date DESC, created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    res.status(500).json({ error: 'Ошибка при получении статей блога' });
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, content, COALESCE(image_upload_path, image_url) as image_url, 
              author, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
              tags, featured, is_active, created_at, updated_at
       FROM blog_posts 
       WHERE slug = $1 AND is_active = TRUE`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    const post = result.rows[0];
    // Формируем правильный URL для аватара
    if (post.author_avatar_upload_path) {
      post.author_avatar = `/uploads/avatars/${post.author_avatar_upload_path}`;
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    res.status(500).json({ error: 'Ошибка при получении статьи' });
  }
};

export const getBlogPostById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, content, image_url, image_upload_path, 
              author, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
              tags, featured, is_active, created_at, updated_at
       FROM blog_posts 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog post by id:', error);
    res.status(500).json({ error: 'Ошибка при получении статьи' });
  }
};

export const createBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const {
      slug,
      title,
      excerpt,
      content,
      image_url,
      image_upload_path,
      author,
      author_avatar,
      author_avatar_upload_path,
      author_bio,
      date,
      read_time,
      category,
      tags,
      featured,
      is_active,
    }: BlogPost = req.body;

    if (!slug || !title || !excerpt || !content || !author || !date || !category) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Проверяем уникальность slug
    const existingPost = await pool.query(
      'SELECT id FROM blog_posts WHERE slug = $1',
      [slug]
    );
    if (existingPost.rows.length > 0) {
      return res.status(400).json({ error: 'Статья с таким slug уже существует' });
    }

    const result = await pool.query(
      `INSERT INTO blog_posts 
       (slug, title, excerpt, content, image_url, image_upload_path, author, 
        author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, tags, featured, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id, slug, title, excerpt, content, image_url, image_upload_path, 
                 author, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
                 tags, featured, is_active, created_at, updated_at`,
      [
        slug,
        title,
        excerpt,
        content,
        image_url || null,
        image_upload_path || null,
        author,
        author_avatar || null,
        author_avatar_upload_path || null,
        author_bio || null,
        date,
        read_time || '5 мин',
        category,
        tags || [],
        featured !== undefined ? featured : false,
        is_active !== undefined ? is_active : true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Ошибка при создании статьи' });
  }
};

export const updateBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      excerpt,
      content,
      image_url,
      image_upload_path,
      author,
      author_avatar,
      author_avatar_upload_path,
      author_bio,
      date,
      read_time,
      category,
      tags,
      featured,
      is_active,
    }: BlogPost = req.body;

    if (!slug || !title || !excerpt || !content || !author || !date || !category) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Проверяем уникальность slug (исключая текущую статью)
    const existingPost = await pool.query(
      'SELECT id FROM blog_posts WHERE slug = $1 AND id != $2',
      [slug, id]
    );
    if (existingPost.rows.length > 0) {
      return res.status(400).json({ error: 'Статья с таким slug уже существует' });
    }

    const result = await pool.query(
      `UPDATE blog_posts
       SET slug = $1, title = $2, excerpt = $3, content = $4, image_url = $5, 
           image_upload_path = $6, author = $7, author_avatar = $8, author_avatar_upload_path = $9, 
           author_bio = $10, date = $11, read_time = $12, category = $13, tags = $14, 
           featured = $15, is_active = $16, updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING id, slug, title, excerpt, content, image_url, image_upload_path, 
                 author, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
                 tags, featured, is_active, created_at, updated_at`,
      [
        slug,
        title,
        excerpt,
        content,
        image_url || null,
        image_upload_path || null,
        author,
        author_avatar || null,
        author_avatar_upload_path || null,
        author_bio || null,
        date,
        read_time || '5 мин',
        category,
        tags || [],
        featured !== undefined ? featured : false,
        is_active !== undefined ? is_active : true,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статьи' });
  }
};

export const deleteBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM blog_posts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    res.json({ message: 'Статья успешно удалена' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Ошибка при удалении статьи' });
  }
};

export const uploadBlogImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const filename = req.file.filename;
    const imageUrl = getBlogImageUrl(filename);

    res.json({
      filename,
      url: imageUrl,
      message: 'Изображение успешно загружено',
    });
  } catch (error) {
    console.error('Error uploading blog image:', error);
    res.status(500).json({ error: 'Ошибка при загрузке изображения' });
  }
};

export const uploadAuthorAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const filename = req.file.filename;
    const avatarUrl = getAvatarUrl(filename);

    res.json({
      filename,
      url: avatarUrl,
      message: 'Аватар автора успешно загружен',
    });
  } catch (error) {
    console.error('Error uploading author avatar:', error);
    res.status(500).json({ error: 'Ошибка при загрузке аватара автора' });
  }
};

