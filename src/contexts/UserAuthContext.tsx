import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, UserLoginResponse, RegisterResponse } from '@/lib/api';

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
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем, есть ли сохраненный токен
    const token = localStorage.getItem('user_token');
    if (token) {
      verifyAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await api.userVerifyToken();
      if (response.valid && response.user) {
        setUser(response.user);
      } else {
        localStorage.removeItem('user_token');
      }
    } catch (error) {
      localStorage.removeItem('user_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response: UserLoginResponse = await api.userLogin(email, password);
      localStorage.setItem('user_token', response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const response: RegisterResponse = await api.userRegister({ email, password, name, phone });
      localStorage.setItem('user_token', response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user_token');
    setUser(null);
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

