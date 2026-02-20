'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, type AuthData, type User } from '@/lib/api';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // null = not yet checked (avoid redirect before reading localStorage)
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(!!(typeof window !== 'undefined' && localStorage.getItem('aivora_token')));
  }, []);

  const tokenChecked = hasToken !== null;

  const { data: user, isLoading: queryLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { user: User } }>('/auth/me');
      return data.data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: hasToken === true,
  });

  const signup = useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data } = await api.post<{ data: AuthData }>('/auth/signup', body);
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('aivora_token', data.token);
      queryClient.setQueryData(['me'], data.user);
      router.push('/onboarding');
    },
  });

  const login = useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data } = await api.post<{ data: AuthData }>('/auth/login', body);
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('aivora_token', data.token);
      queryClient.setQueryData(['me'], data.user);
      router.push(data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
    },
  });

  const logout = () => {
    localStorage.removeItem('aivora_token');
    queryClient.clear();
    router.push('/login');
  };

  // Stay "loading" until we've read the token from localStorage; then while /auth/me is fetching
  const isLoading = !tokenChecked || (hasToken === true && queryLoading);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isError,
    signup,
    login,
    logout,
  };
}
