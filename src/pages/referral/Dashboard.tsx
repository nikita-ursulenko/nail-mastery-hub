import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  QrCode,
  TrendingUp,
  Users,
  ShoppingCart,
  Euro,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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

interface Reward {
  id: number;
  reward_type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

interface Referral {
  user_id: number;
  email: string;
  status: string;
  registered_at: string;
  total_purchases: number;
}

interface Withdrawal {
  id: number;
  amount: number;
  payment_details: string;
  telegram_tag: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [level, setLevel] = useState<{ level: string; referrals_count: number; total_earnings: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Форма запроса на вывод
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPaymentDetails, setWithdrawalPaymentDetails] = useState('');
  const [withdrawalTelegram, setWithdrawalTelegram] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Фильтры
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, linkData, rewardsData, referralsData, withdrawalsData, levelData] = await Promise.all([
        api.getReferralDashboardStats(),
        api.getReferralLink(),
        api.getReferralRewards({ limit: 5 }),
        api.getReferralReferrals(),
        api.getWithdrawalHistory(),
        api.getReferralLevel(),
      ]);

      setStats(statsData);
      setReferralLink(linkData.referral_link);
      setReferralCode(linkData.referral_code);
      setRewards(rewardsData.rewards || []);
      setReferrals(referralsData.referrals || []);
      setWithdrawals(withdrawalsData.withdrawals || []);
      setLevel(levelData);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawalAmount || !withdrawalPaymentDetails) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0) {
      toast.error('Сумма должна быть больше нуля');
      return;
    }

    if (!stats || amount > stats.stats.balance.current_balance) {
      toast.error('Недостаточно средств на балансе');
      return;
    }

    setIsSubmittingWithdrawal(true);

    try {
      await api.createWithdrawalRequest({
        amount,
        payment_details: withdrawalPaymentDetails.trim(),
        telegram_tag: withdrawalTelegram.trim() || undefined,
      });
      
      toast.success('Запрос на вывод создан');
      setWithdrawalAmount('');
      setWithdrawalPaymentDetails('');
      setWithdrawalTelegram('');
      await loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании запроса');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const getRewardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      visit: 'Посещение',
      registration: 'Регистрация',
      purchase: 'Покупка',
      manual: 'Ручное начисление',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      paid: 'default',
      rejected: 'destructive',
    };

    const labels: Record<string, string> = {
      pending: 'В обработке',
      approved: 'Одобрено',
      paid: 'Выплачено',
      rejected: 'Отклонено',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
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
            <p className="text-muted-foreground">Загрузка данных...</p>
          </div>
        </div>
      </ReferralLayout>
    );
  }

  if (!stats) {
    return (
      <ReferralLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ошибка загрузки данных</p>
        </div>
      </ReferralLayout>
    );
  }

  return (
    <ReferralLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Дашборд партнера</h1>
          <p className="text-muted-foreground">
            Уровень: <Badge variant="secondary">{getLevelLabel(stats.partner.level)}</Badge>
          </p>
        </div>

        {/* Реферальная ссылка - краткая версия */}
        <Card>
          <CardHeader>
            <CardTitle>Реферальная ссылка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={referralLink} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Реферальный код</Label>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-3 py-2 bg-muted rounded-md font-mono text-lg">
                    {referralCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Копировать
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Полные материалы для продвижения доступны в разделе <strong>Материалы</strong>
            </p>
          </CardContent>
        </Card>

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

        {/* История начислений */}
        <Card>
          <CardHeader>
            <CardTitle>Последние начисления</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нет начислений
                </p>
              ) : (
                <>
                  {rewards.slice(0, 5).map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getRewardTypeLabel(reward.reward_type)}</span>
                          {getStatusBadge(reward.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reward.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(reward.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${
                          reward.reward_type === 'manual_remove' ? 'text-destructive' : 'text-green-600'
                        }`}>
                          {reward.reward_type === 'manual_remove' ? '-' : '+'}
                          {reward.amount.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  ))}
                  {rewards.length >= 5 && (
                    <div className="pt-2 border-t">
                      <Link
                        to="/referral/dashboard/rewards"
                        className="text-sm text-primary hover:underline"
                      >
                        Показать все начисления →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ReferralLayout>
  );
}
