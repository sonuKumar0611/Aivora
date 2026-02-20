'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TONE_OPTIONS } from '@/lib/constants';
import { useKnowledge } from '@/hooks/useKnowledge';
import { BookOpen } from 'lucide-react';

interface CreateBotModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: { name: string; description: string; tone: string; assignedSourceIds: string[] }) => void;
  isLoading: boolean;
}

export function CreateBotModal({ open, onClose, onSubmit, isLoading }: CreateBotModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const { sources, isLoading: sourcesLoading } = useKnowledge();

  if (!open) return null;

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSourceIds.length === 0) return;
    onSubmit({ name, description, tone, assignedSourceIds: selectedSourceIds });
  };

  const canSubmit = sources.length > 0 && selectedSourceIds.length >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <Card
        className="w-full max-w-md shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold">Create bot</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-textMuted hover:text-brand-text"
            aria-label="Close"
          >
            ×
          </button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                placeholder="Support Bot"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Business description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                placeholder="We sell software and provide 24/7 support."
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
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-brand-bgCardHover rounded px-2 py-1.5">
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
                <p className="text-xs text-brand-error mt-1">Select at least one knowledge base.</p>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !canSubmit}>
                {isLoading ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
