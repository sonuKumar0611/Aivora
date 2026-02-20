'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBots, useBot } from '@/hooks/useBots';
import { useKnowledge } from '@/hooks/useKnowledge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TONE_OPTIONS, BOT_TYPE_OPTIONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { ArrowLeft, Check, Code, BookOpen, User } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Bot profile', icon: User },
  { id: 2, label: 'KB configuration', icon: BookOpen },
  { id: 3, label: 'Preview & publish', icon: Code },
];

export default function CreateBotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(() => {
    const s = searchParams.get('step');
    return s ? Math.min(3, Math.max(1, parseInt(s, 10))) : 1;
  });
  const [botId, setBotId] = useState<string | null>(() => searchParams.get('botId'));

  const { createBot, updateBot, publishBot } = useBots();
  const { sources, isLoading: sourcesLoading } = useKnowledge();
  const { bot: existingBot } = useBot(botId);

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
    if (existingBot && step >= 2) {
      setSelectedSourceIds(existingBot.assignedSourceIds ?? []);
      setSystemPrompt(existingBot.systemPrompt ?? '');
    }
  }, [existingBot, step]);

  useEffect(() => {
    if (step > 1 && !botId) {
      setStep(1);
      router.replace('/dashboard/bots/new', { scroll: false });
    }
  }, [step, botId, router]);

  const saveDraftProfile = () => {
    if (!name.trim() || !description.trim()) {
      toast.error('Bot name and Bot description are required');
      return;
    }
    createBot.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        tone,
        botType,
        assignedSourceIds: [],
        status: 'draft',
      },
      {
        onSuccess: (bot) => {
          setBotId(bot.id);
          setStep(2);
          router.replace(`/dashboard/bots/new?botId=${bot.id}&step=2`, { scroll: false });
          toast.success('Draft saved');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const saveDraftKb = () => {
    if (!botId) return;
    if (selectedSourceIds.length === 0) {
      toast.error('Select at least one knowledge base to continue');
      return;
    }
    updateBot.mutate(
      {
        id: botId,
        assignedSourceIds: selectedSourceIds,
        systemPrompt: systemPrompt.trim() || undefined,
      },
      {
        onSuccess: () => {
          setStep(3);
          router.replace(`/dashboard/bots/new?botId=${botId}&step=3`, { scroll: false });
          toast.success('Knowledge base updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handlePublish = () => {
    if (!botId) return;
    if (selectedSourceIds.length === 0) {
      toast.error('Select at least one knowledge base before publishing');
      return;
    }
    publishBot.mutate(botId, {
      onSuccess: () => {
        toast.success('Bot published');
        router.push(`/dashboard/bots/${botId}`);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const goBack = () => {
    if (step === 1) router.push('/dashboard/bots');
    else setStep(step - 1);
  };

  const profileValid = name.trim().length > 0 && description.trim().length > 0;
  const isPending = createBot.isPending || updateBot.isPending || publishBot.isPending;

  return (
    <div className="h-full flex flex-col animate-fade-in pb-10 space-y-8">
      <div>
        <Link
          href="/dashboard/bots"
          className="inline-flex items-center text-sm text-brand-textMuted hover:text-brand-text mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to bots
        </Link>
        <h1 className="text-2xl font-semibold text-brand-textHeading">Create bot</h1>
        <p className="mt-2 text-sm text-brand-textMuted">
          Complete the steps below. You can save as draft and publish when ready.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3 flex-wrap">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-3 min-w-0 shrink-0">
              <div
                className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : done
                      ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'border-brand-borderLight text-brand-textMuted'
                }`}
              >
                {done ? <Check className="w-4 h-4 shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 rounded w-6 sm:w-10 shrink-0 ${done ? 'bg-green-500/50' : 'bg-brand-borderLight'}`}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Bot profile */}
      {step === 1 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-brand-textHeading">Bot profile</h2>
            <p className="text-sm text-brand-textMuted mt-2">
              Name, type, prompt, and general info for your bot.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text">Bot name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                  placeholder="Support Bot"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text">Bot type</label>
                <select
                  value={botType}
                  onChange={(e) => setBotType(e.target.value)}
                  className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                >
                  {BOT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-brand-text">Bot description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                placeholder="We sell software and provide 24/7 support."
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
            <div className="flex gap-2 pt-6 border-t border-brand-borderLight">
              <Button type="button" variant="secondary" onClick={goBack}>
                Cancel
              </Button>
              <Button
                onClick={saveDraftProfile}
                disabled={isPending || !profileValid}
              >
                {createBot.isPending ? 'Saving…' : 'Next — KB configuration'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: KB configuration */}
      {step === 2 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-brand-textHeading">KB configuration</h2>
            <p className="text-sm text-brand-textMuted mt-2">
              Select at least one knowledge base (required). Optionally add custom prompts for this bot.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-8 pb-8">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Knowledge base <span className="text-brand-error">*</span>
              </label>
              {sourcesLoading ? (
                <p className="text-sm text-brand-textMuted">Loading…</p>
              ) : sources.length === 0 ? (
                <div className="rounded-lg border border-brand-borderLight bg-brand-sidebar/50 p-4 text-center">
                  <BookOpen className="w-8 h-8 mx-auto text-brand-textMuted mb-2" />
                  <p className="text-sm text-brand-textMuted">No documents in Knowledge Base yet.</p>
                  <Link
                    href="/dashboard/knowledge"
                    className="text-sm text-brand-primary hover:underline mt-1 inline-block"
                  >
                    Upload documents first →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-brand-borderLight bg-brand-sidebar max-h-48 overflow-y-auto space-y-2 p-2">
                    {sources.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-brand-bgCardHover rounded px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(s.id)}
                          onChange={() =>
                            setSelectedSourceIds((prev) =>
                              prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                            )
                          }
                          className="rounded border-brand-borderLight text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="text-sm text-brand-text truncate flex-1">
                          {s.sourceMeta?.name || s.sourceMeta?.filename || s.sourceMeta?.url || s.sourceType}
                        </span>
                        <span className="text-xs text-brand-textMuted">{s.chunksCount} chunks</span>
                      </label>
                    ))}
                  </div>
                  {selectedSourceIds.length === 0 && (
                    <p className="text-xs text-brand-error mt-2">Select at least one knowledge base to continue.</p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-brand-text">Bot prompt (optional)</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary"
                placeholder="Custom instructions for how the bot should respond when using this knowledge base..."
              />
            </div>
            <div className="flex gap-2 pt-6 border-t border-brand-borderLight">
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button
                onClick={saveDraftKb}
                disabled={isPending || selectedSourceIds.length === 0}
              >
                {updateBot.isPending ? 'Saving…' : 'Next — Preview & publish'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview & Publish */}
      {step === 3 && botId && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-brand-textHeading flex items-center gap-2">
              <Code className="w-4 h-4" /> Embed widget
            </h2>
            <p className="text-sm text-brand-textMuted mt-2">
              Add this script to your website. The widget will work only after you publish.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-8 pb-8">
            <pre className="rounded-lg bg-brand-border p-4 text-xs overflow-x-auto text-brand-text">
              {`<script src="${origin || ''}/widget.js" data-bot="${botId}" data-api="${process.env.NEXT_PUBLIC_API_URL || ''}"></script>`}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const snippet = `<script src="${origin || ''}/widget.js" data-bot="${botId}" data-api="${apiUrl}"></script>`;
                navigator.clipboard.writeText(snippet);
                toast.success('Copied to clipboard');
              }}
            >
              Copy embed code
            </Button>
            <div className="flex flex-wrap gap-2 pt-6 border-t border-brand-borderLight">
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPending || selectedSourceIds.length === 0}
              >
                {publishBot.isPending ? 'Publishing…' : 'Publish bot'}
              </Button>
              <span className="text-sm text-brand-textMuted self-center">
                {selectedSourceIds.length === 0
                  ? 'Select at least one knowledge base to publish.'
                  : 'Publishing activates the embed script for your site.'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
