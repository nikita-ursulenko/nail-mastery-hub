import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';

interface BlogPost {
  id: number;
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
  created_at?: string;
  updated_at?: string;
}

const categories = [
  'Тренды',
  'Обучение',
  'Дизайн',
  'Уход',
  'Инструменты',
  'Бизнес',
];

export default function AdminBlog() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    image_upload_path: '',
    author: '',
    author_avatar: '',
    author_avatar_upload_path: '',
    author_bio: '',
    date: new Date().toISOString().split('T')[0],
    read_time: '5 мин',
    category: 'Тренды',
    tags: [] as string[],
    tagInput: '',
    featured: false,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [useUpload, setUseUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [authorAvatarFile, setAuthorAvatarFile] = useState<File | null>(null);
  const [authorAvatarPreview, setAuthorAvatarPreview] = useState<string>('');
  const [useAuthorAvatarUpload, setUseAuthorAvatarUpload] = useState(false);
  const [isUploadingAuthorAvatar, setIsUploadingAuthorAvatar] = useState(false);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      const data = await api.getBlogPosts();
      setBlogPosts(data);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      const isUploaded = post.image_upload_path;
      // Парсим content если это JSON
      let contentText = post.content;
      try {
        const parsed = JSON.parse(post.content);
        if (Array.isArray(parsed)) {
          contentText = parsed.join('\n\n');
        }
      } catch (e) {
        // Если не JSON, оставляем как есть
      }

      const isAuthorAvatarUploaded = post.author_avatar_upload_path;
      setFormData({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: contentText,
        image_url: isUploaded ? '' : (post.image_url || ''),
        image_upload_path: post.image_upload_path || '',
        author: post.author,
        author_avatar: isAuthorAvatarUploaded ? '' : (post.author_avatar || ''),
        author_avatar_upload_path: post.author_avatar_upload_path || '',
        author_bio: post.author_bio || '',
        date: post.date.split('T')[0],
        read_time: post.read_time,
        category: post.category,
        tags: post.tags || [],
        tagInput: '',
        featured: post.featured,
        is_active: post.is_active,
      });
      if (isUploaded) {
        setImagePreview(`/uploads/blog/${post.image_upload_path}`);
        setUseUpload(true);
      } else if (post.image_url) {
        setImagePreview(post.image_url);
        setUseUpload(false);
      } else {
        setImagePreview('');
        setUseUpload(false);
      }
      if (isAuthorAvatarUploaded) {
        setAuthorAvatarPreview(`/uploads/avatars/${post.author_avatar_upload_path}`);
        setUseAuthorAvatarUpload(true);
      } else if (post.author_avatar) {
        setAuthorAvatarPreview(post.author_avatar);
        setUseAuthorAvatarUpload(false);
      } else {
        setAuthorAvatarPreview('');
        setUseAuthorAvatarUpload(false);
      }
    } else {
      setEditingPost(null);
      setFormData({
        slug: '',
        title: '',
        excerpt: '',
        content: '',
        image_url: '',
        image_upload_path: '',
        author: '',
        author_avatar: '',
        author_avatar_upload_path: '',
        author_bio: '',
        date: new Date().toISOString().split('T')[0],
        read_time: '5 мин',
        category: 'Тренды',
        tags: [],
        tagInput: '',
        featured: false,
        is_active: true,
      });
      setImagePreview('');
      setUseUpload(false);
      setAuthorAvatarPreview('');
      setUseAuthorAvatarUpload(false);
    }
    setImageFile(null);
    setAuthorAvatarFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setImageFile(null);
    setImagePreview('');
    setUseUpload(false);
    setAuthorAvatarFile(null);
    setAuthorAvatarPreview('');
    setUseAuthorAvatarUpload(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUseUpload(true);
    }
  };

  const handleRemoveFile = () => {
    setImageFile(null);
    setImagePreview('');
    setUseUpload(false);
    setFormData({ ...formData, image_upload_path: '', image_url: '' });
  };

  const handleAuthorAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAuthorAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthorAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUseAuthorAvatarUpload(true);
    }
  };

  const handleRemoveAuthorAvatarFile = () => {
    setAuthorAvatarFile(null);
    setAuthorAvatarPreview('');
    setUseAuthorAvatarUpload(false);
    setFormData({ ...formData, author_avatar_upload_path: '', author_avatar: '' });
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    // Автоматически генерируем slug если он пустой
    if (!formData.slug || formData.slug === generateSlug(formData.title)) {
      setFormData((prev) => ({ ...prev, title, slug: generateSlug(title) }));
    } else {
      setFormData((prev) => ({ ...prev, title }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Преобразуем content в JSON массив параграфов
      const contentParagraphs = formData.content
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      const contentJson = JSON.stringify(contentParagraphs);

      let submitData: any = {
        slug: formData.slug || generateSlug(formData.title),
        title: formData.title,
        excerpt: formData.excerpt,
        content: contentJson,
        author: formData.author,
        author_bio: formData.author_bio || null,
        date: formData.date,
        read_time: formData.read_time,
        category: formData.category,
        tags: formData.tags,
        featured: formData.featured,
        is_active: formData.is_active,
      };

      // Если загружен файл изображения, сначала загружаем его
      if (imageFile) {
        setIsUploading(true);
        try {
          const uploadResult = await api.uploadBlogImage(imageFile);
          submitData.image_upload_path = uploadResult.filename;
          submitData.image_url = null;
        } catch (uploadError: any) {
          alert(uploadError.message || 'Ошибка при загрузке файла');
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (!useUpload && formData.image_url) {
        submitData.image_url = formData.image_url;
        submitData.image_upload_path = null;
      } else if (formData.image_upload_path) {
        submitData.image_upload_path = formData.image_upload_path;
        submitData.image_url = null;
      } else {
        submitData.image_url = null;
        submitData.image_upload_path = null;
      }

      // Если загружен файл аватара автора, сначала загружаем его
      if (authorAvatarFile) {
        setIsUploadingAuthorAvatar(true);
        try {
          const uploadResult = await api.uploadAuthorAvatar(authorAvatarFile);
          submitData.author_avatar_upload_path = uploadResult.filename;
          submitData.author_avatar = null;
        } catch (uploadError: any) {
          alert(uploadError.message || 'Ошибка при загрузке аватара автора');
          setIsUploadingAuthorAvatar(false);
          return;
        } finally {
          setIsUploadingAuthorAvatar(false);
        }
      } else if (!useAuthorAvatarUpload && formData.author_avatar) {
        submitData.author_avatar = formData.author_avatar;
        submitData.author_avatar_upload_path = null;
      } else if (formData.author_avatar_upload_path) {
        submitData.author_avatar_upload_path = formData.author_avatar_upload_path;
        submitData.author_avatar = null;
      } else {
        submitData.author_avatar = null;
        submitData.author_avatar_upload_path = null;
      }

      if (editingPost) {
        await api.updateBlogPost(editingPost.id, submitData);
      } else {
        await api.createBlogPost(submitData);
      }
      loadBlogPosts();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save blog post:', error);
      alert(error.message || 'Ошибка при сохранении статьи.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      try {
        await api.deleteBlogPost(id);
        loadBlogPosts();
      } catch (error) {
        console.error('Failed to delete blog post:', error);
        alert('Ошибка при удалении статьи.');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Управление блогом</h1>
          <p className="text-muted-foreground">
            Добавляйте, редактируйте и удаляйте статьи блога
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить статью
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Редактировать статью' : 'Добавить статью'}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о статье
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Заголовок *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                      placeholder="Топ-10 трендов маникюра 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      placeholder="top-trends-2024"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Краткое описание *</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    required
                    rows={2}
                    placeholder="Краткое описание статьи..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Содержание * (каждый параграф с новой строки)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={10}
                    placeholder="Первый параграф статьи...&#10;&#10;Второй параграф статьи..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Изображение</Label>
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={!useUpload ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setUseUpload(false);
                          setImageFile(null);
                          setImagePreview(formData.image_url || '');
                          setFormData({ ...formData, image_upload_path: '' });
                        }}
                      >
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={useUpload ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setUseUpload(true);
                          setFormData({ ...formData, image_url: '' });
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Загрузить файл
                      </Button>
                    </div>

                    {!useUpload && (
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    )}

                    {useUpload && (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                    )}

                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 rounded-lg object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Автор *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      required
                      placeholder="Анна Петрова"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Аватар автора</Label>
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={!useAuthorAvatarUpload ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setUseAuthorAvatarUpload(false);
                            setAuthorAvatarFile(null);
                            setAuthorAvatarPreview(formData.author_avatar || '');
                            setFormData({ ...formData, author_avatar_upload_path: '' });
                          }}
                        >
                          URL
                        </Button>
                        <Button
                          type="button"
                          variant={useAuthorAvatarUpload ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setUseAuthorAvatarUpload(true);
                            setFormData({ ...formData, author_avatar: '' });
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Загрузить файл
                        </Button>
                      </div>

                      {!useAuthorAvatarUpload && (
                        <Input
                          id="author_avatar"
                          value={formData.author_avatar}
                          onChange={(e) => {
                            setFormData({ ...formData, author_avatar: e.target.value });
                            setAuthorAvatarPreview(e.target.value);
                          }}
                          placeholder="https://example.com/avatar.jpg"
                        />
                      )}

                      {useAuthorAvatarUpload && (
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleAuthorAvatarFileChange}
                          className="cursor-pointer"
                        />
                      )}

                      {authorAvatarPreview && (
                        <div className="relative inline-block">
                          <img
                            src={authorAvatarPreview}
                            alt="Avatar Preview"
                            className="h-20 w-20 rounded-full object-cover border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={handleRemoveAuthorAvatarFile}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Дата *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author_bio">Биография автора</Label>
                  <Textarea
                    id="author_bio"
                    value={formData.author_bio}
                    onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                    rows={2}
                    placeholder="Краткая биография автора..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="read_time">Время чтения</Label>
                    <Input
                      id="read_time"
                      value={formData.read_time}
                      onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                      placeholder="5 мин"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured">Рекомендуемая</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Теги</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={formData.tagInput}
                      onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Введите тег и нажмите Enter"
                    />
                    <Button type="button" onClick={handleAddTag}>
                      Добавить
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleRemoveTag(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Активна</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isUploading || isUploadingAuthorAvatar}>
                  {isUploading || isUploadingAuthorAvatar ? 'Загрузка...' : editingPost ? 'Сохранить изменения' : 'Добавить статью'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <p className="text-muted-foreground">Загрузка статей...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              <p className="text-muted-foreground">Статьи не найдены. Добавьте первую статью.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Рекомендуемая</TableHead>
                  <TableHead>Активна</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.id}</TableCell>
                    <TableCell className="font-mono text-xs">{post.slug}</TableCell>
                    <TableCell className="max-w-xs truncate">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.category}</Badge>
                    </TableCell>
                    <TableCell>{new Date(post.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      <Badge variant={post.featured ? 'default' : 'secondary'}>
                        {post.featured ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.is_active ? 'default' : 'secondary'}>
                        {post.is_active ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleOpenDialog(post)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

