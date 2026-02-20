'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiUrl } from '@/lib/api';

export interface AssignedBot {
  id: string;
  name: string;
}

export interface KnowledgeSource {
  id: string;
  sourceType: string;
  sourceMeta?: { name?: string; filename?: string; url?: string };
  chunksCount: number;
  createdAt: string;
  assignedBots: AssignedBot[];
}

export function useKnowledge() {
  const queryClient = useQueryClient();
  const { data: sources = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['knowledge'],
    queryFn: async (): Promise<KnowledgeSource[]> => {
      const { data } = await api.get<{ data: { sources: KnowledgeSource[] } }>('/knowledge');
      return data.data.sources;
    },
  });

  const uploadSource = useMutation({
    mutationFn: async (
      payload:
        | { type: 'pdf'; file: File; name: string }
        | { type: 'text'; text: string; name: string }
        | { type: 'url'; url: string; name: string }
    ) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aivora_token') : null;
      const API_URL = getApiUrl();
      if (payload.type === 'pdf') {
        const form = new FormData();
        form.append('file', payload.file);
        form.append('name', payload.name);
        const res = await fetch(`${API_URL}/api/knowledge/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        return data;
      }
      const body =
        payload.type === 'text'
          ? { type: 'text', text: payload.text, name: payload.name }
          : { type: 'url', url: payload.url, name: payload.name };
      const { data } = await api.post<{ data: { source: KnowledgeSource } }>('/knowledge/upload', body);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge'] }),
  });

  const deleteSource = useMutation({
    mutationFn: async (sourceId: string) => {
      await api.delete(`/knowledge/source/${sourceId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge'] }),
  });

  return { sources, isLoading, isError, refetch, uploadSource, deleteSource };
}
