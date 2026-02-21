'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type IntegrationsResponse, type IntegrationProvider } from '@/lib/api';

/** Google integrations use OAuth; others use simple connect. */
export const OAUTH_PROVIDERS: IntegrationProvider[] = ['google_calendar', 'google_sheets'];

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

  /** For Google integrations: get OAuth URL and redirect. Call this instead of connect.mutate for OAUTH_PROVIDERS. */
  const connectWithOAuth = useMutation({
    mutationFn: async (provider: IntegrationProvider) => {
      const { data: res } = await api.get<{ data: { redirectUrl: string } }>(
        `/settings/integrations/${provider}/oauth`
      );
      if (typeof window !== 'undefined' && res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      }
      return res.data;
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
    connectWithOAuth,
    disconnect,
  };
}
