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
import { TONE_OPTIONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { ArrowLeft, Code, BookOpen } from 'lucide-react';

export default function BotEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { bot, isLoading, isError, refetch } = useBot(id);
  const { updateBot, deleteBot } = useBots();
  const { sources, isLoading: sourcesLoading } = useKnowledge();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
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
      setSelectedSourceIds(bot.assignedSourceIds ?? []);
    }
  }, [bot]);

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSourceIds.length === 0) {
      toast.error('Select at least one knowledge base');
      return;
    }
    updateBot.mutate(
      { id, name, description, tone, assignedSourceIds: selectedSourceIds },
      {
        onSuccess: () => toast.success('Bot updated'),
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Delete this bot? This will remove its knowledge base and chat history.')) return;
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

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in">
      <div>
        <Link href="/dashboard/bots" className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to bots
        </Link>
        <h1 className="text-2xl font-semibold text-brand-textHeading">Edit bot</h1>
        <p className="mt-1 text-sm text-brand-textMuted">{bot.name}</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-textHeading">Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">
                Business description
              </label>
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
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">
                Knowledge base <span className="text-brand-error">*</span>
              </label>
              <p className="text-xs text-brand-textMuted mb-2">Select at least one document this bot will use.</p>
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
                <div className="rounded-lg border border-brand-borderLight bg-brand-sidebar max-h-40 overflow-y-auto space-y-2 p-2">
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
                        {s.sourceMeta?.filename || s.sourceMeta?.url || s.sourceType}
                      </span>
                      <span className="text-xs text-brand-textMuted">{s.chunksCount} chunks</span>
                    </label>
                  ))}
                </div>
              )}
              {sources.length > 0 && selectedSourceIds.length === 0 && (
                <p className="text-xs text-brand-error mt-1">Select at least one knowledge base.</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={updateBot.isPending || sources.length === 0 || selectedSourceIds.length === 0}
              >
                {updateBot.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Link href="/dashboard/bots">
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-textHeading flex items-center gap-2">
            <Code className="w-4 h-4" /> Embed widget
          </h2>
          <p className="text-sm text-brand-textMuted mt-1">
            Add this script to your website to show the chat widget. Replace the API URL with your backend URL if different.
          </p>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-brand-border p-4 text-xs overflow-x-auto text-brand-text">
            {`<script src="${origin || 'https://your-app.vercel.app'}/widget.js" data-bot="${id}" data-api="${process.env.NEXT_PUBLIC_API_URL || 'https://your-api.onrender.com'}"></script>`}
          </pre>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.onrender.com';
              const snippet = `<script src="${origin || 'https://your-app.vercel.app'}/widget.js" data-bot="${id}" data-api="${apiUrl}"></script>`;
              navigator.clipboard.writeText(snippet);
              toast.success('Copied to clipboard');
            }}
          >
            Copy embed code
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <h2 className="font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-brand-textMuted mb-4">
            Deleting this bot will remove its chat history. Assigned knowledge documents stay in Knowledge Base. This cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDelete} disabled={deleteBot.isPending}>
            {deleteBot.isPending ? 'Deleting…' : 'Delete bot'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
