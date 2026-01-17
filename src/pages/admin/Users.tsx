import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, BookOpen, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  last_sign_in_at?: string;
}

interface Course {
  id: number;
  title: string;
  slug: string;
}

interface Enrollment {
  id: number;
  course_id: number;
  course: Course;
  status: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  // Course management dialog
  const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [searchQuery]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);

      const { data: usersData, error: usersError } = await supabase
        .rpc('get_auth_users', {
          search_query: searchQuery || null,
          limit_count: 100,
          offset_count: 0
        });

      if (usersError) throw usersError;

      const transformedUsers: User[] = (usersData || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.raw_user_meta_data?.full_name || u.raw_user_meta_data?.name || 'N/A',
        phone: u.raw_user_meta_data?.phone || null,
        avatar_url: u.raw_user_meta_data?.picture || u.raw_user_meta_data?.avatar_url || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));

      const { data: totalCount, error: countError } = await supabase
        .rpc('count_auth_users', {
          search_query: searchQuery || null
        });

      if (countError) throw countError;

      setUsers(transformedUsers);
      setTotal(totalCount || 0);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error('Ошибка при загрузке пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCoursesDialog = async (user: User) => {
    setSelectedUser(user);
    setIsCoursesDialogOpen(true);
    await loadUserEnrollments(user.id);
    await loadAllCourses();
  };

  const loadUserEnrollments = async (userId: string) => {
    try {
      setIsLoadingEnrollments(true);
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('auth_user_id', userId);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      console.error('Failed to load enrollments:', error);
      toast.error('Ошибка при загрузке курсов');
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const loadAllCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setAllCourses(data || []);
    } catch (error: any) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedUser || !selectedCourseId) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          auth_user_id: selectedUser.id,
          course_id: parseInt(selectedCourseId),
          status: 'active',
          payment_status: 'paid',
          amount_paid: 0,
        });

      if (error) throw error;

      toast.success('Курс успешно добавлен');
      await loadUserEnrollments(selectedUser.id);
      setSelectedCourseId('');
    } catch (error: any) {
      console.error('Failed to add enrollment:', error);
      toast.error(error.message || 'Ошибка при добавлении курса');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: number) => {
    if (!selectedUser) return;

    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      toast.success('Курс удален');
      await loadUserEnrollments(selectedUser.id);
    } catch (error: any) {
      console.error('Failed to remove enrollment:', error);
      toast.error('Ошибка при удалении курса');
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Пользователи</h1>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по email или имени..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Всего: {total}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Загрузка...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Пользователи не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCoursesDialog(user)}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Курсы
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Course Management Dialog */}
        <Dialog open={isCoursesDialogOpen} onOpenChange={setIsCoursesDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Управление курсами: {selectedUser?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Add Course */}
              <div className="space-y-4">
                <h3 className="font-semibold">Добавить курс</h3>
                <div className="flex gap-2">
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCourses
                        .filter(course => !enrollments.some(e => e.course_id === course.id))
                        .map(course => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddEnrollment} disabled={!selectedCourseId}>
                    Добавить
                  </Button>
                </div>
              </div>

              {/* Current Enrollments */}
              <div className="space-y-4">
                <h3 className="font-semibold">Текущие курсы</h3>
                {isLoadingEnrollments ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">У пользователя нет курсов</p>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{enrollment.course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Добавлен: {formatDate(enrollment.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEnrollment(enrollment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
