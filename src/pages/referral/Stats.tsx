import { useState, useEffect } from 'react';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Euro,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
  partner: {
    referral_code: string;
    level: string;
  };
  stats: {
    visits: {
      total: number;
      unique: number;
    };
    registrations: {
      total: number;
      conversion: number;
    };
    purchases: {
      total: number;
      total_amount: number;
      avg_amount: number;
      conversion: number;
    };
    rewards: {
      visit: number;
      registration: number;
      purchase: number;
      total: number;
    };
    balance: {
      total_earnings: number;
      current_balance: number;
      withdrawn: number;
      pending: number;
    };
  };
}

export default function ReferralStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await api.getReferralDashboardStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      toast.error('Ошибка при загрузке статистики');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      Новичок: 'Новичок',
      Активный: 'Активный',
      Профессионал: 'Профессионал',
      Эксперт: 'Эксперт',
      novice: 'Новичок',
      active: 'Активный',
      professional: 'Профессионал',
      expert: 'Эксперт',
    };
    return labels[level] || level;
  };

  if (isLoading) {
    return (
      <ReferralLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Загрузка статистики...</p>
          </div>
        </div>
      </ReferralLayout>
    );
  }

  if (!stats) {
    return (
      <ReferralLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ошибка загрузки статистики</p>
        </div>
      </ReferralLayout>
    );
  }

  return (
    <ReferralLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Статистика</h1>
          <div className="text-sm md:text-base text-muted-foreground mt-1">
            Уровень: <Badge variant="secondary">{getLevelLabel(stats.partner.level)}</Badge>
          </div>
        </div>

        {/* Общая статистика */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Посещения</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.visits.total}</div>
              <p className="text-xs text-muted-foreground">
                Уникальных: {stats.stats.visits.unique}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Регистрации</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.registrations.total}</div>
              <p className="text-xs text-muted-foreground">
                Конверсия: {stats.stats.registrations.conversion.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Покупки</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.purchases.total}</div>
              <p className="text-xs text-muted-foreground">
                Конверсия: {stats.stats.purchases.conversion.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Текущий баланс</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.balance.current_balance.toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                Всего заработано: {stats.stats.balance.total_earnings.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выведено</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.balance.withdrawn.toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                В обработке: {stats.stats.balance.pending.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.rewards.total.toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                За покупки: {stats.stats.rewards.purchase.toFixed(2)}€
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Детальная статистика */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Начисления по типам</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Посещения</span>
                <span className="font-medium">{stats.stats.rewards.visit.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Регистрации</span>
                <span className="font-medium">{stats.stats.rewards.registration.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Покупки</span>
                <span className="font-medium">{stats.stats.rewards.purchase.toFixed(2)}€</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="text-sm font-medium">Всего</span>
                <span className="font-bold text-lg">{stats.stats.rewards.total.toFixed(2)}€</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Покупки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Всего покупок</span>
                <span className="font-medium">{stats.stats.purchases.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Общая сумма</span>
                <span className="font-medium">{stats.stats.purchases.total_amount.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Средний чек</span>
                <span className="font-medium">{stats.stats.purchases.avg_amount.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Конверсия</span>
                <span className="font-medium">{stats.stats.purchases.conversion.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ReferralLayout>
  );
}