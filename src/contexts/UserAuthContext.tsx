import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string; // Changed from number to string (UUID from auth.users)
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
  loginWithGoogle: () => Promise<void>;
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

      const adminEmails = ['nik.urs@icloud.com', 'nikita.ursulenco@gmail.com'];
      if (session?.user?.email && adminEmails.includes(session.user.email)) {
        setUser(null);
        setIsLoading(false);
        return;
      }

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

      const adminEmails = ['nik.urs@icloud.com', 'nikita.ursulenco@gmail.com'];
      if (session?.user?.email && adminEmails.includes(session.user.email)) {
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        // Ignore abort errors but ensure loading state is cleared
        setIsLoading(false);
        return;
      }
      console.error('Session check failed:', error);
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Loading profile for:', authUser.email);

      // Use auth.users metadata directly instead of public.users table
      setUser({
        id: authUser.id, // Now UUID instead of integer
        email: authUser.email || '',
        name: authUser.user_metadata?.full_name
          || authUser.user_metadata?.name
          || authUser.email?.split('@')[0]
          || 'User',
        phone: authUser.user_metadata?.phone || authUser.phone || undefined,
        avatar_url: authUser.user_metadata?.picture
          || authUser.user_metadata?.avatar_url
          || undefined,
      });
    } catch (error: any) {
      // Ignore AbortError
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        console.log('Fetch aborted, ignoring');
        return;
      }

      console.error('Failed to load user profile:', error);
      // Fallback to auth data so checking isAuthenticated works
      setUser({
        id: authUser.id, // UUID from auth.users
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

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Ошибка входа через Google');
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
      // Create auth user with metadata (no need for public.users anymore)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
            phone: phone || null,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Не удалось создать аккаунт');

      // Track referral if code provided
      if (referral_code && authData.user) {
        try {
          await supabase
            .from('referral_tracking')
            .insert({
              referral_code,
              auth_user_id: authData.user.id, // Use auth_user_id instead of user_id
              status: 'registered',
            });
        } catch (refError) {
          console.error('Failed to track referral:', refError);
          // Don't fail registration if referral tracking fails
        }
      }

      // Set user from auth metadata
      setUser({
        id: authData.user.id,
        email: authData.user.email!,
        name: name,
        phone: phone,
      });
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
        loginWithGoogle,
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

