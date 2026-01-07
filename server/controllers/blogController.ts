import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabaseConfig } from '../../database/config';
import { Pool } from 'pg';
import { getBlogImageUrl, getAvatarUrl } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';

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
             author, author_id, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
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
    
    // Получаем все author_id для загрузки данных из команды
    const authorIds = result.rows
      .filter((post: any) => post.author_id)
      .map((post: any) => post.author_id);
    
    let teamMembersMap: { [key: number]: any } = {};
    if (authorIds.length > 0) {
      const teamMembersResult = await pool.query(
        `SELECT id, name, image_url, image_upload_path, bio 
         FROM team_members 
         WHERE id = ANY($1) AND is_active = TRUE`,
        [authorIds]
      );
      teamMembersResult.rows.forEach((member: any) => {
        teamMembersMap[member.id] = member;
      });
    }
    
    // Формируем правильные URL для аватаров
    const posts = result.rows.map((post: any) => {
      // Если есть author_id, берем аватар из команды
      if (post.author_id && teamMembersMap[post.author_id]) {
        const teamMember = teamMembersMap[post.author_id];
        if (teamMember.image_upload_path) {
          post.author_avatar = `/uploads/team/${teamMember.image_upload_path}`;
        } else if (teamMember.image_url) {
          post.author_avatar = teamMember.image_url;
        }
        // Также обновляем имя и био из команды (на случай если они изменились)
        post.author = teamMember.name;
        post.author_bio = teamMember.bio;
      } else if (post.author_avatar_upload_path) {
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
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Ошибка при получении статей блога', 500);
  }
};

export const getAllBlogPosts = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, content, image_url, image_upload_path, 
             author, author_id, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
             tags, featured, is_active, created_at, updated_at
       FROM blog_posts
       ORDER BY date DESC, created_at DESC`
    );

    // Получаем все author_id для загрузки данных из команды
    const authorIds = result.rows
      .filter((post: any) => post.author_id)
      .map((post: any) => post.author_id);
    
    let teamMembersMap: { [key: number]: any } = {};
    if (authorIds.length > 0) {
      const teamMembersResult = await pool.query(
        `SELECT id, name, image_url, image_upload_path, bio 
         FROM team_members 
         WHERE id = ANY($1) AND is_active = TRUE`,
        [authorIds]
      );
      teamMembersResult.rows.forEach((member: any) => {
        teamMembersMap[member.id] = member;
      });
    }
    
    // Формируем правильные URL для аватаров
    const posts = result.rows.map((post: any) => {
      // Если есть author_id, берем аватар из команды
      if (post.author_id && teamMembersMap[post.author_id]) {
        const teamMember = teamMembersMap[post.author_id];
        if (teamMember.image_upload_path) {
          post.author_avatar = `/uploads/team/${teamMember.image_upload_path}`;
        } else if (teamMember.image_url) {
          post.author_avatar = teamMember.image_url;
        }
        // Также обновляем имя и био из команды
        post.author = teamMember.name;
        post.author_bio = teamMember.bio;
      } else if (post.author_avatar_upload_path) {
        post.author_avatar = `/uploads/avatars/${post.author_avatar_upload_path}`;
      }
      return post;
    });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    res.status(500).json({ error: 'Ошибка при получении статей блога' });
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, content, image_url, image_upload_path, 
              author, author_id, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
              tags, featured, is_active, created_at, updated_at
       FROM blog_posts 
       WHERE slug = $1 AND is_active = TRUE`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    const post = result.rows[0];
    
    // Если есть author_id, берем аватар из команды
    if (post.author_id) {
      const teamMemberResult = await pool.query(
        `SELECT name, image_url, image_upload_path, bio 
         FROM team_members 
         WHERE id = $1 AND is_active = TRUE`,
        [post.author_id]
      );
      
      if (teamMemberResult.rows.length > 0) {
        const teamMember = teamMemberResult.rows[0];
        if (teamMember.image_upload_path) {
          post.author_avatar = `/uploads/team/${teamMember.image_upload_path}`;
        } else if (teamMember.image_url) {
          post.author_avatar = teamMember.image_url;
        }
        // Обновляем имя и био из команды
        post.author = teamMember.name;
        post.author_bio = teamMember.bio;
      }
    } else if (post.author_avatar_upload_path) {
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
              author, author_id, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
              tags, featured, is_active, created_at, updated_at
       FROM blog_posts 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    const post = result.rows[0];
    
    // Если есть author_id, берем аватар из команды
    if (post.author_id) {
      const teamMemberResult = await pool.query(
        `SELECT name, image_url, image_upload_path, bio 
         FROM team_members 
         WHERE id = $1 AND is_active = TRUE`,
        [post.author_id]
      );
      
      if (teamMemberResult.rows.length > 0) {
        const teamMember = teamMemberResult.rows[0];
        if (teamMember.image_upload_path) {
          post.author_avatar = `/uploads/team/${teamMember.image_upload_path}`;
        } else if (teamMember.image_url) {
          post.author_avatar = teamMember.image_url;
        }
        // Обновляем имя и био из команды
        post.author = teamMember.name;
        post.author_bio = teamMember.bio;
      }
    } else if (post.author_avatar_upload_path) {
      post.author_avatar = `/uploads/avatars/${post.author_avatar_upload_path}`;
    }

    res.json(post);
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
      author_id,
      author_avatar,
      author_avatar_upload_path,
      author_bio,
      date,
      read_time,
      category,
      tags,
      featured,
      is_active,
    }: BlogPost & { author_id?: number | null } = req.body;

    if (!slug || !title || !excerpt || !content || (!author && !author_id) || !date || !category) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Если выбран author_id, берем данные из команды
    let finalAuthor = author;
    let finalAuthorAvatar = author_avatar;
    let finalAuthorAvatarUploadPath = author_avatar_upload_path;
    let finalAuthorBio = author_bio;

    if (author_id) {
      const teamMemberResult = await pool.query(
        'SELECT name, image_url, image_upload_path, bio FROM team_members WHERE id = $1 AND is_active = TRUE',
        [author_id]
      );
      
      if (teamMemberResult.rows.length > 0) {
        const teamMember = teamMemberResult.rows[0];
        finalAuthor = teamMember.name;
        finalAuthorAvatar = teamMember.image_url || null;
        finalAuthorAvatarUploadPath = teamMember.image_upload_path || null;
        finalAuthorBio = teamMember.bio || null;
      }
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
       (slug, title, excerpt, content, image_url, image_upload_path, author, author_id,
        author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, tags, featured, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id, slug, title, excerpt, content, image_url, image_upload_path, 
                 author, author_id, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
                 tags, featured, is_active, created_at, updated_at`,
      [
        slug,
        title,
        excerpt,
        content,
        image_url || null,
        image_upload_path || null,
        finalAuthor || null,
        author_id || null,
        finalAuthorAvatar || null,
        finalAuthorAvatarUploadPath || null,
        finalAuthorBio || null,
        date,
        read_time || '5 мин',
        category,
        tags || [],
        featured !== undefined ? featured : false,
        is_active !== undefined ? is_active : true,
      ]
    );

    const newPost = result.rows[0];

    // Автоматически создаем SEO настройки для статьи
    try {
      const seoPath = `/blog/${slug}`;
      const imageUrl = image_upload_path
        ? `/uploads/blog/${image_upload_path}`
        : image_url || 'https://lovable.dev/opengraph-image-p98pqg.png';

      await pool.query(
        `INSERT INTO seo_settings (
          path, title, description, keywords, og_title, og_description,
          og_image, og_type, twitter_card, twitter_title, twitter_description,
          twitter_image, robots
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (path) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          keywords = EXCLUDED.keywords,
          og_title = EXCLUDED.og_title,
          og_description = EXCLUDED.og_description,
          og_image = EXCLUDED.og_image,
          twitter_title = EXCLUDED.twitter_title,
          twitter_description = EXCLUDED.twitter_description,
          twitter_image = EXCLUDED.twitter_image,
          updated_at = CURRENT_TIMESTAMP`,
        [
          seoPath,
          `${title} | NailArt Academy`,
          excerpt || title,
          tags && tags.length > 0 ? tags.join(', ') : category,
          title,
          excerpt || title,
          imageUrl,
          'article',
          'summary_large_image',
          title,
          excerpt || title,
          imageUrl,
          'index, follow',
        ]
      );
    } catch (seoError) {
      // Не прерываем создание статьи, если SEO не создалось
      console.error('Error creating SEO for blog post:', seoError);
    }

    res.status(201).json(newPost);
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
      author_id,
      author_avatar,
      author_avatar_upload_path,
      author_bio,
      date,
      read_time,
      category,
      tags,
      featured,
      is_active,
    }: BlogPost & { author_id?: number | null } = req.body;

    if (!slug || !title || !excerpt || !content || (!author && !author_id) || !date || !category) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Если выбран author_id, берем данные из команды
    let finalAuthor = author;
    let finalAuthorAvatar = author_avatar;
    let finalAuthorAvatarUploadPath = author_avatar_upload_path;
    let finalAuthorBio = author_bio;

    if (author_id) {
      const teamMemberResult = await pool.query(
        'SELECT name, image_url, image_upload_path, bio FROM team_members WHERE id = $1 AND is_active = TRUE',
        [author_id]
      );
      
      if (teamMemberResult.rows.length > 0) {
        const teamMember = teamMemberResult.rows[0];
        finalAuthor = teamMember.name;
        finalAuthorAvatar = teamMember.image_url || null;
        finalAuthorAvatarUploadPath = teamMember.image_upload_path || null;
        finalAuthorBio = teamMember.bio || null;
      }
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
           image_upload_path = $6, author = $7, author_id = $8, author_avatar = $9, author_avatar_upload_path = $10, 
           author_bio = $11, date = $12, read_time = $13, category = $14, tags = $15, 
           featured = $16, is_active = $17, updated_at = CURRENT_TIMESTAMP
       WHERE id = $18
       RETURNING id, slug, title, excerpt, content, image_url, image_upload_path, 
                 author, author_id, author_avatar, author_avatar_upload_path, author_bio, date, read_time, category, 
                 tags, featured, is_active, created_at, updated_at`,
      [
        slug,
        title,
        excerpt,
        content,
        image_url || null,
        image_upload_path || null,
        finalAuthor || null,
        author_id || null,
        finalAuthorAvatar || null,
        finalAuthorAvatarUploadPath || null,
        finalAuthorBio || null,
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

    const updatedPost = result.rows[0];

    // Автоматически обновляем SEO настройки для статьи
    try {
      const seoPath = `/blog/${slug}`;
      const imageUrl = image_upload_path
        ? `/uploads/blog/${image_upload_path}`
        : image_url || 'https://lovable.dev/opengraph-image-p98pqg.png';

      await pool.query(
        `INSERT INTO seo_settings (
          path, title, description, keywords, og_title, og_description,
          og_image, og_type, twitter_card, twitter_title, twitter_description,
          twitter_image, robots
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (path) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          keywords = EXCLUDED.keywords,
          og_title = EXCLUDED.og_title,
          og_description = EXCLUDED.og_description,
          og_image = EXCLUDED.og_image,
          twitter_title = EXCLUDED.twitter_title,
          twitter_description = EXCLUDED.twitter_description,
          twitter_image = EXCLUDED.twitter_image,
          updated_at = CURRENT_TIMESTAMP`,
        [
          seoPath,
          `${title} | NailArt Academy`,
          excerpt || title,
          tags && tags.length > 0 ? tags.join(', ') : category,
          title,
          excerpt || title,
          imageUrl,
          'article',
          'summary_large_image',
          title,
          excerpt || title,
          imageUrl,
          'index, follow',
        ]
      );
    } catch (seoError) {
      // Не прерываем обновление статьи, если SEO не обновилось
      console.error('Error updating SEO for blog post:', seoError);
    }

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статьи' });
  }
};

export const deleteBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Сначала получаем slug для удаления SEO
    const postResult = await pool.query(
      'SELECT slug FROM blog_posts WHERE id = $1',
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Статья не найдена' });
    }

    const slug = postResult.rows[0].slug;

    // Удаляем статью
    const result = await pool.query(
      'DELETE FROM blog_posts WHERE id = $1 RETURNING id',
      [id]
    );

    // Удаляем SEO настройки для этой статьи (опционально, можно оставить)
    try {
      await pool.query(
        'DELETE FROM seo_settings WHERE path = $1',
        [`/blog/${slug}`]
      );
    } catch (seoError) {
      // Не прерываем удаление статьи, если SEO не удалилось
      console.error('Error deleting SEO for blog post:', seoError);
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

