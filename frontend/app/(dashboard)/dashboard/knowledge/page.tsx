'use client';

import { useState } from 'react';
import { useBots } from '@/hooks/useBots';
import { useKnowledge } from '@/hooks/useKnowledge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, FileText, Link as LinkIcon, Type } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl, getErrorMessage } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export default function KnowledgePage() {
  const { bots } = useBots();
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const { sources, isLoading, isError, refetch } = useKnowledge(selectedBotId || null);
  const [tab, setTab] = useState<'pdf' | 'text' | 'url'>('pdf');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedBotId) {
      toast.error('Select a bot first');
      return;
    }
    setUploading(true);
    try {
      const API_URL = getApiUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('aivora_token') : null;
      if (tab === 'pdf' && file) {
        const form = new FormData();
        form.append('botId', selectedBotId);
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
          body: JSON.stringify({ botId: selectedBotId, type: 'text', text: text.trim() }),
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
          body: JSON.stringify({ botId: selectedBotId, type: 'url', url: url.trim() }),
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-brand-textHeading">Knowledge Base</h1>
        <p className="mt-1 text-sm text-brand-textMuted">
          Upload PDFs, text, or URLs to train your bots
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium text-brand-text">Bot</label>
        <select
          value={selectedBotId}
          onChange={(e) => setSelectedBotId(e.target.value)}
          className="rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text min-w-[200px] focus:ring-2 focus:ring-brand-primary"
        >
          <option value="">Select a bot</option>
          {bots.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {selectedBotId && (
        <>
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      tab === t
                        ? 'bg-brand-divider text-brand-textHeading'
                        : 'text-brand-textMuted hover:text-brand-text'
                    }`}
                  >
                    {t === 'pdf' && <FileText className="w-4 h-4 inline mr-1" />}
                    {t === 'text' && <Type className="w-4 h-4 inline mr-1" />}
                    {t === 'url' && <LinkIcon className="w-4 h-4 inline mr-1" />}
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

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <h2 className="font-semibold text-brand-textHeading">Sources</h2>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState onRetry={() => refetch()} />
              ) : sources.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="w-12 h-12" />}
                  title="No knowledge yet"
                  description="Upload a PDF, paste text, or add a URL above to train this bot."
                />
              ) : (
                <ul className="space-y-2">
                  {sources.map((s) => (
                    <li
                      key={s.sourceId}
                      className="flex items-center justify-between rounded-xl border border-brand-border p-3 transition-colors hover:bg-brand-bgCardHover animate-in"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium capitalize">{s.sourceType}</span>
                        {s.sourceMeta?.filename && (
                          <span className="text-sm text-brand-textMuted">{s.sourceMeta.filename}</span>
                        )}
                        {s.sourceMeta?.url && (
                          <span className="text-sm text-brand-textMuted truncate max-w-xs">{s.sourceMeta.url}</span>
                        )}
                        <span className="text-xs text-brand-textMuted">{s.chunksCount} chunks</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedBotId && bots.length === 0 && (
        <Card>
          <CardContent className="py-4">
            <EmptyState
              icon={<BookOpen className="w-12 h-12" />}
              title="Select a bot"
              description="Create a bot first, then select it above to add knowledge."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
