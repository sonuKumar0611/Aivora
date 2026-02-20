'use client';

import { useState } from 'react';
import { Mail, Sparkles, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';

const benefits = [
  {
    icon: Bell,
    title: 'Product & feature updates',
    description: 'Be the first to know when we ship new capabilities and integrations.',
  },
  {
    icon: Sparkles,
    title: 'Early access & tips',
    description: 'Get early access to betas and best practices for AI support.',
  },
  {
    icon: Mail,
    title: 'No spam, ever',
    description: 'We only email when it matters—typically once or twice a month.',
  },
];

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const { data } = await api.post<{ message?: string }>('/newsletter/subscribe', {
        email: email.trim(),
      });
      setStatus('success');
      setMessage(data?.message ?? 'You\'re subscribed. We\'ll keep you updated!');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(getErrorMessage(err));
    }
  }

  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative rounded-2xl border border-white/10 bg-brand-bgCard/70 backdrop-blur-sm overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF9FFC]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative px-6 py-10 sm:px-10 sm:py-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-textHeading mb-3">
                Stay in the loop
              </h2>
              <p className="text-brand-textMuted text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Get newsletter updates and be the first to hear about new features, product news, and tips for scaling support with AI.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex flex-col items-center sm:items-start text-center sm:text-left p-4 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-primary/15 text-brand-primary mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-brand-textHeading mb-1">{title}</h3>
                  <p className="text-xs text-brand-textMuted leading-snug">{description}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                Email for newsletter
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={status === 'loading'}
                className="flex-1 min-w-0 rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-brand-text placeholder:text-brand-textMuted/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-colors disabled:opacity-60"
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-xl bg-brand-primary hover:bg-brand-primaryHover text-white px-6 py-3.5 text-sm font-semibold transition-all hover:shadow-glow-primary disabled:opacity-70 disabled:pointer-events-none shrink-0"
              >
                {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>

            {(status === 'success' || status === 'error') && (
              <div
                className={`mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm ${
                  status === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
