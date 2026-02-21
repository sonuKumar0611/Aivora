'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, MessageSquare, Smile, Frown, Meh } from 'lucide-react';
import { formatConversationDate } from '@/lib/format';

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface ConversationData {
  messages: Message[];
  sentiment: { positive: number; negative: number; neutral: number } | null;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
}

function toPercent(value: number): number {
  const p = Math.round(value * 100);
  return Math.min(100, Math.max(0, p));
}

export default function ConversationViewPage() {
  const params = useParams();
  const id = params.id as string;
  const conversationId = params.conversationId as string;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['conversation', id, conversationId],
    queryFn: async (): Promise<ConversationData> => {
      const { data: res } = await api.get<{ data: ConversationData }>(
        `/chat/${id}/conversations/${conversationId}`
      );
      return res.data;
    },
    enabled: !!id && !!conversationId,
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link
          href={`/dashboard/agents/${id}?tab=analytics`}
          className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to agent
        </Link>
        <Card>
          <CardContent className="py-12">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link
          href={`/dashboard/agents/${id}?tab=analytics`}
          className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to agent
        </Link>
        <Card>
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { messages, sentiment, tokenUsage } = data;
  const posPct = sentiment ? toPercent(sentiment.positive) : 0;
  const negPct = sentiment ? toPercent(sentiment.negative) : 0;
  const neuPct = sentiment ? toPercent(sentiment.neutral) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/agents/${id}?tab=analytics`}
            className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to agent Analytics
          </Link>
          <h1 className="text-2xl font-semibold text-brand-textHeading flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Conversation (read-only)
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-textHeading">Sentiment scores for this session</h2>
          <p className="text-sm text-brand-textMuted">Positive, negative and neutral as a percentage of this conversation</p>
        </CardHeader>
        <CardContent>
          {sentiment ? (
            <>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Smile className="w-4 h-4" /> Positive <strong>{posPct}%</strong>
                </span>
                <span className="text-brand-textMuted">·</span>
                <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Frown className="w-4 h-4" /> Negative <strong>{negPct}%</strong>
                </span>
                <span className="text-brand-textMuted">·</span>
                <span className="inline-flex items-center gap-2 text-brand-textMuted">
                  <Meh className="w-4 h-4" /> Neutral <strong>{neuPct}%</strong>
                </span>
              </div>
              {tokenUsage?.totalTokens != null && (
                <p className="text-sm text-brand-textMuted mt-3">
                  Token usage: {tokenUsage.totalTokens.toLocaleString()} tokens
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-brand-textMuted">No sentiment data for this conversation.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-textHeading">Messages</h2>
          <p className="text-sm text-brand-textMuted">{messages.length} messages in this session</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-brand-textMuted">No messages in this conversation.</p>
          ) : (
            <ul className="space-y-4">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      m.role === 'user'
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-border border border-brand-borderLight text-brand-text'
                    }`}
                  >
                    <p className="text-xs font-medium opacity-80 mb-1 capitalize">{m.role}</p>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    {m.timestamp && (
                      <p className="text-xs opacity-70 mt-1">
                        {formatConversationDate(m.timestamp)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
