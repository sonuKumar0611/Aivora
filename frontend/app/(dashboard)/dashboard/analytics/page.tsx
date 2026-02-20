'use client';

import { useState } from 'react';
import { useBots } from '@/hooks/useBots';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { MessageSquare, MessageCircle, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { bots } = useBots();
  const [selectedBotId, setSelectedBotId] = useState('');
  const {
    totalConversations,
    totalMessages,
    dailyUsage,
    topKeywords,
    isLoading,
    isError,
    refetch,
  } = useAnalytics(selectedBotId || null);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Conversations, messages, and usage by bot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bot</label>
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 min-w-[200px]"
          >
            <option value="">Select a bot</option>
            {bots.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedBotId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">Select a bot to view analytics.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
          </Card>
        </>
      ) : isError ? (
        <Card>
          <CardContent className="py-12">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
                    <MessageCircle className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {totalConversations}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Total conversations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
                    <MessageSquare className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {totalMessages}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Total messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Daily usage</h2>
              <p className="text-sm text-zinc-500">Conversations per day (last 30 days)</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {dailyUsage.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyUsage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-zinc-500" />
                      <YAxis tick={{ fontSize: 12 }} className="text-zinc-500" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                      />
                      <Bar dataKey="conversations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Most asked topics</h2>
              <p className="text-sm text-zinc-500">Keyword frequency in messages</p>
            </CardHeader>
            <CardContent>
              {topKeywords.length === 0 ? (
                <p className="text-sm text-zinc-500">No keywords yet. Chat with your bot to see trends.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {topKeywords.map((k) => (
                    <li
                      key={k.word}
                      className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100"
                    >
                      <span className="font-medium">{k.word}</span>
                      <span className="ml-1 text-zinc-500 dark:text-zinc-400">({k.count})</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
