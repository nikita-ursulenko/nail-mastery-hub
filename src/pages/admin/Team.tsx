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
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url?: string | null;
  image_upload_path?: string | null;
  achievements: string[];
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AdminTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    image_url: '',
    image_upload_path: '',
    achievements: [] as string[],
    achievementInput: '',
    display_order: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [useUpload, setUseUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Failed to load team members:', error);
      toast.error('Ошибка при загрузке команды');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      const isUploaded = member.image_upload_path;
      setFormData({
        name: member.name,
        role: member.role,
        bio: member.bio,
        image_url: isUploaded ? '' : (member.image_url || ''),
        image_upload_path: member.image_upload_path || '',
        achievements: member.achievements || [],
        achievementInput: '',
        display_order: member.display_order,
        is_active: member.is_active,
      });
      if (isUploaded) {
        setImagePreview(`/uploads/team/${member.image_upload_path}`);
        setUseUpload(true);
      } else if (member.image_url) {
        setImagePreview(member.image_url);
        setUseUpload(false);
      } else {
        setImagePreview('');
        setUseUpload(false);
      }
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        role: '',
        bio: '',
        image_url: '',
        image_upload_path: '',
        achievements: [],
        achievementInput: '',
        display_order: teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.display_order)) + 1 : 0,
        is_active: true,
      });
      setImagePreview('');
      setUseUpload(false);
    }
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setImageFile(null);
    setImagePreview('');
    setUseUpload(false);
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
    try {
      let submitData: any = {
        name: formData.name,
        role: formData.role,
        bio: formData.bio,
        // achievementInput is excluded by explicit mapping above.
        achievements: formData.achievements,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      // Если загружен файл, сначала загружаем его
      if (imageFile) {
        setIsUploading(true);
        try {
          const { secure_url, public_id } = await uploadToCloudinary(imageFile);
          submitData.image_url = secure_url;
          submitData.image_upload_path = public_id;
        } catch (uploadError: any) {
          console.error('Cloudinary upload error:', uploadError);
          throw uploadError;
        }
      } else if (!useUpload && formData.image_url) {
        // Если используется URL, очищаем путь к загруженному файлу
        submitData.image_url = formData.image_url;
        submitData.image_upload_path = null;
      } else if (formData.image_upload_path) {
        // Keep existing from editingMember or form state
        submitData.image_upload_path = formData.image_upload_path;
        if (editingMember?.image_url) {
          submitData.image_url = editingMember.image_url;
        }
      } else {
        submitData.image_url = null;
        submitData.image_upload_path = null;
      }

      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update(submitData)
          .eq('id', editingMember.id);
        if (error) throw error;
        toast.success('Член команды обновлен');
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert([submitData]);
        if (error) throw error;
        toast.success('Член команды добавлен');
      }
      loadTeamMembers();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save team member:', error);
      toast.error(error.message || 'Ошибка при сохранении члена команды.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого члена команды?')) {
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', id);

        if (error) throw error;

        loadTeamMembers();
        toast.success('Член команды удален');
      } catch (error: any) {
        console.error('Failed to delete team member:', error);
        toast.error('Ошибка при удалении члена команды.');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Управление командой</h1>
          <p className="text-muted-foreground">
            Добавляйте, редактируйте и удаляйте членов команды
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить члена команды
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Редактировать члена команды' : 'Добавить члена команды'}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о члене команды
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
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
                    <Label htmlFor="role">Роль *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                      placeholder="Основатель и главный преподаватель"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Биография *</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    required
                    rows={3}
                    placeholder="Международный судья, призёр чемпионатов по nail-art..."
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
                          id="team_image_file"
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
                            document.getElementById('team_image_file')?.click();
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
                    <Label htmlFor="display_order">Порядок отображения</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Активен</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Загрузка...' : editingMember ? 'Сохранить изменения' : 'Добавить члена команды'}
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
              <p className="text-muted-foreground">Загрузка команды...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              <p className="text-muted-foreground">Члены команды не найдены. Добавьте первого члена команды.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Порядок</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Достижений</TableHead>
                  <TableHead>Активен</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.id}</TableCell>
                    <TableCell>{member.display_order}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{member.role}</TableCell>
                    <TableCell>{member.achievements?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleOpenDialog(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
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

