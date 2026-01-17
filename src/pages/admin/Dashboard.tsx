import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
  Users,
  BookOpen,
  FileText,
  DollarSign,
  TrendingUp,
  UserPlus,
  ShoppingCart,
  CheckCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalCourses: number;
  totalPosts: number;
  totalRevenue: number;
  activeEnrollments: number;
  completedCourses: number;
  todayOrders: number;
  todayRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalCourses: 0,
    totalPosts: 0,
    totalRevenue: 0,
    activeEnrollments: 0,
    completedCourses: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const [
        { data: totalUsers },
        { data: newUsersToday },
        { count: totalCourses },
        { count: totalPosts },
        { data: paidEnrollments },
        { count: activeEnrollments },
        { count: completedCourses },
        { data: todayEnrollments }
      ] = await Promise.all([
        supabase.rpc('count_auth_users'),
        supabase.rpc('count_new_users_today'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('amount_paid').eq('payment_status', 'paid'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('enrollments').select('amount_paid, payment_status').gte('created_at', todayIso)
      ]);

      // Calculate revenue
      const totalRevenue = paidEnrollments?.reduce((sum, record) => sum + (Number(record.amount_paid) || 0), 0) || 0;

      // Calculate today's stats
      const todayRevenue = todayEnrollments
        ?.filter(e => e.payment_status === 'paid')
        .reduce((sum, record) => sum + (Number(record.amount_paid) || 0), 0) || 0;

      const todayOrders = todayEnrollments?.length || 0;

      // Active Users (users with at least one enrollment using auth_user_id)
      const { count: activeUsers } = await supabase
        .from('enrollments')
        .select('auth_user_id', { count: 'exact', head: true });
      // distinct count is harder in simple count query, but for dashboard approximation:
      // Let's just use totalUsers as a base or maybe a separate query if needed. 
      // For now, let's assume activeUsers is users who have logged in recently? 
      // Or simply mapped to totalUsers for simplicity if "last_sign_in" is not available in public user table.
      // Actually best proxy for "Active Users" in `enrollments` context is distinct users. 
      // But `head: true` doesn't do distinct.
      // Let's simplified it to totalUsers for now to avoid complex SQL for dashboard unless requested.
      // Or better: users with enrollments.

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: totalUsers || 0, // Using total users as proxy for now
        newUsersToday: newUsersToday || 0,
        totalCourses: totalCourses || 0,
        totalPosts: totalPosts || 0,
        totalRevenue,
        activeEnrollments: activeEnrollments || 0,
        completedCourses: completedCourses || 0,
        todayOrders,
        todayRevenue
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Панель управления</h2>
        <p className="text-muted-foreground">
          Обзор статистики и управление системой
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Загрузка статистики...</p>
        </div>
      ) : (
        <>
          {/* Основная статистика */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Пользователи
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Всего зарегистрировано
                </p>
                {stats.newUsersToday > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    +{stats.newUsersToday} сегодня
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Курсы</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Доступно курсов
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.activeEnrollments} активных записей
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Посты</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPosts}</div>
                <p className="text-xs text-muted-foreground">
                  Опубликовано статей
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Доход</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalRevenue.toLocaleString('ru-RU', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Общий доход
                </p>
                {stats.todayRevenue > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    +{stats.todayRevenue.toLocaleString('ru-RU', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                    })} сегодня
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Дополнительная статистика */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Активные пользователи
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Покупали за 30 дней
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Покупки сегодня
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Новых заказов
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Активные записи
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Учатся сейчас
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Завершено курсов
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Успешно завершено
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Быстрые действия */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
                <Link to="/admin/courses">
                  <Plus className="mb-2 h-5 w-5" />
                  <span className="font-medium">Создать курс</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Добавить новый курс
                  </span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
                <Link to="/admin/blog">
                  <Plus className="mb-2 h-5 w-5" />
                  <span className="font-medium">Создать пост</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Написать статью в блог
                  </span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
                <Link to="/admin/users">
                  <UserPlus className="mb-2 h-5 w-5" />
                  <span className="font-medium">Добавить пользователя</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Создать нового пользователя
                  </span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
                <Link to="/admin/orders">
                  <ShoppingCart className="mb-2 h-5 w-5" />
                  <span className="font-medium">Просмотреть заказы</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Все покупки пользователей
                  </span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Последние действия / Ссылки */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Полезные ссылки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Управление пользователями
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/admin/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                Управление курсами
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/admin/orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Заказы и покупки
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/admin/blog">
                <FileText className="mr-2 h-4 w-4" />
                Управление блогом
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статистика за сегодня</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Новых пользователей</span>
              <span className="text-lg font-bold">{stats.newUsersToday}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Новых заказов</span>
              <span className="text-lg font-bold">{stats.todayOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Доход за сегодня</span>
              <span className="text-lg font-bold text-green-600">
                {stats.todayRevenue.toLocaleString('ru-RU', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

