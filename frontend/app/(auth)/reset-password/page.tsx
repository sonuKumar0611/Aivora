'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { getErrorMessage } from '@/lib/api';
import { PasswordInput } from '@/components/ui/PasswordInput';
import ShinyText from '@/components/ui/ShinyText';
import { validatePassword } from '@/lib/validation';
import { clsx } from 'clsx';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setApiError('Missing reset link. Request a new one from the forgot password page.');
  }, [token]);

  const runValidation = () => {
    setApiError(null);
    const pErr = validatePassword(password, { forSignup: true, minLength: 8 });
    const cErr = confirm !== password ? 'Passwords do not match' : undefined;
    setPasswordError(pErr);
    setConfirmError(cErr);
    return !pErr && !cErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (!runValidation() || !token) return;
    setLoading(true);
    setApiError(null);
    try {
      const base = getApiUrl();
      const res = await fetch(`${base}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(data.message || data.error || 'Something went wrong');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={clsx(
          'rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl shadow-brand-primary/5',
          'backdrop-blur-xl animate-auth-card',
          'ring-1 ring-white/5'
        )}
      >
        <div className="text-center mb-6 animate-auth-field">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2"
            aria-label="Aivora home"
          >
            <Image src="/brand-logo.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" aria-hidden priority />
            <ShinyText text="Aivora™" speed={2} delay={0} color="hsl(var(--text-muted))" shineColor="hsl(var(--primary))" spread={120} direction="left" yoyo={false} pauseOnHover={false} className="font-semibold tracking-tight text-2xl" />
          </Link>
          <div className="mt-6 w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Password updated</h1>
          <p className="mt-2 text-sm text-brand-textMuted">Redirecting you to log in…</p>
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
      <div className="text-center mb-8 animate-auth-field animate-auth-field-delay-1">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bgCard rounded-lg"
          aria-label="Aivora home"
        >
          <Image src="/brand-logo.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" aria-hidden priority />
          <ShinyText text="Aivora™" speed={2} delay={0} color="hsl(var(--text-muted))" shineColor="hsl(var(--primary))" spread={120} direction="left" yoyo={false} pauseOnHover={false} className="font-semibold tracking-tight text-2xl" />
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Set new password</h1>
        <p className="mt-1 text-sm text-brand-textMuted">Choose a secure password (at least 8 characters).</p>
      </div>

      {!token ? (
        <div className="rounded-lg border border-brand-error/50 bg-brand-error/10 px-3 py-2.5 text-sm text-brand-error mb-4">
          This page requires a valid reset link. Use the link from your email or <Link href="/forgot-password" className="underline font-medium">request a new one</Link>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="animate-auth-field animate-auth-field-delay-2">
            <label htmlFor="reset-password" className="block text-sm font-medium text-brand-text mb-1.5">New password</label>
            <PasswordInput
              id="reset-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setApiError(null);
                if (touched.password) setPasswordError(validatePassword(e.target.value, { forSignup: true, minLength: 8 }));
                if (touched.confirm && confirm) setConfirmError(confirm !== e.target.value ? 'Passwords do not match' : undefined);
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="At least 8 characters"
              minLength={8}
              error={touched.password ? passwordError : undefined}
              disabled={loading}
            />
          </div>
          <div className="animate-auth-field animate-auth-field-delay-3">
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-brand-text mb-1.5">Confirm password</label>
            <PasswordInput
              id="reset-confirm"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setApiError(null);
                if (touched.confirm) setConfirmError(e.target.value !== password ? 'Passwords do not match' : undefined);
              }}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              placeholder="Confirm new password"
              error={touched.confirm ? confirmError : undefined}
              disabled={loading}
            />
          </div>
          {apiError && (
            <div className="rounded-lg border border-brand-error/50 bg-brand-error/10 px-3 py-2.5 text-sm text-brand-error" role="alert">
              {apiError}
            </div>
          )}
          <div className="animate-auth-field animate-auth-field-delay-4 pt-1">
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                'w-full rounded-lg py-2.5 font-medium transition-all duration-200',
                'bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-lg shadow-brand-primary/25',
                'hover:shadow-glow-primary hover:scale-[1.01] active:scale-[0.99]',
                'disabled:opacity-50 disabled:pointer-events-none disabled:scale-100'
              )}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-brand-textMuted animate-auth-field animate-auth-field-delay-5">
        <Link href="/login" className="font-medium text-brand-link hover:text-brand-linkHover transition-colors">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
