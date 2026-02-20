'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TONE_OPTIONS } from '@/lib/constants';

interface CreateBotModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: { name: string; description: string; tone: string }) => void;
  isLoading: boolean;
}

export function CreateBotModal({ open, onClose, onSubmit, isLoading }: CreateBotModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, tone });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <Card
        className="w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between">
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
                placeholder="Support Bot"
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
                rows={3}
                className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary"
                placeholder="We sell software and provide 24/7 support."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">
                Tone
              </label>
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
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
