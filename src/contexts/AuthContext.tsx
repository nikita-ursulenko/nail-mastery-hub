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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        checkAdminStatus(session.user.email);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        checkAdminStatus(session.user.email);
      } else {
        setAdmin(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (email: string) => {
    // Hardcoded check to match RLS policies
    // This removes dependency on the 'admins' table
    if (email === 'nik.urs@icloud.com') {
      setAdmin({
        id: 1, // Dummy ID since we don't rely on DB table anymore for ID
        email: email,
        name: 'Admin'
      });
    } else {
      console.warn('User is not authorized as admin:', email);
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

