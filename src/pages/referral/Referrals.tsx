import { useState, useEffect } from 'react';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { maskEmail } from '@/utils/emailMask';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Referral {
  user_id: number;
  email: string;
  status: string;
  registered_at: string;
  total_purchases: number;
}

export default function ReferralReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      setIsLoading(true);
      const referralsData = await api.getReferralReferrals();
      setReferrals(referralsData.referrals || []);
    } catch (error: any) {
      console.error('Failed to load referrals:', error);
      toast.error('Ошибка при загрузке рефералов');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ReferralLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Загрузка рефералов...</p>
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
          <h1 className="text-3xl font-bold">Рефералы</h1>
          <p className="text-muted-foreground">
            Всего зарегистрировано: {referrals.length}
          </p>
        </div>

        {/* Список рефералов */}
        <Card>
          <CardHeader>
            <CardTitle>Список рефералов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Нет зарегистрированных рефералов
                </p>
              ) : (
                referrals.map((referral) => (
                  <div
                    key={referral.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{maskEmail(referral.email)}</span>
                        <Badge variant={referral.status === 'purchased' ? 'default' : 'secondary'}>
                          {referral.status === 'purchased' ? 'Купил' : 'Зарегистрировался'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(referral.registered_at), 'dd MMMM yyyy', { locale: ru })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {referral.total_purchases > 0 ? `${referral.total_purchases.toFixed(2)}€` : '-'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ReferralLayout>
  );
}