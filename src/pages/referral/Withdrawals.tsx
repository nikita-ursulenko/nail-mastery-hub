import { useState, useEffect } from 'react';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Withdrawal {
  id: number;
  amount: number;
  payment_details: string;
  telegram_tag: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

interface DashboardStats {
  stats: {
    balance: {
      current_balance: number;
    };
  };
}

export default function ReferralWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Форма запроса на вывод
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPaymentDetails, setWithdrawalPaymentDetails] = useState('');
  const [withdrawalTelegram, setWithdrawalTelegram] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [withdrawalsData, statsData] = await Promise.all([
        api.getReferralWithdrawals(),
        api.getReferralDashboardStats(),
      ]);
      setWithdrawals(withdrawalsData.withdrawals || []);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
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
      await api.requestReferralWithdrawal({
        amount,
        payment_details: withdrawalPaymentDetails.trim(),
        telegram_tag: withdrawalTelegram.trim() || undefined,
      });
      
      toast.success('Запрос на вывод создан');
      setWithdrawalAmount('');
      setWithdrawalPaymentDetails('');
      setWithdrawalTelegram('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании запроса');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
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

  return (
    <ReferralLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Выплаты</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Доступно к выводу: {stats?.stats.balance.current_balance.toFixed(2) || '0.00'}€
          </p>
        </div>

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">История запросов</TabsTrigger>
            <TabsTrigger value="request">Запросить вывод</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">История запросов на вывод</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {withdrawals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Нет запросов на вывод
                    </p>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm md:text-base">{withdrawal.amount.toFixed(2)}€</span>
                            {getStatusBadge(withdrawal.status)}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">
                            {withdrawal.payment_details}
                          </p>
                          {withdrawal.telegram_tag && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Telegram: {withdrawal.telegram_tag}
                            </p>
                          )}
                          {withdrawal.admin_notes && (
                            <p className="text-xs text-muted-foreground mt-1 break-words">
                              Примечание: {withdrawal.admin_notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(withdrawal.requested_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="request" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Запрос на вывод средств</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Сумма (EUR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={stats?.stats.balance.current_balance}
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      disabled={isSubmittingWithdrawal}
                    />
                    <p className="text-xs text-muted-foreground">
                      Доступно к выводу: {stats?.stats.balance.current_balance.toFixed(2) || '0.00'}€
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_details">Номер карты/счета *</Label>
                    <Input
                      id="payment_details"
                      type="text"
                      value={withdrawalPaymentDetails}
                      onChange={(e) => setWithdrawalPaymentDetails(e.target.value)}
                      placeholder="Номер карты или IBAN"
                      required
                      disabled={isSubmittingWithdrawal}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram">Telegram тег (опционально)</Label>
                    <Input
                      id="telegram"
                      type="text"
                      value={withdrawalTelegram}
                      onChange={(e) => setWithdrawalTelegram(e.target.value)}
                      placeholder="@username"
                      disabled={isSubmittingWithdrawal}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmittingWithdrawal} className="w-full">
                    {isSubmittingWithdrawal ? 'Отправка...' : 'Отправить запрос'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ReferralLayout>
  );
}