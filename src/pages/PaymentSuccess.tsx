import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useUserAuth();
  const { trackPurchase } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [purchaseTracked, setPurchaseTracked] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Ждем, пока контекст загрузится
    if (authLoading) {
      return;
    }

    // Если user не загружен, ждем
    if (!user) {
      console.log('User not loaded yet, waiting...');
      const timeout = setTimeout(() => {
        if (!user) {
          navigate('/login');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }

    // Все готово, обрабатываем платеж
    if (sessionId) {
      checkPaymentStatus(sessionId);
    } else {
      setError('Сессия не найдена');
      setLoading(false);
    }
  }, [sessionId, user, authLoading, navigate]);

  const checkPaymentStatus = async (sessionIdParam: string) => {
    try {
      // Use Supabase Edge Function to verify payment
      const { data: status, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionIdParam }
      });

      if (error) throw error;

      setPaymentStatus(status.status);

      if (status.status === 'paid') {
        // Трекинг покупки (только один раз)
        if (!purchaseTracked && status.course && status.amount) {
          trackPurchase({
            transactionId: sessionIdParam,
            value: status.amount,
            currency: 'EUR',
            items: [{
              item_id: status.course.id?.toString() || sessionIdParam,
              item_name: status.course.title || 'Course',
              price: status.amount,
              quantity: 1,
            }],
          });
          setPurchaseTracked(true);
        }

        if (status.enrollmentActivated) {
          toast.success('Доступ к курсу активирован!');
          setLoading(false);
        } else {
          // Пытаемся еще раз через небольшую задержку
          setTimeout(async () => {
            try {
              const { data: retryStatus } = await supabase.functions.invoke('verify-payment', {
                body: { session_id: sessionIdParam }
              });
              if (retryStatus?.enrollmentActivated) {
                toast.success('Доступ к курсу активирован!');
              }
            } catch (retryErr) {
              console.error('Retry failed:', retryErr);
            }
            setLoading(false);
          }, 1500);
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      setError(err.message || 'Ошибка при проверке статуса платежа');
      setLoading(false);
    }
  };

  // Показываем загрузку, если контекст еще загружается или идет обработка платежа
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">
              {authLoading ? 'Проверка авторизации...' : 'Обработка платежа...'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Доступ к курсу будет активирован в течение нескольких секунд
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <XCircle className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-4 text-3xl font-bold">Ошибка</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <div className="mt-6 flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/courses')}>
                Вернуться к курсам
              </Button>
              <Button onClick={() => navigate('/dashboard/courses')}>
                Перейти к моим курсам
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-bold">Оплата успешна!</h1>
          <p className="mt-2 text-muted-foreground">
            {paymentStatus === 'paid'
              ? 'Доступ к курсу активирован. Вы можете начать обучение прямо сейчас!'
              : 'Платеж обрабатывается. Доступ будет активирован в ближайшее время.'}
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/courses')}>
              Вернуться к курсам
            </Button>
            <Button onClick={() => navigate('/dashboard/courses')}>
              Перейти к моим курсам
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

