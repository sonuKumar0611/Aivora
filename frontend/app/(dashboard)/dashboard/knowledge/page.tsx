'use client';

import { useState, useCallback } from 'react';
import { useKnowledge } from '@/hooks/useKnowledge';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BookOpen, FileText, Link as LinkIcon, Type, Plus, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { KnowledgeSource } from '@/hooks/useKnowledge';

function sourceColumns(): { id: string; label: string; render: (row: KnowledgeSource) => React.ReactNode }[] {
  return [
    {
      id: 'name',
      label: 'Name / URL',
      render: (row) => (
        <span className="text-brand-text font-medium truncate max-w-[240px] block" title={row.sourceMeta?.filename || row.sourceMeta?.url || ''}>
          {row.sourceMeta?.filename || row.sourceMeta?.url || '—'}
        </span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      render: (row) => <span className="capitalize text-brand-textMuted">{row.sourceType}</span>,
    },
    {
      id: 'chunks',
      label: 'Chunks',
      render: (row) => <span className="text-brand-textMuted tabular-nums">{row.chunksCount}</span>,
    },
    {
      id: 'assignedBots',
      label: 'Assigned to bots',
      render: (row) =>
        row.assignedBots.length === 0 ? (
          <span className="text-brand-textMuted italic">Unassigned</span>
        ) : (
          <span className="text-brand-text text-sm">{row.assignedBots.map((b) => b.name).join(', ')}</span>
        ),
    },
  ];
}

export default function KnowledgePage() {
  const { sources, isLoading, isError, refetch, uploadSource, deleteSource } = useKnowledge();
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState<'pdf' | 'text' | 'url'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleDelete = (row: KnowledgeSource) => {
    if (row.assignedBots.length > 0) {
      const names = row.assignedBots.map((b) => b.name).join(', ');
      toast.error(`Remove this document from bot config first: ${names}`);
      return;
    }
    if (!confirm(`Delete "${row.sourceMeta?.filename || row.sourceMeta?.url || row.sourceType}"?`)) return;
    deleteSource.mutate(row.id, {
      onSuccess: () => toast.success('Document deleted'),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const handleUpload = () => {
    if (tab === 'pdf') {
      if (!file) {
        toast.error('Choose a PDF file');
        return;
      }
      uploadSource.mutate(
        { type: 'pdf', file },
        {
          onSuccess: (data: { data?: { source?: { chunksCount?: number } } }) => {
            toast.success(`Uploaded ${data?.data?.source?.chunksCount ?? 0} chunks`);
            setFile(null);
            setAddOpen(false);
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        }
      );
      return;
    }
    if (tab === 'text') {
      if (!text.trim()) {
        toast.error('Enter some text');
        return;
      }
      uploadSource.mutate(
        { type: 'text', text: text.trim() },
        {
          onSuccess: (data: { data?: { source?: { chunksCount?: number } } }) => {
            toast.success(`Uploaded ${data?.data?.source?.chunksCount ?? 0} chunks`);
            setText('');
            setAddOpen(false);
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        }
      );
      return;
    }
    if (tab === 'url') {
      if (!url.trim()) {
        toast.error('Enter a URL');
        return;
      }
      uploadSource.mutate(
        { type: 'url', url: url.trim() },
        {
          onSuccess: (data: { data?: { source?: { chunksCount?: number } } }) => {
            toast.success(`Uploaded ${data?.data?.source?.chunksCount ?? 0} chunks`);
            setUrl('');
            setAddOpen(false);
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        }
      );
      return;
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f?.type === 'application/pdf') {
        setFile(f);
        setTab('pdf');
      } else {
        toast.error('Only PDF files are allowed');
      }
    },
    []
  );
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-brand-textHeading">Knowledge Base</h1>
        <p className="mt-1 text-sm text-brand-textMuted">
          Upload documents here. Assign them to bots when creating or editing a bot.
        </p>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-8">
            <ErrorState onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <DataTable<KnowledgeSource>
          fillHeight
          title="Documents"
          description="Assign documents to bots in My Bots → Create/Edit bot."
          searchPlaceholder="Search documents..."
          columns={sourceColumns()}
          data={sources}
          getRowId={(row) => row.id}
          getSearchableText={(row) =>
            `${row.sourceType} ${row.sourceMeta?.filename ?? ''} ${row.sourceMeta?.url ?? ''} ${row.assignedBots.map((b) => b.name).join(' ')}`
          }
          isLoading={isLoading}
          emptyMessage={
            <EmptyState
              icon={<BookOpen className="w-10 h-10 mx-auto" />}
              title="No documents yet"
              description="Click Add to upload a PDF, paste text, or add a URL. Then assign documents to bots when creating a bot."
              action={{ label: 'Add document', onClick: () => setAddOpen(true) }}
            />
          }
          headerAction={
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          }
          actions={{
            onView: (row) =>
              toast.success(
                row.sourceMeta?.filename || row.sourceMeta?.url || row.sourceType || 'Document',
                { icon: '📄' }
              ),
            onDelete: handleDelete,
          }}
        />
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAddOpen(false)}>
          <Card
            className="w-full max-w-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-brand-textHeading">Add document</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="p-1 rounded text-brand-textMuted hover:text-brand-text"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
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
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragOver ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-borderLight bg-brand-sidebar/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="kb-file-input"
                  />
                  <label htmlFor="kb-file-input" className="cursor-pointer block">
                    <Upload className="w-10 h-10 mx-auto text-brand-textMuted mb-2" />
                    <p className="text-brand-text font-medium">Drop a PDF here or click to choose</p>
                    <p className="text-sm text-brand-textMuted mt-1">Only PDF files, max 10MB</p>
                    {file && <p className="mt-2 text-brand-primary text-sm truncate">{file.name}</p>}
                  </label>
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

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploadSource.isPending}>
                  {uploadSource.isPending ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
