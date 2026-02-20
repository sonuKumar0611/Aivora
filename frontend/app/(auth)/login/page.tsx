'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
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
        <h1 className="mt-4 text-2xl font-semibold text-brand-textHeading">Log in</h1>
        <p className="mt-1 text-sm text-brand-textMuted">Enter your credentials</p>
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
            className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow"
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
            className="w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white py-2.5 font-medium disabled:opacity-50 transition-all"
        >
          {login.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-brand-textMuted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-brand-link hover:text-brand-linkHover transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
