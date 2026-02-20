'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  dailyUsage: { date: string; conversations: number }[];
  topKeywords: { word: string; count: number }[];
}

export function useAnalytics(botId: string | null) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', botId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!botId) return { totalConversations: 0, totalMessages: 0, dailyUsage: [], topKeywords: [] };
      const { data: res } = await api.get<{ data: AnalyticsData }>(`/analytics/${botId}`);
      return res.data;
    },
    enabled: !!botId,
  });
  return {
    totalConversations: data?.totalConversations ?? 0,
    totalMessages: data?.totalMessages ?? 0,
    dailyUsage: data?.dailyUsage ?? [],
    topKeywords: data?.topKeywords ?? [],
    isLoading,
    isError,
    refetch,
  };
}
