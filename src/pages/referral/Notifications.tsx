import { useState, useEffect } from 'react';
import { ReferralLayout } from '@/components/referral/ReferralLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { maskEmailInText } from '@/utils/emailMask';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function ReferralNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('referral_notifications')
        .select('*')
        .eq('partner_auth_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      toast.error('Ошибка при загрузке уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('referral_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('partner_auth_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error: any) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('referral_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error('Ошибка при обновлении уведомления');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('referral_notifications')
        .update({ is_read: true })
        .eq('partner_auth_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Все уведомления отмечены как прочитанные');
    } catch (error: any) {
      toast.error('Ошибка при обновлении уведомлений');
    }
  };

  return (
    <ReferralLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Уведомления</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Всего уведомлений: {notifications.length}
              {unreadCount > 0 && (
                <span className="ml-2">
                  ({unreadCount} непрочитанных)
                </span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="w-full sm:w-auto">
              <CheckCheck className="h-4 w-4 mr-2" />
              Отметить все как прочитанные
            </Button>
          )}
        </div>

        {/* Список уведомлений */}
        <Card>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Загрузка уведомлений...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  У вас пока нет уведомлений
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg ${!notification.is_read ? 'bg-muted/50' : ''
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm md:text-base">{notification.title}</span>
                        {!notification.is_read && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">
                        {maskEmailInText(notification.message)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Отметить как прочитанное"
                        className="shrink-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ReferralLayout>
  );
}