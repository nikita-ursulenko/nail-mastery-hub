import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Компонент для редиректа с /referral
 * Проверяет авторизацию и редиректит на /referral/login или /referral/dashboard
 */
export default function ReferralRedirect() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }

        // Verify user is a referral partner
        const { data: partner } = await supabase
          .from('referral_partners')
          .select('id, is_active')
          .eq('auth_user_id', session.user.id)
          .single();

        setIsAuthenticated(!!(partner && partner.is_active));
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/referral/dashboard" replace />;
  }

  return <Navigate to="/referral/login" replace />;
}
