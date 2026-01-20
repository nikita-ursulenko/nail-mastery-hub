import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ProtectedReferralRouteProps {
  children: React.ReactNode;
}

// Helper function to generate unique referral code
const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export function ProtectedReferralRoute({ children }: ProtectedReferralRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if user has partner metadata
        const isPartner = session.user.user_metadata?.is_partner === true;
        const hasReferralCode = !!session.user.user_metadata?.referral_code;

        // If not a partner yet, auto-create partner status
        if (!isPartner || !hasReferralCode) {
          console.log('Setting up partner status for', session.user.email);

          // Generate unique referral code
          const referralCode = generateReferralCode();

          // Update user metadata to make them a partner
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              ...session.user.user_metadata,
              is_partner: true,
              referral_code: referralCode,
              partner_level: 'novice',
            }
          });

          if (updateError) {
            console.error('Failed to set partner status:', updateError);
            setIsAuthenticated(false);
          } else {
            console.log('Partner status set successfully');
            setIsAuthenticated(true);
          }
        } else {
          // Already a partner
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/referral/login" replace />;
  }

  return <>{children}</>;
}
