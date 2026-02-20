'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, type AuthData, type User } from '@/lib/api';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!(typeof window !== 'undefined' && localStorage.getItem('aivora_token')));
  }, []);

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { user: User } }>('/auth/me');
      return data.data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: hasToken,
  });

  const signup = useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data } = await api.post<{ data: AuthData }>('/auth/signup', body);
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('aivora_token', data.token);
      queryClient.setQueryData(['me'], data.user);
      router.push('/dashboard');
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
      router.push('/dashboard');
    },
  });

  const logout = () => {
    localStorage.removeItem('aivora_token');
    queryClient.clear();
    router.push('/login');
  };

  return {
    user,
    isLoading: hasToken ? isLoading : false,
    isAuthenticated: !!user,
    isError,
    signup,
    login,
    logout,
  };
}
