'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
}

export interface ConversationSession {
  id: string;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  tokenUsage: TokenUsage | null;
  sentiment: { positive: number; negative: number; neutral: number } | null;
}

export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  totalTokenUsage: TokenUsage;
  dailyUsage: { date: string; conversations: number }[];
  dailyTokenUsage: { date: string; totalTokens: number; promptTokens: number; completionTokens: number }[];
  sentimentDistribution: SentimentDistribution;
  sessions: ConversationSession[];
}

export function useAnalytics(botId: string | null) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', botId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!botId) {
        return {
          totalConversations: 0,
          totalMessages: 0,
          totalTokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          dailyUsage: [],
          dailyTokenUsage: [],
          sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
          sessions: [],
        };
      }
      const { data: res } = await api.get<{ data: AnalyticsData }>(`/analytics/${botId}`);
      return res.data;
    },
    enabled: !!botId,
  });
  return {
    totalConversations: data?.totalConversations ?? 0,
    totalMessages: data?.totalMessages ?? 0,
    totalTokenUsage: data?.totalTokenUsage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    dailyUsage: data?.dailyUsage ?? [],
    dailyTokenUsage: data?.dailyTokenUsage ?? [],
    sentimentDistribution: data?.sentimentDistribution ?? { positive: 0, negative: 0, neutral: 0 },
    sessions: data?.sessions ?? [],
    isLoading,
    isError,
    refetch,
  };
}
