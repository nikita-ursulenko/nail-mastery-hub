import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  purchased_at: string;
  payment_status: string;
  amount_paid: number;
  payment_id: string | null;
  enrollment_status: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  course: {
    id: number;
    slug: string;
    title: string;
    image_url: string | null;
  };
  tariff: {
    id: number;
    name: string;
    type: string;
    price: number;
  };
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('enrollments')
        .select(`
            *,
            user:users!inner(id, name, email),
            course:courses(id, slug, title, image_url),
            tariff:course_tariffs(id, name, tariff_type, price)
        `, { count: 'exact' })
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        // Note: Full text search across relations is tricky. 
        // We can try to filter by fields if possible, or use simple filter.
        // Using !inner on user allows filtering.
        // syntax: user.email.ilike.%q%
        // BUT .or() with nested columns is limited.
        // For now, let's search by user email OR name.
        // Supabase allows: .or('email.ilike.%idx%,name.ilike.%idx%', { foreignTable: 'users' }) ? No.
        // Filter embedding: .filter('user.name', 'ilike', `%${searchQuery}%`) works if inner joined.
        // But OR is hard across tables.
        // Let's rely on basic email search or ID search if possible.
        // Actually, let's try to fetch normally and filter if complex, OR just search user email.
        query = query.ilike('user.email', `%${searchQuery}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Transform data to match Order interface
      const formattedOrders: Order[] = (data || []).map((item: any) => {
        return {
          id: item.id,
          purchased_at: item.purchased_at || item.created_at,
          payment_status: item.payment_status,
          amount_paid: item.amount_paid,
          payment_id: item.payment_id,
          enrollment_status: item.status,
          user: item.user,
          course: item.course,
          tariff: item.tariff ? {
            id: item.tariff.id,
            name: item.tariff.name,
            type: item.tariff.tariff_type || 'unknown',
            price: item.tariff.price
          } : {
            id: 0,
            name: 'Unknown',
            type: 'unknown',
            price: item.amount_paid || 0
          }
        };
      });

      setOrders(formattedOrders);
      setTotal(count || 0);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      toast.error('Ошибка при загрузке заказов');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Fetch all paid enrollments (lightweight)
      const { data, error } = await supabase
        .from('enrollments')
        .select('amount_paid, created_at')
        .eq('payment_status', 'paid');

      if (error) throw error;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let totalRevenue = 0;
      let totalOrders = data?.length || 0;
      let todayOrders = 0;
      let todayRevenue = 0;
      let weekOrders = 0;
      let weekRevenue = 0;

      data?.forEach(order => {
        const amount = Number(order.amount_paid) || 0;
        const date = new Date(order.created_at);

        totalRevenue += amount;

        if (date >= startOfToday) {
          todayOrders++;
          todayRevenue += amount;
        }
        if (date >= startOfWeek) {
          weekOrders++;
          weekRevenue += amount;
        }
      });

      setStats({
        totalOrders,
        totalRevenue,
        today: { orders: todayOrders, revenue: todayRevenue },
        week: { orders: weekOrders, revenue: weekRevenue }
      });

    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'EUR', // Assuming EUR based on previous code
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Заказы и покупки</h1>
          <p className="text-muted-foreground">
            Отчет о всех совершенных покупках пользователей
          </p>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Успешных покупок
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  За все время
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">За неделю</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.week.orders}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.week.revenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">За сегодня</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today.orders}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.today.revenue)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Фильтры */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="completed">Завершенные</SelectItem>
                    <SelectItem value="cancelled">Отмененные</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Таблица заказов */}
        <Card>
          <CardHeader>
            <CardTitle>Список заказов ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Заказы не найдены
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Курс</TableHead>
                    <TableHead>Тариф</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>ID платежа</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {formatDate(order.purchased_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.user?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.user?.email || 'Unknown'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {order.course?.image_url ? (
                            <img
                              src={order.course.image_url}
                              alt={order.course.title}
                              className="h-10 w-10 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              Нет фото
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{order.course?.title || 'Unknown'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.tariff?.name || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.amount_paid || order.tariff?.price || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.enrollment_status === 'active'
                              ? 'default'
                              : order.enrollment_status === 'completed'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {order.enrollment_status === 'active'
                            ? 'Активен'
                            : order.enrollment_status === 'completed'
                              ? 'Завершен'
                              : order.enrollment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {order.payment_id ? (
                          <span className="truncate max-w-[150px] inline-block" title={order.payment_id}>
                            {order.payment_id}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

