'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface KnowledgeSource {
  sourceId: string;
  sourceType: string;
  sourceMeta?: { filename?: string; url?: string };
  chunksCount: number;
}

export function useKnowledge(botId: string | null) {
  const queryClient = useQueryClient();
  const { data: sources = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['knowledge', botId],
    queryFn: async (): Promise<KnowledgeSource[]> => {
      if (!botId) return [];
      const { data } = await api.get<{ data: { sources: KnowledgeSource[] } }>(`/knowledge/${botId}`);
      return data.data.sources;
    },
    enabled: !!botId,
  });

  const deleteSource = useMutation({
    mutationFn: async ({ botId, sourceId }: { botId: string; sourceId: string }) => {
      await api.delete(`/knowledge/${botId}/source/${sourceId}`);
    },
    onSuccess: (_, { botId }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', botId] });
    },
  });

  return { sources, isLoading, isError, refetch, deleteSource };
}
