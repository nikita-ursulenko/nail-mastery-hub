import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useUserAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Ждем, пока контекст загрузится
    if (authLoading) {
      return;
    }

    // Проверяем токен напрямую из localStorage
    const token = localStorage.getItem('user_token');
    
    // Если нет токена, перенаправляем на логин
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    // Если токен есть, но user еще не загружен, ждем немного
    if (!user) {
      console.log('Token exists but user not loaded, waiting...');
      const timeout = setTimeout(() => {
        const retryUser = localStorage.getItem('user_token');
        if (!retryUser) {
          navigate('/login');
        } else {
          // Токен есть, но user не загрузился - возможно проблема с API
          // Продолжаем обработку платежа, API сам проверит токен
          if (sessionId) {
            checkPaymentStatus(sessionId);
          } else {
            setError('Сессия не найдена');
            setLoading(false);
          }
        }
      }, 1000);
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
      // Проверяем статус и активируем доступ, если нужно
      const status = await api.getPaymentStatus(sessionIdParam);
      setPaymentStatus(status.status);

      if (status.status === 'paid') {
        if (status.enrollmentActivated) {
          // Доступ активирован, показываем успех
          toast.success('Доступ к курсу активирован!');
          setLoading(false);
        } else {
          // Пытаемся еще раз через небольшую задержку
          setTimeout(async () => {
            try {
              const retryStatus = await api.getPaymentStatus(sessionIdParam);
              if (retryStatus.enrollmentActivated) {
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

