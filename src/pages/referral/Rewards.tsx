import { useState, useEffect } from 'react';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Reward {
  id: number;
  reward_type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

export default function ReferralRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Фильтры
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadRewards();
  }, [currentPage, typeFilter, statusFilter]);

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      if (typeFilter !== 'all') {
        params.reward_type = typeFilter;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const { data, error } = await supabase.functions.invoke('referral-rewards', {
        body: params
      });

      if (error) throw error;
      setRewards(data?.rewards || []);
      setTotal(data?.total || 0);
    } catch (error: any) {
      console.error('Failed to load rewards:', error);
      toast.error('Ошибка при загрузке начислений');
    } finally {
      setIsLoading(false);
    }
  };

  const getRewardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      visit: 'Посещение',
      registration: 'Регистрация',
      purchase: 'Покупка',
      manual_add: 'Ручное начисление',
      manual_remove: 'Ручное списание',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      paid: 'default',
      rejected: 'destructive',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      pending: 'В обработке',
      approved: 'Одобрено',
      paid: 'Выплачено',
      rejected: 'Отклонено',
      cancelled: 'Отменено',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <ReferralLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">История начислений</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Всего начислений: {total}
          </p>
        </div>

        {/* Фильтры */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Тип начисления</label>
                <Select value={typeFilter} onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="visit">Посещение</SelectItem>
                    <SelectItem value="registration">Регистрация</SelectItem>
                    <SelectItem value="purchase">Покупка</SelectItem>
                    <SelectItem value="manual_add">Ручное начисление</SelectItem>
                    <SelectItem value="manual_remove">Ручное списание</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Статус</label>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="pending">В обработке</SelectItem>
                    <SelectItem value="approved">Одобрено</SelectItem>
                    <SelectItem value="paid">Выплачено</SelectItem>
                    <SelectItem value="rejected">Отклонено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список начислений */}
        <Card>
          <CardHeader>
            <CardTitle>Начисления</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Загрузка начислений...</p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  Начисления не найдены
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-medium text-sm md:text-base">
                            {getRewardTypeLabel(reward.reward_type)}
                          </span>
                          {getStatusBadge(reward.status)}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-1 break-words">
                          {reward.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(reward.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right ml-0 sm:ml-4 shrink-0">
                        <div className={`font-bold text-base md:text-lg ${reward.reward_type === 'manual_remove' ? 'text-destructive' : 'text-green-600'
                          }`}>
                          {reward.reward_type === 'manual_remove' ? '-' : '+'}
                          {reward.amount.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Страница {currentPage} из {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Назад
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Вперед
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ReferralLayout>
  );
}
