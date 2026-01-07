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
import { Star, Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar?: string | null;
  text: string;
  rating: number;
  created_at?: string;
  updated_at?: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: '',
    avatarUploadPath: '',
    text: '',
    rating: 5,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [useUpload, setUseUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const data = await api.getTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      // Определяем, используется ли загруженный файл или URL
      const isUploaded = testimonial.avatar?.startsWith('/uploads/');
      setFormData({
        name: testimonial.name,
        role: testimonial.role,
        avatar: isUploaded ? '' : (testimonial.avatar || ''),
        avatarUploadPath: isUploaded ? testimonial.avatar : '',
        text: testimonial.text,
        rating: testimonial.rating,
      });
      setAvatarPreview(testimonial.avatar || '');
      setUseUpload(isUploaded);
      setUseUpload(false);
    } else {
      setEditingTestimonial(null);
      setFormData({
        name: '',
        role: '',
        avatar: '',
        avatarUploadPath: '',
        text: '',
        rating: 5,
      });
      setAvatarPreview('');
      setUseUpload(false);
    }
    setAvatarFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    setFormData({
      name: '',
      role: '',
      avatar: '',
      avatarUploadPath: '',
      text: '',
      rating: 5,
    });
    setAvatarFile(null);
    setAvatarPreview('');
    setUseUpload(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUseUpload(true);
    }
  };

  const handleRemoveFile = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setUseUpload(false);
    setFormData({ ...formData, avatarUploadPath: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let submitData = { ...formData };

      // Если загружен файл, сначала загружаем его
      if (avatarFile) {
        setIsUploading(true);
        try {
          const uploadResult = await api.uploadAvatar(avatarFile);
          submitData.avatarUploadPath = uploadResult.url;
          submitData.avatar = ''; // Очищаем URL, если был
        } catch (uploadError: any) {
          alert(uploadError.message || 'Ошибка при загрузке файла');
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (!useUpload && formData.avatar) {
        // Если используется URL, очищаем путь к загруженному файлу
        submitData.avatarUploadPath = '';
      }

      if (editingTestimonial) {
        const updated = await api.updateTestimonial(editingTestimonial.id, submitData);
        setTestimonials(
          testimonials.map((t) => (t.id === editingTestimonial.id ? updated : t))
        );
      } else {
        const newTestimonial = await api.createTestimonial(submitData);
        setTestimonials([newTestimonial, ...testimonials]);
      }
      handleCloseDialog();
    } catch (error: any) {
      alert(error.message || 'Ошибка при сохранении отзыва');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
      await api.deleteTestimonial(id);
      setTestimonials(testimonials.filter((t) => t.id !== id));
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении отзыва');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Управление отзывами</h1>
            <p className="text-muted-foreground">
              Добавляйте, редактируйте и удаляйте отзывы клиентов
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить отзыв
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTestimonial ? 'Редактировать отзыв' : 'Добавить отзыв'}
                </DialogTitle>
                <DialogDescription>
                  Заполните информацию об отзыве
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Роль</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Аватар</Label>
                    <div className="space-y-3">
                      {/* Переключатель */}
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={!useUpload ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setUseUpload(false);
                            setAvatarFile(null);
                            setAvatarPreview('');
                            setFormData({ ...formData, avatarUploadPath: '' });
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
                            setFormData({ ...formData, avatar: '' });
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Загрузить файл
                        </Button>
                      </div>

                      {/* Поле URL */}
                      {!useUpload && (
                        <div>
                          <Input
                            id="avatar"
                            value={formData.avatar}
                            onChange={(e) =>
                              setFormData({ ...formData, avatar: e.target.value })
                            }
                            placeholder="https://..."
                          />
                        </div>
                      )}

                      {/* Загрузка файла */}
                      {useUpload && (
                        <div className="space-y-2">
                          <input
                            id="testimonial_avatar_file"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('testimonial_avatar_file')?.click();
                            }}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {avatarFile ? avatarFile.name : 'Выберите файл'}
                          </Button>
                          {avatarPreview && (
                            <div className="relative inline-block">
                              <img
                                src={avatarPreview}
                                alt="Preview"
                                className="h-20 w-20 rounded-full object-cover border"
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
                      )}

                      {/* Превью текущего аватара */}
                      {!useUpload && !avatarFile && formData.avatar && (
                        <div>
                          <img
                            src={formData.avatar}
                            alt="Preview"
                            className="h-20 w-20 rounded-full object-cover border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text">Текст отзыва</Label>
                    <Textarea
                      id="text"
                      value={formData.text}
                      onChange={(e) =>
                        setFormData({ ...formData, text: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Рейтинг</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, rating })
                          }
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              rating <= formData.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {formData.rating} / 5
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading
                      ? 'Загрузка...'
                      : editingTestimonial
                      ? 'Сохранить'
                      : 'Добавить'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Загрузка отзывов...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Отзывов пока нет</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Список отзывов ({testimonials.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Автор</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Текст</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {testimonial.avatar ? (
                            <img
                              src={testimonial.avatar}
                              alt={testimonial.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {testimonial.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium">{testimonial.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{testimonial.role}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-sm text-muted-foreground">
                          {testimonial.text}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < testimonial.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(testimonial)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(testimonial.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

