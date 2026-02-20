'use client';

import { useMutation } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';

export interface SendMessageParams {
  botId: string;
  message: string;
  conversationId?: string;
}

export interface SendMessageResult {
  reply: string;
  conversationId: string;
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async ({ botId, message, conversationId }: SendMessageParams): Promise<SendMessageResult> => {
      const apiUrl = getApiUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('aivora_token') : null;
      const res = await fetch(`${apiUrl}/api/chat/${botId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Send failed');
      return data.data;
    },
  });
}
