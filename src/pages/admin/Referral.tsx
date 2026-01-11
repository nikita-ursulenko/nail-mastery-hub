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
  Filter,
  Plus,
  Minus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { maskEmail } from '@/utils/emailMask';
import { maskPaymentDetails } from '@/utils/paymentMask';

// TODO: Добавить типы после создания API
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
  current_balance: number;
  total_earnings: number;
  withdrawn: number;
  is_active: boolean;
  level: string;
  created_at: string;
}

interface Withdrawal {
  id: number;
  partner_id: number;
  partner_name: string;
  partner_email: string;
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
  type: string;
  operation_type: string;
  partner_id: number;
  partner_name: string;
  partner_email: string;
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

  // Фильтры
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'visit' | 'registration' | 'purchase' | 'manual' | 'withdrawal'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'cancelled'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');

  // Модальные окна
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerStats, setShowPartnerStats] = useState(false);
  const [partnerStats, setPartnerStats] = useState<any>(null);
  const [isLoadingPartnerStats, setIsLoadingPartnerStats] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showRemoveFunds, setShowRemoveFunds] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);

  // Формы
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsDescription, setFundsDescription] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, partnerSearch, partnerStatusFilter, withdrawalStatusFilter, withdrawalSearch, historyTypeFilter, historyStatusFilter, historySearch]);

  // Загружаем общее количество партнеров и pending запросов при монтировании
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [partnersData, pendingData] = await Promise.all([
          api.getAdminReferralPartners({ limit: 1, offset: 0 }),
          api.getAdminReferralWithdrawals({ status: 'pending' }),
        ]);
        setPartnersTotal(partnersData.total);
        setWithdrawalsPending(pendingData.withdrawals.length);
      } catch (error) {
        // Игнорируем ошибки для подсчета
      }
    };

    loadCounts();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'stats') {
        const statsData = await api.getAdminReferralStats();
        setStats(statsData);
      } else if (activeTab === 'partners') {
        const partnersData = await api.getAdminReferralPartners({
          search: partnerSearch || undefined,
          status: partnerStatusFilter !== 'all' ? partnerStatusFilter : undefined,
        });
        // Преобразуем числовые поля из строк в числа
        setPartners(partnersData.partners.map((p: any) => ({
          ...p,
          current_balance: parseFloat(p.current_balance) || 0,
          total_earnings: parseFloat(p.total_earnings) || 0,
          withdrawn_amount: parseFloat(p.withdrawn_amount) || 0,
        })));
        setPartnersTotal(partnersData.total);
      } else if (activeTab === 'withdrawals') {
        const withdrawalsData = await api.getAdminReferralWithdrawals({
          status: withdrawalStatusFilter !== 'all' ? withdrawalStatusFilter : undefined,
          search: withdrawalSearch || undefined,
        });
        // Преобразуем числовые поля из строк в числа
        setWithdrawals(withdrawalsData.withdrawals.map((w: any) => ({
          ...w,
          amount: parseFloat(w.amount) || 0,
        })));
      } else if (activeTab === 'history') {
        // Для истории нужно передавать правильные параметры
        const historyParams: any = {
          status: historyStatusFilter !== 'all' ? historyStatusFilter : undefined,
        };
        // Если выбран тип операции (не 'withdrawal'), передаем его
        // Для 'withdrawal' фильтруем на клиенте
        if (historyTypeFilter !== 'all' && historyTypeFilter !== 'withdrawal') {
          historyParams.type = historyTypeFilter;
        }
        const historyData = await api.getAdminReferralHistory(historyParams);
        // Преобразуем числовые поля из строк в числа и фильтруем
        let filteredHistory = historyData.history.map((h: any) => ({
          ...h,
          amount: parseFloat(h.amount) || 0,
        }));
        
        // Фильтруем по типу операции на клиенте (для 'withdrawal')
        if (historyTypeFilter === 'withdrawal') {
          filteredHistory = filteredHistory.filter((h: HistoryItem) => h.operation_type === 'withdrawal');
        }
        
        // Фильтруем по поиску на клиенте (по партнеру и описанию)
        if (historySearch) {
          const searchLower = historySearch.toLowerCase();
          filteredHistory = filteredHistory.filter((h: HistoryItem) =>
            h.partner_name.toLowerCase().includes(searchLower) ||
            h.partner_email.toLowerCase().includes(searchLower) ||
            (h.description && h.description.toLowerCase().includes(searchLower))
          );
        }
        
        setHistory(filteredHistory);
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
      await api.addAdminReferralPartnerFunds(selectedPartner.id, amount, fundsDescription);
      toast.success('Средства начислены');
      setShowAddFunds(false);
      setFundsAmount('');
      setFundsDescription('');
      await loadData();
      // Обновляем количество партнеров
      const partnersData = await api.getAdminReferralPartners({ limit: 1, offset: 0 });
      setPartnersTotal(partnersData.total);
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

    if (amount > selectedPartner.current_balance) {
      toast.error('Недостаточно средств на балансе');
      return;
    }

    try {
      await api.removeAdminReferralPartnerFunds(selectedPartner.id, amount, fundsDescription);
      toast.success('Средства списаны');
      setShowRemoveFunds(false);
      setFundsAmount('');
      setFundsDescription('');
      await loadData();
      // Обновляем количество партнеров
      const partnersData = await api.getAdminReferralPartners({ limit: 1, offset: 0 });
      setPartnersTotal(partnersData.total);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при списании');
    }
  };

  const handleTogglePartnerStatus = async (partner: Partner) => {
    try {
      await api.toggleAdminReferralPartnerStatus(partner.id);
      toast.success(`Партнер ${partner.is_active ? 'заблокирован' : 'активирован'}`);
      await loadData();
      // Обновляем количество партнеров
      const partnersData = await api.getAdminReferralPartners({ limit: 1, offset: 0 });
      setPartnersTotal(partnersData.total);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при изменении статуса');
    }
  };

  const handleWithdrawalApprove = async () => {
    if (!selectedWithdrawal) return;

    try {
      await api.approveAdminReferralWithdrawal(selectedWithdrawal.id);
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
      await api.rejectAdminReferralWithdrawal(selectedWithdrawal.id, withdrawalNotes);
      toast.success('Запрос отклонен');
      setShowWithdrawalDetails(false);
      setWithdrawalNotes('');
      await loadData();
      // Обновляем количество pending запросов
      const pendingData = await api.getAdminReferralWithdrawals({ status: 'pending' });
      setWithdrawalsPending(pendingData.withdrawals.length);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при отклонении');
    }
  };

  const handleWithdrawalMarkPaid = async () => {
    if (!selectedWithdrawal) return;

    try {
      await api.markAdminReferralWithdrawalPaid(selectedWithdrawal.id);
      toast.success('Запрос помечен как выплаченный');
      setShowWithdrawalDetails(false);
      await loadData();
      // Обновляем количество pending запросов
      const pendingData = await api.getAdminReferralWithdrawals({ status: 'pending' });
      setWithdrawalsPending(pendingData.withdrawals.length);
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

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      partner.email.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      partner.referral_code.toLowerCase().includes(partnerSearch.toLowerCase());
    
    const matchesStatus =
      partnerStatusFilter === 'all' ||
      (partnerStatusFilter === 'active' && partner.is_active) ||
      (partnerStatusFilter === 'inactive' && !partner.is_active);

    return matchesSearch && matchesStatus;
  });

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const matchesStatus = withdrawalStatusFilter === 'all' || withdrawal.status === withdrawalStatusFilter;
    const matchesSearch = !withdrawalSearch || 
      withdrawal.partner_name.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
      withdrawal.partner_email.toLowerCase().includes(withdrawalSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

          {/* Статистика */}
          <TabsContent value="stats" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Загрузка статистики...</p>
              </div>
            ) : stats ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

          {/* Партнеры */}
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
                            Код: {partner.referral_code} | Баланс: {partner.current_balance.toFixed(2)}€
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
                              setIsLoadingPartnerStats(true);
                              try {
                                const stats = await api.getAdminReferralPartnerStats(partner.id);
                                setPartnerStats(stats);
                              } catch (error: any) {
                                console.error('Failed to load partner stats:', error);
                                toast.error(error.message || 'Ошибка при загрузке статистики');
                              } finally {
                                setIsLoadingPartnerStats(false);
                              }
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

          {/* Запросы на вывод */}
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

          {/* История */}
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
                  <div className="space-y-2">
                    {history.map((item) => {
                      const getTypeLabel = (type: string, operationType: string) => {
                        if (operationType === 'withdrawal') return 'Вывод';
                        switch (type) {
                          case 'visit': return 'Посещение';
                          case 'registration': return 'Регистрация';
                          case 'purchase': return 'Покупка';
                          case 'manual': return 'Ручная операция';
                          default: return type;
                        }
                      };

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{getTypeLabel(item.type, item.operation_type)}</Badge>
                              <span className="font-medium">{item.partner_name}</span>
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(item.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                              {item.created_by && ' • Ручная операция'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${item.operation_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                              {item.operation_type === 'withdrawal' ? '-' : '+'}{item.amount.toFixed(2)}€
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Модальное окно статистики партнера */}
        <Dialog 
          open={showPartnerStats} 
          onOpenChange={(open) => {
            setShowPartnerStats(open);
            if (!open) {
              setPartnerStats(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Статистика партнера</DialogTitle>
              <DialogDescription>
                {selectedPartner?.name} ({selectedPartner?.email})
              </DialogDescription>
            </DialogHeader>
            {isLoadingPartnerStats ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                  <p className="text-muted-foreground">Загрузка статистики...</p>
                </div>
              </div>
            ) : partnerStats ? (
              <div className="space-y-6">
                {/* Финансы */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Текущий баланс</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {parseFloat(partnerStats.partner.current_balance || 0).toFixed(2)}€
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Всего заработано</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {parseFloat(partnerStats.partner.total_earnings || 0).toFixed(2)}€
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Выведено</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {parseFloat(partnerStats.partner.withdrawn_amount || 0).toFixed(2)}€
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Посещения */}
                <Card>
                  <CardHeader>
                    <CardTitle>Посещения</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Всего посещений</p>
                        <p className="text-2xl font-bold">{partnerStats.visits.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Уникальных</p>
                        <p className="text-2xl font-bold">{partnerStats.visits.unique}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Регистрации */}
                <Card>
                  <CardHeader>
                    <CardTitle>Регистрации</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Всего регистраций</p>
                        <p className="text-2xl font-bold">{partnerStats.registrations.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Конверсия</p>
                        <p className="text-2xl font-bold">{partnerStats.registrations.conversion.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">от посещений</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Покупки */}
                <Card>
                  <CardHeader>
                    <CardTitle>Покупки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Всего покупок</p>
                        <p className="text-2xl font-bold">{partnerStats.purchases.total}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Общая сумма</p>
                        <p className="text-2xl font-bold">{partnerStats.purchases.total_amount.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Средний чек</p>
                        <p className="text-2xl font-bold">{partnerStats.purchases.avg_amount.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Конверсия</p>
                        <p className="text-2xl font-bold">{partnerStats.purchases.conversion.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">от регистраций</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Список рефералов */}
                <Card>
                  <CardHeader>
                    <CardTitle>Рефералы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {partnerStats.referrals && partnerStats.referrals.length > 0 ? (
                      <div className="space-y-2">
                        {partnerStats.referrals.map((referral: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{maskEmail(referral.email || '')}</p>
                              <p className="text-sm text-muted-foreground">
                                {referral.registered_at 
                                  ? format(new Date(referral.registered_at), 'dd MMMM yyyy', { locale: ru })
                                  : 'Дата неизвестна'}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Покупки</p>
                                <p className="font-medium">
                                  {parseFloat(referral.total_purchases || 0).toFixed(2)}€
                                </p>
                              </div>
                              <Badge variant={referral.status === 'purchased' ? 'default' : 'secondary'}>
                                {referral.status === 'purchased' ? 'Купил' : 'Зарегистрирован'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Пока нет рефералов
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Не удалось загрузить статистику
              </p>
            )}
          </DialogContent>
        </Dialog>

        {/* Модальное окно начисления средств */}
        <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Начислить средства</DialogTitle>
              <DialogDescription>
                Партнер: {selectedPartner?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-amount">Сумма (EUR)</Label>
                <Input
                  id="add-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-description">Причина/Описание *</Label>
                <Input
                  id="add-description"
                  value={fundsDescription}
                  onChange={(e) => setFundsDescription(e.target.value)}
                  placeholder="Описание начисления"
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

        {/* Модальное окно списания средств */}
        <Dialog open={showRemoveFunds} onOpenChange={setShowRemoveFunds}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Списать средства</DialogTitle>
              <DialogDescription>
                Партнер: {selectedPartner?.name} (Баланс: {selectedPartner?.current_balance.toFixed(2)}€)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="remove-amount">Сумма (EUR)</Label>
                <Input
                  id="remove-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedPartner?.current_balance}
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remove-description">Причина/Описание *</Label>
                <Input
                  id="remove-description"
                  value={fundsDescription}
                  onChange={(e) => setFundsDescription(e.target.value)}
                  placeholder="Описание списания"
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

        {/* Модальное окно деталей запроса на вывод */}
        <Dialog open={showWithdrawalDetails} onOpenChange={setShowWithdrawalDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Детали запроса на вывод</DialogTitle>
              <DialogDescription>
                Партнер: {selectedWithdrawal?.partner_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Сумма</Label>
                <p className="text-lg font-bold">{selectedWithdrawal?.amount.toFixed(2)}€</p>
              </div>
              <div>
                <Label>Номер карты/счета</Label>
                <p className="text-sm">{selectedWithdrawal?.payment_details}</p>
              </div>
              {selectedWithdrawal?.telegram_tag && (
                <div>
                  <Label>Telegram</Label>
                  <p className="text-sm">{selectedWithdrawal.telegram_tag}</p>
                </div>
              )}
              <div>
                <Label>Статус</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedWithdrawal?.status || '')}
                </div>
              </div>
              {selectedWithdrawal?.processed_at && (
                <div>
                  <Label>Дата обработки</Label>
                  <p className="text-sm">
                    {format(new Date(selectedWithdrawal.processed_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                </div>
              )}
              {selectedWithdrawal?.admin_notes && (
                <div>
                  <Label>Заметки администратора</Label>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.admin_notes}</p>
                </div>
              )}
              {selectedWithdrawal?.status === 'pending' && (
                <div>
                  <Label>Заметки администратора</Label>
                  <Input
                    value={withdrawalNotes}
                    onChange={(e) => setWithdrawalNotes(e.target.value)}
                    placeholder="Добавить заметки (при отклонении обязательно)..."
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              {selectedWithdrawal?.status === 'pending' && (
                <>
                  <Button variant="outline" onClick={() => setShowWithdrawalDetails(false)}>
                    Отмена
                  </Button>
                  <Button variant="destructive" onClick={handleWithdrawalReject}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Отклонить
                  </Button>
                  <Button onClick={handleWithdrawalApprove}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Одобрить
                  </Button>
                </>
              )}
              {selectedWithdrawal?.status === 'approved' && (
                <>
                  <Button variant="outline" onClick={() => setShowWithdrawalDetails(false)}>
                    Закрыть
                  </Button>
                  <Button onClick={handleWithdrawalMarkPaid}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Пометить как выплачено
                  </Button>
                </>
              )}
              {selectedWithdrawal?.status !== 'pending' && selectedWithdrawal?.status !== 'approved' && (
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
