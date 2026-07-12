'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AuthUser, Role } from '@/types';

type AuthValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: AuthUser | null }>('/auth/me').then((r) => r.user),
    staleTime: 60_000,
  });
  const user = data ?? null;

  const setUser = (u: AuthUser) => qc.setQueryData(['me'], u);

  const login = async (email: string, password: string) => {
    const { user } = await api.post<{ user: AuthUser }>('/auth/login', { email, password });
    setUser(user);
  };
  const register = async (input: { name: string; email: string; password: string }) => {
    const { user } = await api.post<{ user: AuthUser }>('/auth/register', input);
    setUser(user);
  };
  const logout = async () => {
    await api.post('/auth/logout');
    qc.setQueryData(['me'], null);
    qc.clear();
  };
  // Never leaks whether the email exists — always resolves with the same message.
  const forgotPassword = (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email });
  const resetPassword = async (token: string, password: string) => {
    const { user } = await api.post<{ user: AuthUser }>('/auth/reset-password', { token, password });
    setUser(user);
  };
  const hasRole = (...roles: Role[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, login, register, logout, forgotPassword, resetPassword, hasRole }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
