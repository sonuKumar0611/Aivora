'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Zap,
  MessageSquare,
  FileText,
  HeadphonesIcon,
  Shield,
  Sparkles,
} from 'lucide-react';

const freeFeatures = [
  '1 AI agent',
  '500 messages / month',
  'Knowledge base (PDF, text, URLs)',
  'Embeddable chat widget',
  'Custom name & tone',
  'Community support',
];

const proFeatures = [
  'Unlimited agents',
  '10,000+ messages / month',
  'Everything in Free, plus:',
  'Priority support',
  'Advanced analytics',
  'Custom branding',
  'API access (coming with Pro)',
  'Dedicated success manager',
];

const allPlansInclude = [
  'No credit card for Free',
  'Cancel anytime',
  'SSL-secured',
  'Your data stays yours',
];

export function PricingSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '0px 0px -80px 0px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative">
      <div
        className={`max-w-6xl mx-auto px-4 transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-bgCard/60 backdrop-blur-sm px-4 py-1.5 text-sm text-brand-textMuted mb-4">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            Simple, transparent pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-textHeading mb-3">
            Pricing
          </h2>
          <p className="text-brand-textMuted max-w-xl mx-auto">
            Start free. Scale when you need more bots and messages—no surprises.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 auto-rows-fr">
          {/* Free plan – bento card */}
          <div className="md:row-span-2 rounded-2xl border border-brand-border bg-brand-bgCard/80 backdrop-blur-sm p-6 sm:p-8 flex flex-col hover:border-brand-primary/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-primary" />
              </div>
              <h3 className="font-semibold text-lg text-brand-textHeading">Free</h3>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-bold text-brand-textHeading">$0</span>
              <span className="text-brand-textMuted text-sm ml-1">/ month</span>
            </div>
            <p className="text-sm text-brand-textMuted mb-6">
              Get started with one agent and limited messages. No credit card required.
            </p>
            <ul className="space-y-3 flex-1 mb-8">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-brand-text">
                  <Check className="w-4 h-4 text-brand-success shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="w-full inline-flex items-center justify-center rounded-xl border-2 border-brand-primary/50 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 font-semibold py-3 px-4 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro plan – bento card */}
          <div className="md:row-span-2 rounded-2xl border border-brand-border bg-brand-bgCard/80 backdrop-blur-sm p-6 sm:p-8 flex flex-col relative overflow-hidden hover:border-brand-primary/40 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-primary opacity-10 rounded-bl-full" />
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-brand-primary/20 text-brand-primary text-xs font-semibold px-3 py-1">
                Coming soon
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-brand-primary" />
              </div>
              <h3 className="font-semibold text-lg text-brand-textHeading">Pro</h3>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-bold text-brand-textHeading">—</span>
              <span className="text-brand-textMuted text-sm ml-1">/ month</span>
            </div>
            <p className="text-sm text-brand-textMuted mb-6">
              More bots, higher limits, and priority support for growing teams.
            </p>
            <ul className="space-y-3 flex-1 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-brand-text">
                  <Check className="w-4 h-4 text-brand-success shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-bgCard text-brand-textMuted font-medium py-3 px-4 cursor-not-allowed"
            >
              Notify me when Pro is ready
            </button>
          </div>

          {/* What's included – small bento */}
          <div className="rounded-2xl border border-brand-border bg-brand-bgCard/60 backdrop-blur-sm p-5 sm:p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-brand-accent" />
              <h4 className="font-semibold text-brand-textHeading">All plans include</h4>
            </div>
            <ul className="space-y-2">
              {allPlansInclude.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-brand-textMuted">
                  <Check className="w-4 h-4 text-brand-success shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Support CTA – small bento */}
          <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 backdrop-blur-sm p-5 sm:p-6 flex flex-col justify-center">
            <HeadphonesIcon className="w-8 h-8 text-brand-primary mb-3" />
            <h4 className="font-semibold text-brand-textHeading mb-1">Need more?</h4>
            <p className="text-sm text-brand-textMuted mb-4">
              Enterprise or custom limits? We can help.
            </p>
            <a
              href="mailto:support@aivora.com"
              className="text-sm font-medium text-brand-link hover:text-brand-linkHover transition-colors"
            >
              Contact us →
            </a>
          </div>
        </div>

        {/* Bottom trust line */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-brand-textMuted">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            No long-term contract
          </span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Secure & compliant
          </span>
        </div>
      </div>
    </section>
  );
}
