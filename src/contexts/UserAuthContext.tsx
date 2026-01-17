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

      // Skip if this is admin email (handled by AuthContext)
      if (session?.user?.email === 'nik.urs@icloud.com') {
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

      // Skip if this is admin email (handled by AuthContext)
      if (session?.user?.email === 'nik.urs@icloud.com') {
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
      // Try to find user by email since we lack auth_user_id
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, phone, avatar_url, avatar_upload_path')
        .eq('email', authUser.email)
        .single();

      if (error) {
        // Ignore AbortError
        if (error.code === 'PGRST000' || error.message?.includes('AbortError')) {
          console.log('Fetch aborted, ignoring');
          return;
        }

        // If user not found (PGRST116), create one automatically (likely OAuth)
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating new profile for:', authUser.email);

          const newProfile = {
            email: authUser.email!,
            name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
            phone: authUser.phone || null,
            // We can add avatar_url from metadata if available
            avatar_url: authUser.user_metadata?.avatar_url || null
          };

          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Failed to create user profile:', createError);
          } else if (createdUser) {
            setUser(createdUser);
            return;
          }
        }

        console.error('Supabase fetch error:', error);
        // Fail gracefully
        setUser({
          id: 0,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || 'User',
          phone: authUser.phone
        });
      } else if (data) {
        setUser(data);
      }
    } catch (error: any) {
      // Ignore AbortError generic catch
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        console.log('Fetch aborted, ignoring');
        return;
      }

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

