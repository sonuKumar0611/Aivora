'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBot } from '@/hooks/useBots';
import { useKnowledge } from '@/hooks/useKnowledge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { BookOpen, FileText, Link as LinkIcon, Type, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getErrorMessage } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { KnowledgeSource } from '@/hooks/useKnowledge';

function sourceColumns(): { id: string; label: string; render: (row: KnowledgeSource) => React.ReactNode }[] {
  return [
    {
      id: 'type',
      label: 'Type',
      render: (row) => <span className="capitalize font-medium text-brand-textHeading">{row.sourceType}</span>,
    },
    {
      id: 'name',
      label: 'Name / URL',
      render: (row) => (
        <span className="text-brand-text truncate max-w-[280px] block" title={row.sourceMeta?.filename || row.sourceMeta?.url || ''}>
          {row.sourceMeta?.filename || row.sourceMeta?.url || '—'}
        </span>
      ),
    },
    {
      id: 'chunks',
      label: 'Chunks',
      render: (row) => <span className="text-brand-textMuted tabular-nums">{row.chunksCount}</span>,
    },
  ];
}

export default function BotKnowledgePage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.botId as string;

  const { bot, isLoading: botLoading, isError: botError } = useBot(botId);
  const { sources, isLoading: sourcesLoading, isError: sourcesError, refetch, deleteSource } = useKnowledge(botId);

  const [tab, setTab] = useState<'pdf' | 'text' | 'url'>('pdf');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);
    try {
      const API_URL = getApiUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('aivora_token') : null;
      if (tab === 'pdf' && file) {
        const form = new FormData();
        form.append('botId', botId);
        form.append('file', file);
        const res = await fetch(`${API_URL}/api/knowledge/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        toast.success(`Uploaded ${data.data.chunksCount} chunks`);
        setFile(null);
      } else if (tab === 'text' && text.trim()) {
        const res = await fetch(`${API_URL}/api/knowledge/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ botId, type: 'text', text: text.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        toast.success(`Uploaded ${data.data.chunksCount} chunks`);
        setText('');
      } else if (tab === 'url' && url.trim()) {
        const res = await fetch(`${API_URL}/api/knowledge/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ botId, type: 'url', url: url.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        toast.success(`Uploaded ${data.data.chunksCount} chunks`);
        setUrl('');
      } else {
        toast.error(tab === 'pdf' ? 'Select a PDF file' : tab === 'text' ? 'Enter some text' : 'Enter a URL');
        setUploading(false);
        return;
      }
      refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSource = (row: KnowledgeSource) => {
    const name = row.sourceMeta?.filename || row.sourceMeta?.url || row.sourceType;
    if (!confirm(`Delete "${name}"? This will remove all chunks for this source.`)) return;
    deleteSource.mutate(
      { botId, sourceId: row.sourceId },
      {
        onSuccess: () => toast.success('Source deleted'),
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  if (botLoading || !bot) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (botError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link href="/dashboard/knowledge" className="inline-flex items-center gap-2 text-sm text-brand-textMuted hover:text-brand-text">
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </Link>
        <Card>
          <CardContent className="py-12">
            <ErrorState message="Bot not found" onRetry={() => router.refresh()} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/knowledge"
            className="inline-flex items-center gap-2 text-sm text-brand-textMuted hover:text-brand-text mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
          </Link>
          <h1 className="text-2xl font-semibold text-brand-textHeading">Knowledge for {bot.name}</h1>
          <p className="mt-1 text-sm text-brand-textMuted">
            Upload PDFs, text, or URLs and manage sources for this bot.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-textHeading">Add knowledge</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 border-b border-brand-border pb-2">
            {(['pdf', 'text', 'url'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                  tab === t ? 'bg-brand-divider text-brand-textHeading' : 'text-brand-textMuted hover:text-brand-text'
                }`}
              >
                {t === 'pdf' && <FileText className="w-4 h-4" />}
                {t === 'text' && <Type className="w-4 h-4" />}
                {t === 'url' && <LinkIcon className="w-4 h-4" />}
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          {tab === 'pdf' && (
            <div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-brand-textMuted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-border file:text-brand-text"
              />
            </div>
          )}
          {tab === 'text' && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Paste or type content here..."
              className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text placeholder-brand-textDisabled focus:ring-2 focus:ring-brand-primary"
            />
          )}
          {tab === 'url' && (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text placeholder-brand-textDisabled focus:ring-2 focus:ring-brand-primary"
            />
          )}
          <Button onClick={handleUpload} disabled={uploading} className="transition-all">
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </CardContent>
      </Card>

      {sourcesError ? (
        <Card>
          <CardContent className="py-8">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : (
        <DataTable<KnowledgeSource>
          title="Sources"
          description="Uploaded documents and URLs for this bot."
          searchPlaceholder="Search sources..."
          columns={sourceColumns()}
          data={sources}
          getRowId={(row) => row.sourceId}
          getSearchableText={(row) => `${row.sourceType} ${row.sourceMeta?.filename ?? ''} ${row.sourceMeta?.url ?? ''}`}
          isLoading={sourcesLoading}
          emptyMessage={
            <EmptyState
              icon={<BookOpen className="w-10 h-10 mx-auto" />}
              title="No knowledge yet"
              description="Upload a PDF, paste text, or add a URL above to train this bot."
            />
          }
          actions={{
            onView: (row) =>
              toast.success(`Source: ${row.sourceMeta?.filename || row.sourceMeta?.url || row.sourceType}`),
            onEdit: () => toast('Edit metadata coming soon', { icon: '📝' }),
            onDelete: handleDeleteSource,
          }}
        />
      )}
    </div>
  );
}
