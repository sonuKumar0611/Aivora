'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Bot } from '@/lib/api';

interface BotsResponse {
  data: { bots: Bot[] };
}

export function useBots() {
  const queryClient = useQueryClient();

  const { data: bots = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const { data } = await api.get<BotsResponse>('/bots');
      return data.data.bots;
    },
  });

  const createBot = useMutation({
    mutationFn: async (body: { name: string; description: string; tone: string }) => {
      const { data } = await api.post<{ data: { bot: Bot } }>('/bots', body);
      return data.data.bot;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bots'] }),
  });

  const updateBot = useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; description?: string; tone?: string }) => {
      const { data } = await api.put<{ data: { bot: Bot } }>(`/bots/${id}`, body);
      return data.data.bot;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bots'] }),
  });

  const deleteBot = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bots/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bots'] }),
  });

  return { bots, isLoading, isError, refetch, createBot, updateBot, deleteBot };
}

export function useBot(id: string | null) {
  const { data: bot, isLoading, isError, refetch } = useQuery({
    queryKey: ['bot', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<{ data: { bot: Bot } }>(`/bots/${id}`);
      return data.data.bot;
    },
    enabled: !!id,
  });
  return { bot, isLoading, isError, refetch };
}
