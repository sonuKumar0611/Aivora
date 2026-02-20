'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate(
      { email, password },
      {
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-bgCard p-8 shadow-lg animate-in glass-card">
      <div className="text-center mb-8">
        <Link href="/" className="text-xl font-semibold text-brand-textHeading hover:text-brand-link transition-colors">
          Aivora
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Create an account</h1>
        <p className="mt-1 text-sm text-brand-textMuted">Get started with Aivora</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-text mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text placeholder-brand-textDisabled focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-text mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2 text-brand-text placeholder-brand-textDisabled focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            placeholder="At least 8 characters"
            required
          />
        </div>
        <button
          type="submit"
          disabled={signup.isPending}
          className="w-full rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white py-2.5 font-medium disabled:opacity-50 transition-all"
        >
          {signup.isPending ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-brand-textMuted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-link hover:text-brand-linkHover transition-colors">
          Log in
        </Link>
      </p>
    </div>
  );
}
