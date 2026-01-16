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
      console.log('Auth state change:', event, session?.user?.id);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
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
        await loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Loading profile for:', authUser.email);
      // Try to find user by email since we lack auth_user_id
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, phone, avatar_url, avatar_upload_path')
        .eq('email', authUser.email)
        .single();

      if (error) {
        console.error('Supabase fetch error:', error);
        // If user not found in public table but exists in Auth, we might need to handle it.
        // For now just stop loading.
        setUser({
          id: 0, // Placeholder
          email: authUser.email || '',
          name: authUser.user_metadata?.name || 'User',
          phone: authUser.phone
        });
      } else if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Fallback to auth data so checking isAuthenticated works
      setUser({
        id: 0,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || 'User'
      });
    } finally {
      setIsLoading(false);
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
        await loadUserProfile(data.user);
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
      // Note: we are NOT using auth_user_id as it doesn't exist in the table schema currently
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
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

