import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  avatar_upload_path?: string;
}

interface UserAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string, referral_code?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check current session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, phone, avatar_url, avatar_upload_path')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) throw error;
      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Ошибка входа');
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    referral_code?: string
  ) => {
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Не удалось создать аккаунт');

      // Step 2: Create user profile in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email,
          name,
          phone: phone || null,
        })
        .select('id, email, name, phone, avatar_url, avatar_upload_path')
        .single();

      if (userError) throw userError;

      // Step 3: Track referral if code provided
      if (referral_code && userData) {
        try {
          await supabase
            .from('referral_tracking')
            .insert({
              referral_code,
              user_id: userData.id,
              status: 'registered',
            });
        } catch (refError) {
          console.error('Failed to track referral:', refError);
          // Don't fail registration if referral tracking fails
        }
      }

      setUser(userData);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Ошибка регистрации');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}

