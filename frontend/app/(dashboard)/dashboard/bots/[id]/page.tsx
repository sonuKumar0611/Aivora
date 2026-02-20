'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBot, useBots } from '@/hooks/useBots';
import { useKnowledge } from '@/hooks/useKnowledge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TONE_OPTIONS, BOT_TYPE_OPTIONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { ArrowLeft, Code, BookOpen, User } from 'lucide-react';

type TabId = 'profile' | 'kb' | 'preview';

export default function BotEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { bot, isLoading, isError, refetch } = useBot(id);
  const { updateBot, deleteBot, publishBot } = useBots();
  const { sources, isLoading: sourcesLoading } = useKnowledge();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [botType, setBotType] = useState('support');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [origin, setOrigin] = useState('');

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
        systemPrompt: systemPrompt.trim() || undefined,
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
      onSuccess: () => toast.success('Bot published'),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const handleDelete = () => {
    if (!confirm('Delete this bot? This will remove its chat history.')) return;
    deleteBot.mutate(id, {
      onSuccess: () => {
        toast.success('Bot deleted');
        router.push('/dashboard/bots');
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link href="/dashboard/bots" className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to bots
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
      <div className="space-y-8 max-w-2xl animate-fade-in">
        <Link href="/dashboard/bots" className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to bots
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
    { id: 'preview', label: 'Preview script', icon: Code },
  ];

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard/bots" className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to bots
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
            {publishBot.isPending ? 'Publishing…' : 'Publish'}
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
          <CardHeader>
            <h2 className="font-semibold text-brand-textHeading">Bot profile</h2>
            <p className="text-sm text-brand-textMuted mt-1">Update name, type, prompt, and description.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Bot name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Bot type</label>
                <select
                  value={botType}
                  onChange={(e) => setBotType(e.target.value)}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                >
                  {BOT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Bot description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                >
                  {TONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={updateBot.isPending || !name.trim() || !description.trim()}>
                {updateBot.isPending ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: KB */}
      {activeTab === 'kb' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-brand-textHeading">Knowledge base</h2>
            <p className="text-sm text-brand-textMuted mt-1">Select at least one document and optionally add custom prompts.</p>
          </CardHeader>
          <CardContent>
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
                <label className="block text-sm font-medium text-brand-text mb-2">Bot prompt (optional)</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                  placeholder="Custom instructions for how the bot should respond when using this knowledge base..."
                />
              </div>
              <Button
                type="submit"
                disabled={updateBot.isPending || sources.length === 0 || selectedSourceIds.length === 0}
              >
                {updateBot.isPending ? 'Saving…' : 'Update knowledge base'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Preview */}
      {activeTab === 'preview' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-brand-textHeading flex items-center gap-2">
              <Code className="w-4 h-4" /> Embed widget
            </h2>
            <p className="text-sm text-brand-textMuted mt-1">
              Add this script to your website. {status !== 'published' && 'Publish the bot for the script to work.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="rounded-lg bg-brand-border p-4 text-xs overflow-x-auto text-brand-text">
              {`<script src="${origin || ''}/widget.js" data-bot="${id}" data-api="${process.env.NEXT_PUBLIC_API_URL || ''}"></script>`}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const snippet = `<script src="${origin || ''}/widget.js" data-bot="${id}" data-api="${apiUrl}"></script>`;
                navigator.clipboard.writeText(snippet);
                toast.success('Copied to clipboard');
              }}
            >
              Copy embed code
            </Button>
            {status !== 'published' && (
              <div className="pt-2 border-t border-brand-borderLight flex justify-end">
                <Button
                  onClick={handlePublish}
                  disabled={publishBot.isPending || selectedSourceIds.length === 0}
                >
                  {publishBot.isPending ? 'Publishing…' : 'Publish bot'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <h2 className="font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-brand-textMuted mb-4">
            Deleting this bot will remove its chat history. This cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDelete} disabled={deleteBot.isPending}>
            {deleteBot.isPending ? 'Deleting…' : 'Delete bot'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
