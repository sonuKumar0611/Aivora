'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type AgentTool, type AgentToolType } from '@/lib/api';

interface ToolsResponse {
  data: { tools: AgentTool[] };
}

interface ToolResponse {
  data: { tool: AgentTool };
}

export function useTools(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  const { data: tools = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { data } = await api.get<ToolsResponse>('/tools');
      return data.data.tools;
    },
    enabled,
  });

  const createTool = useMutation({
    mutationFn: async (body: {
      name: string;
      description?: string;
      type: AgentToolType;
      config?: Record<string, unknown>;
    }) => {
      const { data } = await api.post<ToolResponse>('/tools', body);
      return data.data.tool;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const updateTool = useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      description?: string;
      type?: AgentToolType;
      config?: Record<string, unknown>;
    }) => {
      const { data } = await api.put<ToolResponse>(`/tools/${id}`, body);
      return data.data.tool;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const deleteTool = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  return {
    tools,
    isLoading,
    isError,
    refetch,
    createTool,
    updateTool,
    deleteTool,
  };
}
