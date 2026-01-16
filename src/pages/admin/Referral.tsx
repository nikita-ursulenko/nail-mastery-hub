import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  TrendingUp,
  ShoppingCart,
  Euro,
  Download,
  History,
  Search,
  Plus,
  Minus,
  Eye,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { maskPaymentDetails } from '@/utils/paymentMask';

interface ReferralStats {
  total_partners: number;
  active_partners: number;
  inactive_partners: number;
  new_partners_period: number;
  total_visits: number;
  total_registrations: number;
  total_purchases: number;
  avg_purchase_amount: number;
  total_rewards: number;
  total_withdrawals: number;
  pending_withdrawals: number;
  conversions: {
    registrations_to_visits: number;
    purchases_to_registrations: number;
    purchases_to_visits: number;
  };
}

interface Partner {
  id: number;
  name: string;
  email: string;
  referral_code: string;
  phone: string | null;
  balance: number;
  current_balance?: number; // For compatibility
  total_earnings: number;
  withdrawn: number;
  is_active: boolean;
  level: string;
  created_at: string;
}

interface Withdrawal {
  id: number;
  partner_id: number;
  partner_name?: string;
  partner_email?: string;
  partner?: { name: string; email: string };
  amount: number;
  payment_details: string;
  telegram_tag: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
  processed_by: number | null;
  admin_notes: string | null;
}

interface HistoryItem {
  id: number;
  type?: string;
  operation_type: 'visit' | 'registration' | 'purchase' | 'manual' | 'withdrawal';
  partner_id: number;
  partner_name?: string;
  partner_email?: string;
  partner?: { name: string; email: string };
  amount: number;
  description: string;
  status: string;
  created_at: string;
  created_by: number | null;
}

export default function AdminReferral() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersTotal, setPartnersTotal] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsPending, setWithdrawalsPending] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'visit' | 'registration' | 'purchase' | 'manual' | 'withdrawal'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'cancelled'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');

  // Modals
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerStats, setShowPartnerStats] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showRemoveFunds, setShowRemoveFunds] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);

  // Forms
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsDescription, setFundsDescription] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, partnerSearch, partnerStatusFilter, withdrawalStatusFilter, withdrawalSearch, historyTypeFilter, historyStatusFilter, historySearch]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (activeTab === 'stats') {
        const { data: statsData, error } = await supabase.rpc('get_admin_referral_stats');

        if (error) throw error;

        const result = statsData as any;
        const conversions = {
          registrations_to_visits: result.total_visits > 0 ? (result.total_registrations / result.total_visits) * 100 : 0,
          purchases_to_registrations: result.total_registrations > 0 ? (result.total_purchases / result.total_registrations) * 100 : 0,
          purchases_to_visits: result.total_visits > 0 ? (result.total_purchases / result.total_visits) * 100 : 0,
        };

        setStats({
          ...result,
          new_partners_period: 0,
          conversions
        });
      } else if (activeTab === 'partners') {
        let query = supabase.from('referral_partners').select('*', { count: 'exact' });

        if (partnerSearch) {
          query = query.or(`name.ilike.%${partnerSearch}%,email.ilike.%${partnerSearch}%,referral_code.ilike.%${partnerSearch}%`);
        }
        if (partnerStatusFilter !== 'all') {
          query = query.eq('is_active', partnerStatusFilter === 'active');
        }

        const { data, count, error } = await query;
        if (error) throw error;

        setPartners((data || []).map((p: any) => ({
          ...p,
          current_balance: p.balance || 0,
        })));
        setPartnersTotal(count || 0);

      } else if (activeTab === 'withdrawals') {
        let query = supabase
          .from('referral_withdrawals')
          .select('*, partner:referral_partners(name, email)')
          .order('requested_at', { ascending: false });

        if (withdrawalStatusFilter !== 'all') {
          query = query.eq('status', withdrawalStatusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filtered = (data || []).map((w: any) => ({
          ...w,
          partner_name: w.partner?.name || 'Unknown',
          partner_email: w.partner?.email || 'Unknown',
          amount: Number(w.amount)
        }));

        if (withdrawalSearch) {
          const searchLower = withdrawalSearch.toLowerCase();
          filtered = filtered.filter((w: any) =>
            w.partner_name.toLowerCase().includes(searchLower) ||
            w.partner_email.toLowerCase().includes(searchLower)
          );
        }

        setWithdrawals(filtered);
        setWithdrawalsPending(filtered.filter((w: any) => w.status === 'pending').length);

      } else if (activeTab === 'history') {
        const [rewardsRes, withdrawalsRes] = await Promise.all([
          supabase.from('referral_rewards').select('*, partner:referral_partners(name, email)').order('created_at', { ascending: false }).limit(100),
          supabase.from('referral_withdrawals').select('*, partner:referral_partners(name, email)').order('requested_at', { ascending: false }).limit(100)
        ]);

        if (rewardsRes.error) throw rewardsRes.error;
        if (withdrawalsRes.error) throw withdrawalsRes.error;

        const rewardsItems: HistoryItem[] = (rewardsRes.data || []).map((r: any) => ({
          id: r.id,
          operation_type: r.reward_type === 'commission' ? 'purchase' : 'manual',
          type: r.reward_type,
          partner_id: r.partner_id,
          partner_name: r.partner?.name,
          partner_email: r.partner?.email,
          amount: Number(r.amount),
          description: r.description || (r.reward_type === 'commission' ? 'Комиссия с продажи' : 'Начисление'),
          status: r.status || 'completed',
          created_at: r.created_at,
          created_by: null
        }));

        const withdrawalItems: HistoryItem[] = (withdrawalsRes.data || []).map((w: any) => ({
          id: w.id,
          operation_type: 'withdrawal',
          partner_id: w.partner_id,
          partner_name: w.partner?.name,
          partner_email: w.partner?.email,
          amount: Number(w.amount),
          description: 'Вывод средств',
          status: w.status,
          created_at: w.requested_at,
          created_by: w.processed_by
        }));

        let combined = [...rewardsItems, ...withdrawalItems].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        if (historyTypeFilter !== 'all') {
          combined = combined.filter(h => h.operation_type === historyTypeFilter);
        }
        if (historyStatusFilter !== 'all') {
          combined = combined.filter(h => h.status === historyStatusFilter);
        }
        if (historySearch) {
          const searchLower = historySearch.toLowerCase();
          combined = combined.filter(h =>
            (h.partner_name || '').toLowerCase().includes(searchLower) ||
            (h.partner_email || '').toLowerCase().includes(searchLower) ||
            (h.description || '').toLowerCase().includes(searchLower)
          );
        }

        setHistory(combined);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error(error.message || 'Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!selectedPartner || !fundsAmount || !fundsDescription) {
      toast.error('Заполните все поля');
      return;
    }

    const amount = parseFloat(fundsAmount);
    if (amount <= 0) {
      toast.error('Сумма должна быть больше нуля');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-referrals', {
        body: {
          action: 'add_funds',
          partnerId: selectedPartner.id,
          amount,
          description: fundsDescription
        }
      });

      if (error) throw error;

      toast.success('Средства начислены');
      setShowAddFunds(false);
      setFundsAmount('');
      setFundsDescription('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при начислении');
    }
  };

  const handleRemoveFunds = async () => {
    if (!selectedPartner || !fundsAmount || !fundsDescription) {
      toast.error('Заполните все поля');
      return;
    }

    const amount = parseFloat(fundsAmount);
    if (amount <= 0) {
      toast.error('Сумма должна быть больше нуля');
      return;
    }

    if (amount > (selectedPartner.balance || selectedPartner.current_balance || 0)) {
      toast.error('Недостаточно средств на балансе');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-referrals', {
        body: {
          action: 'remove_funds',
          partnerId: selectedPartner.id,
          amount,
          description: fundsDescription
        }
      });

      if (error) throw error;

      toast.success('Средства списаны');
      setShowRemoveFunds(false);
      setFundsAmount('');
      setFundsDescription('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при списании');
    }
  };

  const handleTogglePartnerStatus = async (partner: Partner) => {
    try {
      const { error } = await supabase.functions.invoke('admin-referrals', {
        body: {
          action: 'toggle_status',
          id: partner.id
        }
      });
      if (error) throw error;

      toast.success(`Партнер ${partner.is_active ? 'заблокирован' : 'активирован'}`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при изменении статуса');
    }
  };

  const handleWithdrawalApprove = async () => {
    if (!selectedWithdrawal) return;

    try {
      const { error } = await supabase.functions.invoke('admin-referrals', {
        body: {
          action: 'approve_withdrawal',
          id: selectedWithdrawal.id
        }
      });
      if (error) throw error;

      toast.success('Запрос одобрен');
      setShowWithdrawalDetails(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при одобрении');
    }
  };

  const handleWithdrawalReject = async () => {
    if (!selectedWithdrawal || !withdrawalNotes) {
      toast.error('Укажите причину отклонения');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-referrals', {
        body: {
          action: 'reject_withdrawal',
          id: selectedWithdrawal.id,
          notes: withdrawalNotes
        }
      });
      if (error) throw error;

      toast.success('Запрос отклонен');
      setShowWithdrawalDetails(false);
      setWithdrawalNotes('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при отклонении');
    }
  };

  const handleWithdrawalMarkPaid = async () => {
    if (!selectedWithdrawal) return;

    try {
      const { error } = await supabase.functions.invoke('admin-referrals', {
        body: {
          action: 'mark_paid',
          id: selectedWithdrawal.id
        }
      });
      if (error) throw error;

      toast.success('Запрос помечен как выплаченный');
      setShowWithdrawalDetails(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении статуса');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      paid: 'default',
      rejected: 'destructive',
      active: 'default',
      inactive: 'secondary',
    };

    const labels: Record<string, string> = {
      pending: 'В обработке',
      approved: 'Одобрено',
      paid: 'Выплачено',
      rejected: 'Отклонено',
      active: 'Активен',
      inactive: 'Заблокирован',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredPartners = partners;
  const filteredWithdrawals = withdrawals;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Управление реферальной системой</h1>
          <p className="text-muted-foreground">
            Статистика, партнеры, запросы на вывод и история операций
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 gap-1 md:gap-0">
            <TabsTrigger
              value="stats"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 md:py-1.5 h-auto md:h-auto min-h-[56px] md:min-h-0 text-[10px] md:text-sm"
            >
              <BarChart3 className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
              <span className="hidden lg:inline">Статистика</span>
            </TabsTrigger>
            <TabsTrigger
              value="partners"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 md:py-1.5 h-auto md:h-auto min-h-[56px] md:min-h-0 text-[10px] md:text-sm"
            >
              <Users className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
              <span className="hidden lg:inline">Партнеры</span>
              <span className="font-medium md:font-normal md:ml-1 lg:ml-0 lg:font-normal">
                <span className="lg:hidden">{partnersTotal}</span>
                <span className="hidden lg:inline">({partnersTotal})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 md:py-1.5 h-auto md:h-auto min-h-[56px] md:min-h-0 text-[10px] md:text-sm"
            >
              <Download className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
              <span className="hidden lg:inline">Запросы</span>
              <span className="font-medium md:font-normal md:ml-1 lg:ml-0 lg:font-normal">
                <span className="lg:hidden">{withdrawalsPending}</span>
                <span className="hidden lg:inline">({withdrawalsPending})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 md:py-1.5 h-auto md:h-auto min-h-[56px] md:min-h-0 text-[10px] md:text-sm"
            >
              <History className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
              <span className="hidden lg:inline">История</span>
            </TabsTrigger>
          </TabsList>

          {/* Stats Content */}
          <TabsContent value="stats" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Загрузка статистики...</p>
              </div>
            ) : stats ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Stats Cards */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Партнеры</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_partners}</div>
                      <p className="text-xs text-muted-foreground">
                        Активных: {stats.active_partners}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Посещения</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_visits}</div>
                      <p className="text-xs text-muted-foreground">
                        Регистраций: {stats.total_registrations}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Покупки</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_purchases}</div>
                      <p className="text-xs text-muted-foreground">
                        Средний чек: {stats.avg_purchase_amount.toFixed(2)}€
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Начисления</CardTitle>
                      <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total_rewards.toFixed(2)}€</div>
                      <p className="text-xs text-muted-foreground">
                        Выплачено: {stats.total_withdrawals.toFixed(2)}€
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Конверсии</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Регистрации / Посещения</p>
                        <p className="text-2xl font-bold">{stats.conversions.registrations_to_visits.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Покупки / Регистрации</p>
                        <p className="text-2xl font-bold">{stats.conversions.purchases_to_registrations.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Покупки / Посещения</p>
                        <p className="text-2xl font-bold">{stats.conversions.purchases_to_visits.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Ошибка загрузки статистики</p>
              </div>
            )}
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Список партнеров</CardTitle>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по имени, email, коду..."
                        value={partnerSearch}
                        onChange={(e) => setPartnerSearch(e.target.value)}
                        className="pl-8 w-full sm:w-64"
                      />
                    </div>
                    <Select value={partnerStatusFilter} onValueChange={(v: any) => setPartnerStatusFilter(v)}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        <SelectItem value="active">Активные</SelectItem>
                        <SelectItem value="inactive">Заблокированные</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPartners.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Партнеры не найдены
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredPartners.map((partner) => (
                      <div
                        key={partner.id}
                        className="flex flex-col gap-4 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{partner.name}</span>
                            {getStatusBadge(partner.is_active ? 'active' : 'inactive')}
                            <Badge variant="outline">{partner.level}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{partner.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Код: {partner.referral_code} | Баланс: {(partner.balance || partner.current_balance || 0).toFixed(2)}€
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={async () => {
                              setSelectedPartner(partner);
                              setShowPartnerStats(true);
                              toast.info("Детальная статистика партнера временно недоступна");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Статистика
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowAddFunds(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Начислить
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowRemoveFunds(true);
                            }}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            Списать
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleTogglePartnerStatus(partner)}
                          >
                            {partner.is_active ? 'Заблокировать' : 'Активировать'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Запросы на вывод</CardTitle>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по партнеру..."
                        value={withdrawalSearch}
                        onChange={(e) => setWithdrawalSearch(e.target.value)}
                        className="pl-8 w-full sm:w-64"
                      />
                    </div>
                    <Select
                      value={withdrawalStatusFilter}
                      onValueChange={(v: any) => setWithdrawalStatusFilter(v)}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        <SelectItem value="pending">В обработке</SelectItem>
                        <SelectItem value="approved">Одобрено</SelectItem>
                        <SelectItem value="paid">Выплачено</SelectItem>
                        <SelectItem value="rejected">Отклонено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredWithdrawals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Запросы не найдены
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredWithdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowWithdrawalDetails(true);
                          setWithdrawalNotes(withdrawal.admin_notes || '');
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{withdrawal.partner_name}</span>
                            {getStatusBadge(withdrawal.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{withdrawal.partner_email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm font-medium">
                              {withdrawal.amount.toFixed(2)}€
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {maskPaymentDetails(withdrawal.payment_details)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(withdrawal.requested_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <CardTitle>История операций</CardTitle>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по партнеру, описанию..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="pl-8 w-full sm:w-64"
                      />
                    </div>
                    <Select
                      value={historyTypeFilter}
                      onValueChange={(v: any) => setHistoryTypeFilter(v)}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="visit">Посещения</SelectItem>
                        <SelectItem value="registration">Регистрации</SelectItem>
                        <SelectItem value="purchase">Покупки</SelectItem>
                        <SelectItem value="manual">Ручные операции</SelectItem>
                        <SelectItem value="withdrawal">Выводы</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={historyStatusFilter}
                      onValueChange={(v: any) => setHistoryStatusFilter(v)}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="pending">В обработке</SelectItem>
                        <SelectItem value="approved">Одобрено</SelectItem>
                        <SelectItem value="paid">Выплачено</SelectItem>
                        <SelectItem value="cancelled">Отменено</SelectItem>
                        <SelectItem value="rejected">Отклонено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    История пуста
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div
                        key={`${item.operation_type}-${item.id}`}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.partner_name} ({item.partner_email})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            item.operation_type === 'withdrawal' ? "text-red-500" : "text-green-500"
                          )}>
                            {item.operation_type === 'withdrawal' ? '-' : '+'}{item.amount.toFixed(2)}€
                          </p>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Modal Definitions */}
        {/* Partner Stats Modal */}
        <Dialog open={showPartnerStats} onOpenChange={setShowPartnerStats}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Статистика партнера: {selectedPartner?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <p>Детальная статистика в разработке</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Funds Modal */}
        <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Начислить средства</DialogTitle>
              <DialogDescription>
                Партнер: {selectedPartner?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Сумма (€)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Input
                  placeholder="Причина начисления"
                  value={fundsDescription}
                  onChange={(e) => setFundsDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFunds(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddFunds}>Начислить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Funds Modal */}
        <Dialog open={showRemoveFunds} onOpenChange={setShowRemoveFunds}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Списать средства</DialogTitle>
              <DialogDescription>
                Партнер: {selectedPartner?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Сумма (€)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Input
                  placeholder="Причина списания"
                  value={fundsDescription}
                  onChange={(e) => setFundsDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRemoveFunds(false)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleRemoveFunds}>
                Списать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdrawal Details Modal */}
        <Dialog open={showWithdrawalDetails} onOpenChange={setShowWithdrawalDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Запрос на вывод</DialogTitle>
              <DialogDescription>
                ID: {selectedWithdrawal?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedWithdrawal && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Партнер</Label>
                    <p className="font-medium">{selectedWithdrawal.partner_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedWithdrawal.partner_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Сумма</Label>
                    <p className="font-bold text-xl">{selectedWithdrawal.amount.toFixed(2)}€</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Реквизиты</Label>
                    <p className="font-mono bg-muted p-2 rounded text-sm">
                      {selectedWithdrawal.payment_details}
                    </p>
                  </div>
                  {selectedWithdrawal.telegram_tag && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Telegram</Label>
                      <p className="text-sm">@{selectedWithdrawal.telegram_tag.replace('@', '')}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Дата запроса</Label>
                    <p className="text-sm">
                      {format(new Date(selectedWithdrawal.requested_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>

                {selectedWithdrawal.status === 'pending' && (
                  <div className="space-y-2">
                    <Label>Комментарий при отказе</Label>
                    <Input
                      placeholder="Причина отказа..."
                      value={withdrawalNotes}
                      onChange={(e) => setWithdrawalNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              {selectedWithdrawal?.status === 'pending' ? (
                <>
                  <Button variant="destructive" onClick={handleWithdrawalReject}>
                    Отклонить
                  </Button>
                  <Button onClick={handleWithdrawalApprove}>
                    Одобрить
                  </Button>
                </>
              ) : selectedWithdrawal?.status === 'approved' ? (
                <Button onClick={handleWithdrawalMarkPaid}>
                  Пометить как выплачено
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setShowWithdrawalDetails(false)}>
                  Закрыть
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
