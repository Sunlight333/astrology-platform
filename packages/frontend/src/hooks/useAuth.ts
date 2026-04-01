import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import type { User, LoginRequest, RegisterRequest } from '@star/shared';
import * as api from '../services/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await api.refreshToken();
      if (refreshed && !cancelled) {
        try {
          const me = await api.getMe();
          setUser(me);
        } catch {
          // ignore
        }
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const result = await api.login(data);
    setUser(result.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const result = await api.register(data);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    api.setAccessToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
