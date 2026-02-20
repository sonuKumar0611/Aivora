'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type IntegrationsResponse, type IntegrationProvider } from '@/lib/api';

export function useIntegrations(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data: res } = await api.get<{ data: IntegrationsResponse }>('/settings/integrations');
      return res.data;
    },
    enabled,
  });

  const connect = useMutation({
    mutationFn: async (provider: IntegrationProvider) => {
      const { data: res } = await api.post<{ data: { provider: string; connected: boolean } }>(
        `/settings/integrations/${provider}/connect`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const disconnect = useMutation({
    mutationFn: async (provider: IntegrationProvider) => {
      await api.delete(`/settings/integrations/${provider}/disconnect`);
      return { provider };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  return {
    categories: data?.categories ?? [],
    isLoading,
    isError,
    refetch,
    connect,
    disconnect,
  };
}
