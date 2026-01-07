import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Upload, X, Search, BookOpen, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  avatar_upload_path?: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    avatar_url: '',
    avatar_upload_path: '',
    is_active: true,
    email_verified: false,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [useAvatarUpload, setUseAvatarUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Управление курсами
  const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false);
  const [selectedUserForCourses, setSelectedUserForCourses] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [newEnrollmentCourseId, setNewEnrollmentCourseId] = useState<number | null>(null);
  const [newEnrollmentTariffId, setNewEnrollmentTariffId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, [searchQuery]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUsers({
        search: searchQuery || undefined,
        limit: 50,
        offset: 0,
      });
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Ошибка при загрузке пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      const isUploaded = user.avatar_upload_path;
      setFormData({
        email: user.email,
        password: '', // Не показываем пароль при редактировании
        name: user.name,
        phone: user.phone || '',
        avatar_url: isUploaded ? '' : (user.avatar_url || ''),
        avatar_upload_path: user.avatar_upload_path || '',
        is_active: user.is_active,
        email_verified: user.email_verified,
      });
      if (isUploaded) {
        setAvatarPreview(user.avatar_url || '');
        setUseAvatarUpload(true);
      } else if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
        setUseAvatarUpload(false);
      } else {
        setAvatarPreview('');
        setUseAvatarUpload(false);
      }
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        avatar_url: '',
        avatar_upload_path: '',
        is_active: true,
        email_verified: false,
      });
      setAvatarPreview('');
      setUseAvatarUpload(false);
    }
    setAvatarFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setAvatarFile(null);
    setAvatarPreview('');
    setUseAvatarUpload(false);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUseAvatarUpload(true);
    }
  };

  const handleRemoveAvatarFile = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setUseAvatarUpload(false);
    setFormData({ ...formData, avatar_upload_path: '', avatar_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let submitData: any = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone || null,
        is_active: formData.is_active,
        email_verified: formData.email_verified,
      };

      // Пароль только при создании или если указан при редактировании
      if (!editingUser || formData.password) {
        if (!formData.password || formData.password.length < 6) {
          toast.error('Пароль обязателен и должен быть не менее 6 символов');
          return;
        }
        submitData.password = formData.password;
      }

      // Если загружен файл, сначала загружаем его
      if (avatarFile) {
        setIsUploading(true);
        try {
          const uploadResult = await api.uploadAuthorAvatar(avatarFile);
          submitData.avatar_upload_path = uploadResult.filename;
          submitData.avatar_url = null;
        } catch (uploadError: any) {
          toast.error(uploadError.message || 'Ошибка при загрузке файла');
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (!useAvatarUpload && formData.avatar_url) {
        // Если используется URL, очищаем путь к загруженному файлу
        submitData.avatar_url = formData.avatar_url;
        submitData.avatar_upload_path = null;
      } else if (formData.avatar_upload_path) {
        // Используем существующий загруженный файл
        submitData.avatar_upload_path = formData.avatar_upload_path;
        submitData.avatar_url = null;
      } else {
        submitData.avatar_url = null;
        submitData.avatar_upload_path = null;
      }

      if (editingUser) {
        await api.updateUser(editingUser.id, submitData);
        toast.success('Пользователь успешно обновлен');
      } else {
        await api.createUser(submitData);
        toast.success('Пользователь успешно создан');
      }
      loadUsers();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(error.message || 'Ошибка при сохранении пользователя');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await api.deleteUser(id);
        toast.success('Пользователь успешно удален');
        loadUsers();
      } catch (error: any) {
        console.error('Failed to delete user:', error);
        toast.error(error.message || 'Ошибка при удалении пользователя');
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.toggleUserActive(user.id);
      toast.success(`Пользователь ${user.is_active ? 'деактивирован' : 'активирован'}`);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to toggle user active:', error);
      toast.error(error.message || 'Ошибка при изменении статуса');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Управление курсами пользователя
  const handleOpenCoursesDialog = async (user: User) => {
    setSelectedUserForCourses(user);
    setIsCoursesDialogOpen(true);
    setCourseTariffsMap({}); // Очищаем кэш тарифов
    await loadUserEnrollments(user.id);
    await loadAllCourses();
    
    // Предзагружаем тарифы для существующих курсов
    const enrollmentsResponse = await api.getUserEnrollments(user.id);
    for (const enrollment of enrollmentsResponse.enrollments) {
      await loadCourseTariffs(enrollment.course.id);
    }
  };

  const loadUserEnrollments = async (userId: number) => {
    try {
      setIsLoadingEnrollments(true);
      const response = await api.getUserEnrollments(userId);
      setEnrollments(response.enrollments);
    } catch (error: any) {
      console.error('Failed to load enrollments:', error);
      toast.error('Ошибка при загрузке курсов пользователя');
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const loadAllCourses = async () => {
    try {
      setIsLoadingCourses(true);
      const response = await api.getAllCourses();
      setCourses(response.courses);
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      toast.error('Ошибка при загрузке курсов');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedUserForCourses || !newEnrollmentCourseId || !newEnrollmentTariffId) {
      toast.error('Выберите курс и тариф');
      return;
    }

    try {
      await api.addUserEnrollment(selectedUserForCourses.id, newEnrollmentCourseId, newEnrollmentTariffId);
      toast.success('Курс успешно добавлен');
      await loadUserEnrollments(selectedUserForCourses.id);
      setNewEnrollmentCourseId(null);
      setNewEnrollmentTariffId(null);
    } catch (error: any) {
      console.error('Failed to add enrollment:', error);
      toast.error(error.message || 'Ошибка при добавлении курса');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: number) => {
    if (!selectedUserForCourses) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить этот курс у пользователя?')) {
      return;
    }

    try {
      await api.removeUserEnrollment(selectedUserForCourses.id, enrollmentId);
      toast.success('Курс успешно удален');
      await loadUserEnrollments(selectedUserForCourses.id);
    } catch (error: any) {
      console.error('Failed to remove enrollment:', error);
      toast.error(error.message || 'Ошибка при удалении курса');
    }
  };

  const handleChangeTariff = async (enrollmentId: number, courseId: number, newTariffId: number) => {
    if (!selectedUserForCourses) return;

    try {
      await api.updateUserEnrollmentTariff(selectedUserForCourses.id, enrollmentId, newTariffId);
      toast.success('Тариф успешно изменен');
      await loadUserEnrollments(selectedUserForCourses.id);
    } catch (error: any) {
      console.error('Failed to update tariff:', error);
      toast.error(error.message || 'Ошибка при изменении тарифа');
    }
  };

  const [courseTariffsMap, setCourseTariffsMap] = useState<{ [key: number]: any[] }>({});

  const loadCourseTariffs = async (courseId: number) => {
    if (courseTariffsMap[courseId]) {
      return courseTariffsMap[courseId];
    }

    try {
      const course = await api.getCourseById(courseId);
      const tariffs = course.tariffs || [];
      setCourseTariffsMap(prev => ({ ...prev, [courseId]: tariffs }));
      return tariffs;
    } catch (error) {
      console.error('Failed to load course tariffs:', error);
      return [];
    }
  };

  const getCourseTariffs = async (courseId: number) => {
    if (courseTariffsMap[courseId]) {
      return courseTariffsMap[courseId];
    }
    return await loadCourseTariffs(courseId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Управление пользователями</h1>
            <p className="text-muted-foreground">
              Всего пользователей: {total}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить пользователя
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
                </DialogTitle>
                <DialogDescription>
                  Заполните информацию о пользователе
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Иван Иванов"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Пароль {editingUser ? '(оставьте пустым, чтобы не менять)' : '*'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      placeholder="Минимум 6 символов"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Аватар</Label>
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={!useAvatarUpload ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setUseAvatarUpload(false);
                            setAvatarFile(null);
                            setAvatarPreview(formData.avatar_url || '');
                            setFormData({ ...formData, avatar_upload_path: '' });
                          }}
                        >
                          URL
                        </Button>
                        <Button
                          type="button"
                          variant={useAvatarUpload ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setUseAvatarUpload(true);
                            setFormData({ ...formData, avatar_url: '' });
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Загрузить файл
                        </Button>
                      </div>

                      {!useAvatarUpload && (
                        <Input
                          id="avatar_url"
                          value={formData.avatar_url}
                          onChange={(e) => {
                            setFormData({ ...formData, avatar_url: e.target.value });
                            setAvatarPreview(e.target.value);
                          }}
                          placeholder="https://example.com/avatar.jpg"
                        />
                      )}

                      {useAvatarUpload && (
                        <div className="space-y-2">
                          <input
                            id="avatar_file"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('avatar_file')?.click();
                            }}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {avatarFile ? avatarFile.name : 'Выберите файл'}
                          </Button>
                        </div>
                      )}

                      {avatarPreview && (
                        <div className="relative inline-block">
                          <img
                            src={avatarPreview}
                            alt="Avatar Preview"
                            className="h-20 w-20 rounded-full object-cover border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={handleRemoveAvatarFile}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <Label htmlFor="is_active">Активен</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="email_verified"
                        checked={formData.email_verified}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, email_verified: checked })
                        }
                      />
                      <Label htmlFor="email_verified">Email подтвержден</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Загрузка...' : editingUser ? 'Сохранить' : 'Создать'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Поиск */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по email, имени или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Таблица пользователей */}
        <Card>
          <CardHeader>
            <CardTitle>Список пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Пользователи не найдены
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Аватар</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                          {user.email_verified && (
                            <Badge variant="outline" className="text-xs">
                              Email подтвержден
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() => handleToggleActive(user)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenCoursesDialog(user)}
                            title="Управление курсами"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Диалог управления курсами */}
        <Dialog open={isCoursesDialogOpen} onOpenChange={setIsCoursesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Управление курсами: {selectedUserForCourses?.name}
              </DialogTitle>
              <DialogDescription>
                Просмотр, добавление и управление курсами пользователя
              </DialogDescription>
            </DialogHeader>

            {/* Добавление нового курса */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold">Добавить курс</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Курс</Label>
                  <Select
                    value={newEnrollmentCourseId?.toString() || ''}
                    onValueChange={async (value) => {
                      const courseId = parseInt(value);
                      setNewEnrollmentCourseId(courseId);
                      setNewEnrollmentTariffId(null);
                      await loadCourseTariffs(courseId);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Тариф</Label>
                  <Select
                    value={newEnrollmentTariffId?.toString() || ''}
                    onValueChange={(value) => setNewEnrollmentTariffId(parseInt(value))}
                    disabled={!newEnrollmentCourseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тариф" />
                    </SelectTrigger>
                    <SelectContent>
                      {newEnrollmentCourseId && courseTariffsMap[newEnrollmentCourseId]?.map((tariff: any) => (
                        <SelectItem key={tariff.id} value={tariff.id.toString()}>
                          {tariff.name} - {tariff.price} €
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddEnrollment} disabled={!newEnrollmentCourseId || !newEnrollmentTariffId}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить курс
              </Button>
            </div>

            {/* Список курсов пользователя */}
            <div className="space-y-4">
              <h3 className="font-semibold">Курсы пользователя</h3>
              {isLoadingEnrollments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  У пользователя нет курсов
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Курс</TableHead>
                      <TableHead>Тариф</TableHead>
                      <TableHead>Прогресс</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата покупки</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => {
                      const courseTariffs = courseTariffsMap[enrollment.course.id] || [];
                      
                      // Загружаем тарифы, если их еще нет
                      if (!courseTariffs.length && enrollment.course.id) {
                        loadCourseTariffs(enrollment.course.id);
                      }
                      
                      return (
                        <TableRow key={enrollment.enrollment_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {enrollment.course.image_url ? (
                                <img
                                  src={enrollment.course.image_url}
                                  alt={enrollment.course.title}
                                  className="h-12 w-12 rounded object-cover"
                                  onError={(e) => {
                                    // Если изображение не загрузилось, скрываем его
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                  Нет фото
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{enrollment.course.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {enrollment.course.subtitle}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={enrollment.tariff.id.toString()}
                              onValueChange={(value) =>
                                handleChangeTariff(
                                  enrollment.enrollment_id,
                                  enrollment.course.id,
                                  parseInt(value)
                                )
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {courseTariffs.map((tariff: any) => (
                                  <SelectItem key={tariff.id} value={tariff.id.toString()}>
                                    {tariff.name} - {tariff.price} €
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                {enrollment.lessons_completed} / {enrollment.total_lessons} уроков
                              </div>
                              <div className="w-24">
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${enrollment.progress_percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                              {enrollment.status === 'active' ? 'Активен' : enrollment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(enrollment.purchased_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveEnrollment(enrollment.enrollment_id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCoursesDialogOpen(false)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

