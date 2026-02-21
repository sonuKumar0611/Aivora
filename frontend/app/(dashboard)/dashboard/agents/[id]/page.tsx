'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBot, useBots } from '@/hooks/useBots';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TONE_OPTIONS, AGENT_TYPE_OPTIONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { formatConversationDate } from '@/lib/format';
import { ArrowLeft, Code, BookOpen, User, Settings, MessageSquare, BarChart3, MessageCircle, GitBranch, Coins, Smile, Frown, Meh, Calendar, Eye } from 'lucide-react';
import { TestChatPanel } from '@/components/dashboard/TestChatPanel';
import type { FlowDefinition } from '@/lib/flow';

const FlowBuilder = dynamic(
  () => import('@/components/flow/FlowBuilder').then((m) => m.FlowBuilder),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-[400px] text-brand-textMuted">Loading flow builder…</div> }
);
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type TabId = 'profile' | 'kb' | 'flow' | 'chat' | 'preview' | 'settings' | 'analytics';

export default function AgentEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { bot, isLoading, isError, refetch } = useBot(id);
  const { updateBot, deleteBot, publishBot } = useBots();
  const { sources, isLoading: sourcesLoading } = useKnowledge();
  const {
    totalConversations,
    totalMessages,
    totalTokenUsage,
    dailyUsage,
    dailyTokenUsage,
    sessions,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useAnalytics(id);
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'kb', 'flow', 'chat', 'preview', 'settings', 'analytics'].includes(tab)) {
      setActiveTab(tab as TabId);
    }
  }, [searchParams]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [botType, setBotType] = useState('support');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [origin, setOrigin] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description);
      setTone(bot.tone);
      setBotType(bot.botType ?? 'support');
      setSystemPrompt(bot.systemPrompt ?? '');
      setSelectedSourceIds(bot.assignedSourceIds ?? []);
    }
  }, [bot]);

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]
    );
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error('Name and business description are required');
      return;
    }
    updateBot.mutate(
      {
        id,
        name: name.trim(),
        description: description.trim(),
        tone,
        botType,
      },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const saveKb = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSourceIds.length === 0) {
      toast.error('Select at least one knowledge base');
      return;
    }
    updateBot.mutate(
      { id, assignedSourceIds: selectedSourceIds, systemPrompt: systemPrompt.trim() || undefined },
      {
        onSuccess: () => toast.success('Knowledge base updated'),
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handlePublish = () => {
    if (selectedSourceIds.length === 0) {
      toast.error('Select at least one knowledge base before publishing');
      return;
    }
    publishBot.mutate(id, {
      onSuccess: () => toast.success('Agent published'),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteBot.mutate(id, {
      onSuccess: () => {
        toast.success('Agent deleted');
        setDeleteModalOpen(false);
        router.push('/dashboard/agents');
      },
      onError: (err) => {
        toast.error(getErrorMessage(err));
      },
    });
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link href="/dashboard/agents" className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to agents
        </Link>
        <Card>
          <CardContent className="py-12">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !bot) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Link href="/dashboard/agents" className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to agents
        </Link>
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = bot.status ?? 'draft';
  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'kb', label: 'Knowledge base', icon: BookOpen },
    { id: 'flow', label: 'Flow', icon: GitBranch },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'chat', label: 'Test Chat', icon: MessageSquare },
    { id: 'preview', label: 'Preview script', icon: Code },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard/agents" className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to agents
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-brand-textHeading">{bot.name}</h1>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                status === 'published'
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        {status !== 'published' && (
          <Button
            onClick={handlePublish}
            disabled={publishBot.isPending || selectedSourceIds.length === 0}
            className="shrink-0"
          >
            {publishBot.isPending ? 'Publishing…' : 'Publish agent'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-brand-sidebar border border-brand-borderLight">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-bgCard text-brand-textHeading shadow-sm'
                  : 'text-brand-textMuted hover:text-brand-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-brand-textHeading">Agent profile</h2>
            <p className="text-sm text-brand-textMuted mt-2">Update agent name, type, and description.</p>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 pb-8">
            <form onSubmit={saveProfile} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-brand-text">Agent name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-brand-text">Agent type</label>
                  <select
                    value={botType}
                    onChange={(e) => setBotType(e.target.value)}
                    className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                  >
                    {AGENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text">Agent description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>
              <div className="max-w-xs space-y-2">
                <label className="block text-sm font-medium text-brand-text">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                >
                  {TONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-brand-borderLight">
                <Button type="submit" disabled={updateBot.isPending || !name.trim() || !description.trim()}>
                  {updateBot.isPending ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: KB */}
      {activeTab === 'kb' && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-brand-textHeading">Knowledge base</h2>
            <p className="text-sm text-brand-textMuted mt-2">Select at least one document and optionally add custom prompts.</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-8 pb-8">
            <form onSubmit={saveKb} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Knowledge base <span className="text-brand-error">*</span></label>
                {sourcesLoading ? (
                  <p className="text-sm text-brand-textMuted">Loading…</p>
                ) : sources.length === 0 ? (
                  <div className="rounded-lg border border-brand-borderLight bg-brand-sidebar/50 p-4 text-center">
                    <BookOpen className="w-8 h-8 mx-auto text-brand-textMuted mb-2" />
                    <p className="text-sm text-brand-textMuted">No documents in Knowledge Base yet.</p>
                    <Link href="/dashboard/knowledge" className="text-sm text-brand-primary hover:underline mt-1 inline-block">
                      Upload documents first →
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-lg border border-brand-borderLight bg-brand-sidebar max-h-48 overflow-y-auto space-y-2 p-2">
                    {sources.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-brand-bgCardHover rounded px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(s.id)}
                          onChange={() => toggleSource(s.id)}
                          className="rounded border-brand-borderLight text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="text-sm text-brand-text truncate flex-1">
                          {s.sourceMeta?.name || s.sourceMeta?.filename || s.sourceMeta?.url || s.sourceType}
                        </span>
                        <span className="text-xs text-brand-textMuted">{s.chunksCount} chunks</span>
                      </label>
                    ))}
                  </div>
                )}
                {sources.length > 0 && selectedSourceIds.length === 0 && (
                  <p className="text-xs text-brand-error mt-2">Select at least one knowledge base.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Agent prompt (optional)</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                  placeholder="Custom instructions for how the agent should respond when using this knowledge base..."
                />
              </div>
              <div className="pt-4 border-t border-brand-borderLight">
                <Button
                  type="submit"
                  disabled={updateBot.isPending || sources.length === 0 || selectedSourceIds.length === 0}
                >
                  {updateBot.isPending ? 'Saving…' : 'Update knowledge base'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Flow */}
      {activeTab === 'flow' && (
        <FlowBuilder
          initialFlow={bot?.flowDefinition as FlowDefinition | undefined}
          botType={botType}
          description={description}
          botId={id}
          onSave={(flow: FlowDefinition) => {
            updateBot.mutate(
              { id, flowDefinition: flow },
              {
                onSuccess: () => toast.success('Flow saved'),
                onError: (err) => toast.error(getErrorMessage(err)),
              }
            );
          }}
          isSaving={updateBot.isPending}
        />
      )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 rounded-xl" />
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
          ) : analyticsError ? (
            <Card>
              <CardContent className="py-12">
                <ErrorState onRetry={() => refetchAnalytics()} />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand-border p-3">
                        <MessageCircle className="w-6 h-6 text-brand-textMuted" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-brand-textHeading">
                          {totalConversations}
                        </p>
                        <p className="text-sm text-brand-textMuted">Total conversations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand-border p-3">
                        <MessageSquare className="w-6 h-6 text-brand-textMuted" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-brand-textHeading">
                          {totalMessages}
                        </p>
                        <p className="text-sm text-brand-textMuted">Total messages</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand-border p-3">
                        <Coins className="w-6 h-6 text-brand-textMuted" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-brand-textHeading">
                          {totalTokenUsage.totalTokens.toLocaleString()}
                        </p>
                        <p className="text-sm text-brand-textMuted">Token usage (this agent)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-brand-textHeading">Daily usage</h2>
                    <p className="text-sm text-brand-textMuted">Conversations per day (last 30 days)</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {dailyUsage.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-brand-textMuted text-sm">
                          No data yet
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyUsage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-brand-border" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-brand-textMuted" />
                            <YAxis tick={{ fontSize: 12 }} className="text-brand-textMuted" />
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
                    <h2 className="font-semibold text-brand-textHeading">Daily token usage</h2>
                    <p className="text-sm text-brand-textMuted">Tokens per day (last 30 days)</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {dailyTokenUsage.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-brand-textMuted text-sm">
                          No data yet
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyTokenUsage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-brand-border" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-brand-textMuted" />
                            <YAxis tick={{ fontSize: 12 }} className="text-brand-textMuted" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                            />
                            <Bar dataKey="totalTokens" name="Tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-brand-textHeading flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Conversation sessions
                  </h2>
                  <p className="text-sm text-brand-textMuted">Track recent chat sessions with this agent</p>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-brand-textMuted">No sessions yet. Conversations will appear here.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-brand-borderLight">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-brand-sidebar text-brand-textMuted">
                          <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Messages</th>
                            <th className="px-4 py-3 font-medium">Tokens</th>
                            <th className="px-4 py-3 font-medium">Sentiment</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-borderLight">
                          {sessions.map((s) => {
                            const dominant = s.sentiment
                              ? s.sentiment.positive >= s.sentiment.negative && s.sentiment.positive >= s.sentiment.neutral
                                ? 'positive'
                                : s.sentiment.negative >= s.sentiment.neutral
                                  ? 'negative'
                                  : 'neutral'
                              : null;
                            return (
                              <tr key={s.id} className="bg-brand-bgCard hover:bg-brand-border/50">
                                <td className="px-4 py-3 text-brand-text">
                                  {formatConversationDate(s.updatedAt)}
                                </td>
                                <td className="px-4 py-3 text-brand-text">{s.messageCount}</td>
                                <td className="px-4 py-3 text-brand-text">
                                  {s.tokenUsage?.totalTokens != null ? s.tokenUsage.totalTokens.toLocaleString() : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  {dominant === 'positive' && <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400"><Smile className="w-4 h-4" /> Positive</span>}
                                  {dominant === 'negative' && <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><Frown className="w-4 h-4" /> Negative</span>}
                                  {(dominant === 'neutral' || !dominant) && <span className="inline-flex items-center gap-1 text-brand-textMuted"><Meh className="w-4 h-4" /> Neutral</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Link
                                    href={`/dashboard/agents/${id}/conversations/${s.id}`}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md text-brand-primary hover:bg-brand-border"
                                    title="View conversation"
                                    aria-label="View conversation"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tab: Test Chat */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-[70vh]">
          <TestChatPanel preselectedAgentId={id} embedded />
        </div>
      )}

      {/* Tab: Preview */}
      {activeTab === 'preview' && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-brand-textHeading flex items-center gap-2">
              <Code className="w-4 h-4" /> Embed widget
            </h2>
            <p className="text-sm text-brand-textMuted mt-2">
              Add this script to your website. {status !== 'published' && 'Publish the agent for the script to work.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-8 pb-8">
            <pre className="rounded-lg bg-brand-border p-4 text-xs overflow-x-auto text-brand-text">
              {`<script src="${origin || ''}/widget.js" data-agent="${id}" data-api="${process.env.NEXT_PUBLIC_API_URL || ''}"></script>`}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const snippet = `<script src="${origin || ''}/widget.js" data-agent="${id}" data-api="${apiUrl}"></script>`;
                navigator.clipboard.writeText(snippet);
                toast.success('Copied to clipboard');
              }}
            >
              Copy embed code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-brand-textHeading">Execution</h2>
              <p className="text-sm text-brand-textMuted mt-2">
                {status === 'published'
                  ? 'When off, the agent will not respond and visitors will see that it is inactive.'
                  : 'Publish the agent to enable or disable execution.'}
              </p>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="execution-toggle"
                  className={`text-sm font-medium ${status !== 'published' ? 'text-brand-textMuted cursor-not-allowed' : 'text-brand-text cursor-pointer'}`}
                >
                  Allow agent to respond
                </label>
                <button
                  id="execution-toggle"
                  type="button"
                  role="switch"
                  aria-checked={bot?.isActive !== false}
                  disabled={status !== 'published' || updateBot.isPending}
                  onClick={() => {
                    if (status !== 'published') return;
                    const next = bot?.isActive === false;
                    updateBot.mutate(
                      { id, isActive: next },
                      {
                        onSuccess: () => toast.success(next ? 'Agent is now active' : 'Agent is now inactive'),
                        onError: (e) => toast.error(getErrorMessage(e)),
                      }
                    );
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border border-brand-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                    status !== 'published' ? 'bg-brand-borderLight' : (bot?.isActive !== false ? 'bg-brand-primary' : 'bg-brand-border')
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      bot?.isActive !== false ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                    style={{ marginTop: 2 }}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
              <p className="text-sm text-brand-textMuted mt-2">Irreversible actions for this agent.</p>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              <p className="text-sm text-brand-textMuted mb-4">
                Deleting this agent will remove its chat history. This cannot be undone.
              </p>
              <Button variant="danger" onClick={handleDelete} disabled={deleteBot.isPending}>
                {deleteBot.isPending ? 'Deleting…' : 'Delete agent'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete agent?"
        description="This will remove this agent and its chat history. This cannot be undone."
        confirmLabel="Delete agent"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteBot.isPending}
      />
    </div>
  );
}
