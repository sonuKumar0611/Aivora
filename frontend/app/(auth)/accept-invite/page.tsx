'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { PasswordInput } from '@/components/ui/PasswordInput';
import ShinyText from '@/components/ui/ShinyText';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Loader2, CheckCircle } from 'lucide-react';

const INPUT_CLASS =
  'w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0 disabled:opacity-60';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token && !searchParams.has('token')) {
      setApiError('Invalid invite link. Please use the link from your invitation email.');
    }
  }, [token, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (newPassword.length < 8) {
      setApiError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError('Passwords do not match');
      return;
    }
    if (!token?.trim()) {
      setApiError('Invalid or missing invite link');
      return;
    }
    setIsSubmitting(true);
    api
      .post<{ data: { user: { id: string; email: string; role: string; organizationId: string | null; displayName?: string }; token: string; expiresIn: string } }>(
        '/auth/accept-invite',
        { token: token.trim(), newPassword }
      )
      .then(({ data }) => {
        const d = data.data;
        if (d.token) {
          localStorage.setItem('aivora_token', d.token);
          queryClient.setQueryData(['me'], d.user);
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      })
      .catch((err) => {
        setApiError(getErrorMessage(err));
        setIsSubmitting(false);
      });
  };

  if (!token) {
    return (
      <div
        className={clsx(
          'rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl shadow-brand-primary/5',
          'backdrop-blur-xl animate-auth-card',
          'ring-1 ring-white/5'
        )}
      >
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg"
            aria-label="Aivora home"
          >
            <Image src="/brand-logo.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" priority />
            <ShinyText text="Aivora™" speed={2} delay={0} color="hsl(var(--text-muted))" shineColor="hsl(var(--primary))" className="font-semibold tracking-tight text-xl" />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Accept invite</h1>
        </div>
        <div className="rounded-lg border border-brand-error/50 bg-brand-error/10 px-4 py-3 text-sm text-brand-error" role="alert">
          {apiError || 'This invite link is invalid or has expired. Please request a new invite from your team admin.'}
        </div>
        <p className="mt-6 text-center text-sm text-brand-textMuted">
          <Link href="/login" className="font-medium text-brand-link hover:text-brand-linkHover">
            Go to login
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className={clsx(
          'rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl shadow-brand-primary/5',
          'backdrop-blur-xl animate-auth-card',
          'ring-1 ring-white/5 text-center'
        )}
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-500 mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-semibold text-brand-textHeading">You’re in!</h1>
        <p className="mt-2 text-brand-textMuted">Redirecting you to the dashboard…</p>
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl shadow-brand-primary/5',
        'backdrop-blur-xl animate-auth-card',
        'ring-1 ring-white/5'
      )}
    >
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg"
          aria-label="Aivora home"
        >
          <Image src="/brand-logo.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" priority />
          <ShinyText text="Aivora™" speed={2} delay={0} color="hsl(var(--text-muted))" shineColor="hsl(var(--primary))" className="font-semibold tracking-tight text-2xl" />
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Set your password</h1>
        <p className="mt-1 text-sm text-brand-textMuted">Choose a secure password to complete your account setup.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="accept-new-password" className="block text-sm font-medium text-brand-text mb-1.5">
            New password
          </label>
          <PasswordInput
            id="accept-new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full"
            minLength={8}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="accept-confirm-password" className="block text-sm font-medium text-brand-text mb-1.5">
            Confirm password
          </label>
          <PasswordInput
            id="accept-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            className="w-full"
            disabled={isSubmitting}
          />
        </div>

        {apiError && (
          <div className="rounded-lg border border-brand-error/50 bg-brand-error/10 px-3 py-2.5 text-sm text-brand-error" role="alert">
            {apiError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            'w-full rounded-lg py-2.5 font-medium transition-all duration-200',
            'bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-lg shadow-brand-primary/25',
            'hover:shadow-glow-primary hover:scale-[1.01] active:scale-[0.99]',
            'disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 flex items-center justify-center gap-2'
          )}
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isSubmitting ? 'Setting password…' : 'Accept invite & continue'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-textMuted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-link hover:text-brand-linkHover">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl w-full max-w-md flex items-center justify-center min-h-[320px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
