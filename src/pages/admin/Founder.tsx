import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, X } from 'lucide-react';
import { api } from '@/lib/api';

interface FounderInfo {
  id: number;
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
  created_at?: string;
  updated_at?: string;
}

export default function AdminFounder() {
  const [founderInfo, setFounderInfo] = useState<FounderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    greeting: 'Привет! Я',
    role: '',
    image_url: '',
    image_upload_path: '',
    experience_years: 0,
    experience_label: 'лет опыта работы',
    achievements: [] as string[],
    achievementInput: '',
    button_text: 'Узнать больше',
    button_link: '',
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [useUpload, setUseUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFounderInfo();
  }, []);

  const loadFounderInfo = async () => {
    try {
      const data = await api.getFounderInfo();
      if (data && data.length > 0) {
        const founder = data[0];
        setFounderInfo(founder);
        // Определяем, используется ли загруженный файл или URL
        const isUploaded = founder.image_upload_path;
        setFormData({
          name: founder.name,
          greeting: founder.greeting,
          role: founder.role,
          image_url: isUploaded ? '' : (founder.image_url || ''),
          image_upload_path: founder.image_upload_path || '',
          experience_years: founder.experience_years,
          experience_label: founder.experience_label,
          achievements: founder.achievements || [],
          achievementInput: '',
          button_text: founder.button_text,
          button_link: founder.button_link || '',
          is_active: founder.is_active,
        });
        // Устанавливаем превью
        if (isUploaded) {
          setImagePreview(`/uploads/founder/${founder.image_upload_path}`);
          setUseUpload(true);
        } else if (founder.image_url) {
          setImagePreview(founder.image_url);
          setUseUpload(false);
        }
      }
    } catch (error) {
      console.error('Failed to load founder info:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleAddAchievement = () => {
    if (formData.achievementInput.trim()) {
      setFormData({
        ...formData,
        achievements: [...formData.achievements, formData.achievementInput.trim()],
        achievementInput: '',
      });
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let submitData: any = {
        name: formData.name,
        greeting: formData.greeting,
        role: formData.role,
        experience_years: formData.experience_years,
        experience_label: formData.experience_label,
        achievements: formData.achievements,
        button_text: formData.button_text,
        button_link: formData.button_link || null,
        is_active: formData.is_active,
      };

      // Если загружен файл, сначала загружаем его
      if (imageFile) {
        setIsUploading(true);
        try {
          const uploadResult = await api.uploadFounderImage(imageFile);
          submitData.image_upload_path = uploadResult.filename;
          submitData.image_url = null;
        } catch (uploadError: any) {
          alert(uploadError.message || 'Ошибка при загрузке файла');
          setIsUploading(false);
          setIsSaving(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (!useUpload && formData.image_url) {
        // Если используется URL, очищаем путь к загруженному файлу
        submitData.image_url = formData.image_url;
        submitData.image_upload_path = null;
      } else if (formData.image_upload_path) {
        // Используем существующий загруженный файл
        submitData.image_upload_path = formData.image_upload_path;
        submitData.image_url = null;
      } else {
        submitData.image_url = null;
        submitData.image_upload_path = null;
      }

      if (founderInfo) {
        await api.updateFounderInfo(founderInfo.id, submitData);
      } else {
        await api.createFounderInfo(submitData);
      }
      await loadFounderInfo();
      alert('Информация успешно сохранена!');
    } catch (error: any) {
      console.error('Failed to save founder info:', error);
      alert(error.message || 'Ошибка при сохранении информации об основателе.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Загрузка информации...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Левая часть - Информация */}
        <div className="lg:col-span-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Информация об основателе</h1>
            <p className="text-muted-foreground">
              Управляйте информацией об основателе школы
            </p>
          </div>
          {founderInfo && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Статус</p>
                    <p className="font-semibold">
                      {founderInfo.is_active ? 'Активен' : 'Неактивен'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Последнее обновление</p>
                    <p className="text-sm">
                      {founderInfo.updated_at
                        ? new Date(founderInfo.updated_at).toLocaleString('ru-RU')
                        : 'Не обновлялось'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Правая часть - Форма редактирования */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Анна Петрова"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="greeting">Приветствие</Label>
                      <Input
                        id="greeting"
                        value={formData.greeting}
                        onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                        placeholder="Привет! Я"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Роль/Должность *</Label>
                    <Textarea
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                      rows={2}
                      placeholder="Основатель NailArt Academy, международный судья и призёр чемпионатов по nail-art"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Изображение</Label>
                    <div className="space-y-3">
                      {/* Переключатель */}
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

                      {/* Поле URL */}
                      {!useUpload && (
                        <div>
                          <Input
                            id="image_url"
                            value={formData.image_url}
                            onChange={(e) => {
                              setFormData({ ...formData, image_url: e.target.value });
                              setImagePreview(e.target.value);
                            }}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      )}

                      {/* Загрузка файла */}
                      {useUpload && (
                        <div className="space-y-2">
                          <input
                            id="founder_image_file"
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
                              document.getElementById('founder_image_file')?.click();
                            }}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {imageFile ? imageFile.name : 'Выберите файл'}
                          </Button>
                        </div>
                      )}

                      {/* Превью изображения */}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience_years">Лет опыта *</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience_label">Текст опыта</Label>
                      <Input
                        id="experience_label"
                        value={formData.experience_label}
                        onChange={(e) => setFormData({ ...formData, experience_label: e.target.value })}
                        placeholder="лет опыта работы"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="achievements">Достижения</Label>
                    <div className="flex gap-2">
                      <Input
                        id="achievements"
                        value={formData.achievementInput}
                        onChange={(e) => setFormData({ ...formData, achievementInput: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAchievement();
                          }
                        }}
                        placeholder="Введите достижение и нажмите Enter"
                      />
                      <Button type="button" onClick={handleAddAchievement}>
                        Добавить
                      </Button>
                    </div>
                    {formData.achievements.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {formData.achievements.map((achievement, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md border p-2">
                            <span className="text-sm">{achievement}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAchievement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="button_text">Текст кнопки</Label>
                      <Input
                        id="button_text"
                        value={formData.button_text}
                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                        placeholder="Узнать больше"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="button_link">Ссылка кнопки</Label>
                      <Input
                        id="button_link"
                        value={formData.button_link}
                        onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                        placeholder="/about"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Активен</Label>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="submit"
                      disabled={isSaving || isUploading}
                    >
                      {isSaving || isUploading ? 'Сохранение...' : 'Сохранить изменения'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
