'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getApiUrl } from '@/lib/api';
import { getErrorMessage } from '@/lib/api';
import ShinyText from '@/components/ui/ShinyText';
import { validateEmail } from '@/lib/validation';
import { clsx } from 'clsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const runValidation = () => {
    setApiError(null);
    const err = validateEmail(email);
    setEmailError(err);
    return !err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!runValidation()) return;
    setLoading(true);
    setApiError(null);
    try {
      const base = getApiUrl();
      const res = await fetch(`${base}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(data.message || data.error || 'Something went wrong');
        return;
      }
      setSent(true);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div
        className={clsx(
          'rounded-2xl border border-brand-border bg-brand-bgCard/95 p-8 shadow-xl shadow-brand-primary/5',
          'backdrop-blur-xl animate-auth-card',
          'ring-1 ring-white/5'
        )}
      >
        <div className="text-center mb-6 animate-auth-field animate-auth-field-delay-1">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bgCard rounded-lg"
            aria-label="Aivora home"
          >
            <Image
              src="/brand-logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
              aria-hidden
              priority
            />
            <ShinyText
              text="Aivora™"
              speed={2}
              delay={0}
              color="hsl(var(--text-muted))"
              shineColor="hsl(var(--primary))"
              spread={120}
              direction="left"
              yoyo={false}
              pauseOnHover={false}
              className="font-semibold tracking-tight text-2xl"
            />
          </Link>
          <div className="mt-6 w-12 h-12 mx-auto rounded-full bg-brand-primary/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Check your email</h1>
          <p className="mt-2 text-sm text-brand-textMuted">
            If an account exists for <strong className="text-brand-text">{email.trim()}</strong>, we sent a link to reset your password. It expires in 1 hour.
          </p>
        </div>
        <p className="text-center text-sm text-brand-textMuted animate-auth-field animate-auth-field-delay-2">
          <Link href="/login" className="font-medium text-brand-link hover:text-brand-linkHover transition-colors">
            Back to log in
          </Link>
        </p>
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
          <Image
            src="/brand-logo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
            aria-hidden
            priority
          />
          <ShinyText
            text="Aivora™"
            speed={2}
            delay={0}
            color="hsl(var(--text-muted))"
            shineColor="hsl(var(--primary))"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
            className="font-semibold tracking-tight text-2xl"
          />
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Forgot password?</h1>
        <p className="mt-1 text-sm text-brand-textMuted">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="animate-auth-field animate-auth-field-delay-2">
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-brand-text mb-1.5"
          >
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setApiError(null);
              if (touched) setEmailError(validateEmail(e.target.value));
            }}
            onBlur={() => setTouched(true)}
            className={clsx(
              'w-full rounded-lg border bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-transparent',
              emailError
                ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/50'
                : 'border-brand-borderLight focus:border-brand-primary focus:ring-brand-primary/50'
            )}
            placeholder="you@example.com"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'forgot-email-error' : undefined}
          />
          {emailError && (
            <p id="forgot-email-error" className="mt-1.5 text-sm text-brand-error" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {apiError && (
          <div
            className="animate-auth-field rounded-lg border border-brand-error/50 bg-brand-error/10 px-3 py-2.5 text-sm text-brand-error"
            role="alert"
          >
            {apiError}
          </div>
        )}
        <div className="animate-auth-field animate-auth-field-delay-3 pt-1">
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
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-brand-textMuted animate-auth-field animate-auth-field-delay-4">
        Remember your password?{' '}
        <Link href="/login" className="font-medium text-brand-link hover:text-brand-linkHover transition-colors">
          Log in
        </Link>
      </p>
    </div>
  );
}
