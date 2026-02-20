'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api, getErrorMessage } from '@/lib/api';
import ShinyText from '@/components/ui/ShinyText';
import { clsx } from 'clsx';

const STEPS = [
  { id: 0, title: 'Profile', short: 'You' },
  { id: 1, title: 'Organization', short: 'Org' },
  { id: 2, title: 'Team', short: 'Team', optional: true },
];

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnboardingComplete = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: ['me'] });
    window.location.href = '/dashboard';
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    if (user?.onboardingCompleted) {
      window.location.href = '/dashboard';
      return;
    }
    setStep(user?.onboardingStep ?? 0);
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || !isAuthenticated || user?.onboardingCompleted) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl max-w-md w-full flex flex-col items-center justify-center min-h-[320px]">
        <div className="h-10 w-10 rounded-full border-2 border-brand-border border-t-brand-primary animate-spin" />
        <p className="mt-4 text-sm text-brand-textMuted">Loading…</p>
      </div>
    );
  }

  const currentStepIndex = Math.min(step, STEPS.length - 1);
  const currentStepInfo = STEPS[currentStepIndex];

  return (
    <div className="w-full max-w-lg">
      <div
        className={clsx(
          'rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl shadow-brand-primary/5',
          'backdrop-blur-xl ring-1 ring-white/5'
        )}
      >
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg"
            aria-label="Aivora home"
          >
            <Image src="/brand-logo.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" aria-hidden priority />
            <ShinyText text="Aivora™" speed={2} delay={0} color="hsl(var(--text-muted))" shineColor="hsl(var(--primary))" spread={120} direction="left" yoyo={false} pauseOnHover={false} className="font-semibold tracking-tight text-xl" />
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-brand-textHeading">Welcome — let&apos;s get set up</h1>
          <p className="mt-1 text-sm text-brand-textMuted">Step {currentStepIndex + 1} of {STEPS.length}</p>
          {/* Progress bar */}
          <div className="mt-4 flex gap-1.5 justify-center">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={clsx(
                  'h-1.5 flex-1 max-w-[72px] rounded-full transition-colors',
                  s.id <= currentStepIndex ? 'bg-brand-primary' : 'bg-brand-border'
                )}
                aria-hidden
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-brand-error/50 bg-brand-error/10 px-3 py-2.5 text-sm text-brand-error" role="alert">
            {error}
          </div>
        )}

        {currentStepIndex === 0 && (
          <OnboardingProfile
            initialDisplayName={user?.displayName ?? ''}
            onSuccess={() => { setStep(1); setError(null); }}
            onError={setError}
            busy={busy}
            setBusy={setBusy}
          />
        )}
        {currentStepIndex === 1 && (
          <OnboardingOrganization
            canEditOrg={user?.role === 'owner' || user?.role === 'admin'}
            onSuccess={() => { setStep(2); setError(null); }}
            onError={setError}
            busy={busy}
            setBusy={setBusy}
          />
        )}
        {currentStepIndex === 2 && (
          <OnboardingInvite
            onComplete={handleOnboardingComplete}
            onError={setError}
            busy={busy}
            setBusy={setBusy}
          />
        )}
      </div>
    </div>
  );
}

function OnboardingProfile({
  initialDisplayName,
  onSuccess,
  onError,
  busy,
  setBusy,
}: {
  initialDisplayName: string;
  onSuccess: () => void;
  onError: (msg: string | null) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [touched, setTouched] = useState(false);
  const displayNameError = touched && !displayName.trim() ? 'Please enter your name or a display name' : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!displayName.trim()) return;
    onError(null);
    setBusy(true);
    try {
      await api.put('/settings/profile', { displayName: displayName.trim() });
      await api.patch('/settings/onboarding', { step: 1 });
      onSuccess();
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="onboarding-displayName" className="block text-sm font-medium text-brand-text mb-1.5">
          What should we call you?
        </label>
        <input
          id="onboarding-displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); onError(null); }}
          onBlur={() => setTouched(true)}
          className={clsx(
            'w-full rounded-lg border bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled transition-all',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0',
            displayNameError ? 'border-brand-error' : 'border-brand-borderLight'
          )}
          placeholder="e.g. Alex or Support Lead"
          aria-invalid={!!displayNameError}
        />
        {displayNameError && <p className="mt-1.5 text-sm text-brand-error">{displayNameError}</p>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className={clsx(
          'w-full rounded-lg py-2.5 font-medium transition-all',
          'bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-lg shadow-brand-primary/25',
          'hover:shadow-glow-primary hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        {busy ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}

function OnboardingOrganization({
  canEditOrg,
  onSuccess,
  onError,
  busy,
  setBusy,
}: {
  canEditOrg: boolean;
  onSuccess: () => void;
  onError: (msg: string | null) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get<{ data: { organization: { name: string; slug: string } } }>('/settings/organization').then(({ data }) => {
      if (!cancelled) {
        setName(data.data.organization.name);
        setSlug(data.data.organization.slug);
        setFetched(true);
      }
    }).catch(() => setFetched(true));
    return () => { cancelled = true; };
  }, []);

  const nameError = touched && !name.trim() ? 'Organization name is required' : undefined;
  const slugError = touched && slug && !/^[a-z0-9-]+$/.test(slug) ? 'Use only lowercase letters, numbers, and hyphens' : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (canEditOrg && (!name.trim() || (slug && !/^[a-z0-9-]+$/.test(slug)))) return;
    if (!canEditOrg) {
      // Invited members: just advance step
      setBusy(true);
      onError(null);
      try {
        await api.patch('/settings/onboarding', { step: 2 });
        onSuccess();
      } catch (err) {
        onError(getErrorMessage(err));
      } finally {
        setBusy(false);
      }
      return;
    }
    onError(null);
    setBusy(true);
    try {
      await api.put('/settings/organization', { name: name.trim(), ...(slug.trim() && { slug: slug.trim().toLowerCase() }) });
      await api.patch('/settings/onboarding', { step: 2 });
      onSuccess();
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!fetched) {
    return (
      <div className="py-8 flex justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-border border-t-brand-primary animate-spin" />
      </div>
    );
  }

  if (!canEditOrg) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-textMuted">You&apos;re part of <strong className="text-brand-text">{name || 'your organization'}</strong>. Continue to finish setup.</p>
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={busy}
            className={clsx(
              'w-full rounded-lg py-2.5 font-medium transition-all',
              'bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-lg shadow-brand-primary/25',
              'hover:shadow-glow-primary hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
            )}
          >
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="onboarding-org-name" className="block text-sm font-medium text-brand-text mb-1.5">
          Organization name
        </label>
        <input
          id="onboarding-org-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); onError(null); }}
          onBlur={() => setTouched(true)}
          className={clsx(
            'w-full rounded-lg border bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled transition-all',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0',
            nameError ? 'border-brand-error' : 'border-brand-borderLight'
          )}
          placeholder="e.g. Acme Inc"
          aria-invalid={!!nameError}
        />
        {nameError && <p className="mt-1.5 text-sm text-brand-error">{nameError}</p>}
      </div>
      <div>
        <label htmlFor="onboarding-org-slug" className="block text-sm font-medium text-brand-text mb-1.5">
          URL slug <span className="text-brand-textMuted font-normal">(optional)</span>
        </label>
        <input
          id="onboarding-org-slug"
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); onError(null); }}
          onBlur={() => setTouched(true)}
          className={clsx(
            'w-full rounded-lg border bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled transition-all',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0',
            slugError ? 'border-brand-error' : 'border-brand-borderLight'
          )}
          placeholder="e.g. acme-inc"
          aria-invalid={!!slugError}
        />
        {slugError && <p className="mt-1.5 text-sm text-brand-error">{slugError}</p>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className={clsx(
          'w-full rounded-lg py-2.5 font-medium transition-all',
          'bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-lg shadow-brand-primary/25',
          'hover:shadow-glow-primary hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        {busy ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}

function OnboardingInvite({
  onComplete,
  onError,
  busy,
  setBusy,
}: {
  onComplete: () => void;
  onError: (msg: string | null) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState(false);

  const handleSkip = async () => {
    onError(null);
    setBusy(true);
    try {
      await api.patch('/settings/onboarding', { completed: true });
      onComplete();
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onError(null);
    setBusy(true);
    try {
      await api.post('/settings/team', { email: email.trim(), role: 'member' });
      setInvited(true);
      setEmail('');
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    onError(null);
    setBusy(true);
    try {
      await api.patch('/settings/onboarding', { completed: true });
      onComplete();
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-textMuted">
        Invite teammates to your organization. You can also do this later from <strong className="text-brand-text">Settings → Team</strong> in the dashboard.
      </p>
      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); onError(null); }}
          placeholder="teammate@example.com"
          className={clsx(
            'flex-1 rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0'
          )}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className={clsx(
            'shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
            'bg-brand-sidebar border border-brand-borderLight text-brand-text hover:bg-brand-border',
            'disabled:opacity-50 disabled:pointer-events-none'
          )}
        >
          Invite
        </button>
      </form>
      {invited && <p className="text-sm text-green-500">Invitation sent. Add another or skip below.</p>}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={handleFinish}
          disabled={busy}
          className={clsx(
            'flex-1 rounded-lg py-2.5 font-medium transition-all',
            'bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-lg shadow-brand-primary/25',
            'hover:shadow-glow-primary hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
          )}
        >
          {busy ? 'Finishing…' : 'Go to dashboard'}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={busy}
          className={clsx(
            'rounded-lg py-2.5 px-4 font-medium text-brand-textMuted hover:text-brand-text transition-all',
            'border border-brand-borderLight hover:bg-brand-sidebar disabled:opacity-50 disabled:pointer-events-none'
          )}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
