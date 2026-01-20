import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface Admin {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  admin: Admin | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (mounted) {
          setSession(session);
          if (session?.user?.email) {
            await checkAdminStatus(session.user.email);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error: any) {
        // If it's an AbortError, don't set loading to false yet
        // Let onAuthStateChange handle auth state initialization
        if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
          console.log('Session fetch aborted, onAuthStateChange will handle initialization');
          return;
        }
        console.error('Auth initialization error:', error);
        if (mounted) setIsLoading(false);
      }
    }

    initializeAuth();

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);

      if (session?.user?.email) {
        await checkAdminStatus(session.user.email);
      } else {
        setAdmin(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (email: string) => {
    // List of authorized admin emails
    const adminEmails = ['nik.urs@icloud.com', 'nikita.ursulenco@gmail.com'];

    if (adminEmails.includes(email)) {
      setAdmin({
        id: 1,
        email: email,
        name: 'Admin'
      });
    } else {
      // Not an admin, silently fail
      setAdmin(null);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    // State update happens in onAuthStateChange
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setAdmin(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        session,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

