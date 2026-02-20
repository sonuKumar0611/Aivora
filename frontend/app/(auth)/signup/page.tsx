'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api';
import { PasswordInput } from '@/components/ui/PasswordInput';
import ShinyText from '@/components/ui/ShinyText';
import { validateSignupForm } from '@/lib/validation';
import { clsx } from 'clsx';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [validation, setValidation] = useState<{
    emailError?: string;
    passwordError?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { signup } = useAuth();

  const runValidation = () => {
    setApiError(null);
    const result = validateSignupForm(email, password);
    setValidation({
      emailError: result.emailError,
      passwordError: result.passwordError,
    });
    return result.valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!runValidation()) return;

    signup.mutate(
      { email: email.trim(), password },
      {
        onError: (err) => {
          setApiError(getErrorMessage(err));
        },
      }
    );
  };

  const emailError = touched.email ? validation.emailError : undefined;
  const passwordError = touched.password ? validation.passwordError : undefined;

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
        <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-brand-textMuted">Get started with Aivora</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="animate-auth-field animate-auth-field-delay-2">
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-brand-text mb-1.5"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setApiError(null);
              if (touched.email) setValidation((v) => ({ ...v, emailError: undefined }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={clsx(
              'w-full rounded-lg border bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-transparent',
              emailError
                ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/50'
                : 'border-brand-borderLight focus:border-brand-primary focus:ring-brand-primary/50'
            )}
            placeholder="you@example.com"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'signup-email-error' : undefined}
          />
          {emailError && (
            <p
              id="signup-email-error"
              className="mt-1.5 text-sm text-brand-error"
              role="alert"
            >
              {emailError}
            </p>
          )}
        </div>

        <div className="animate-auth-field animate-auth-field-delay-3">
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-brand-text mb-1.5"
          >
            Password
          </label>
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setApiError(null);
              if (touched.password) setValidation((v) => ({ ...v, passwordError: undefined }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="At least 8 characters"
            minLength={8}
            error={passwordError}
            disabled={signup.isPending}
          />
        </div>

        {apiError && (
          <div
            className="animate-auth-field rounded-lg border border-brand-error/50 bg-brand-error/10 px-3 py-2.5 text-sm text-brand-error"
            role="alert"
          >
            {apiError}
          </div>
        )}
        <div className="animate-auth-field animate-auth-field-delay-4 pt-1">
          <button
            type="submit"
            disabled={signup.isPending}
            className={clsx(
              'w-full rounded-lg py-2.5 font-medium transition-all duration-200',
              'bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-lg shadow-brand-primary/25',
              'hover:shadow-glow-primary hover:scale-[1.01] active:scale-[0.99]',
              'disabled:opacity-50 disabled:pointer-events-none disabled:scale-100'
            )}
          >
            {signup.isPending ? 'Creating account…' : 'Sign up'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-brand-textMuted animate-auth-field animate-auth-field-delay-5">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-brand-link hover:text-brand-linkHover transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
