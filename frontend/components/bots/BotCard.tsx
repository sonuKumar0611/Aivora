'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const LiquidEther = dynamic(() => import('@/components/LiquidEther'), { ssr: false });

const LANDING_ETHER_COLORS = ['#5227FF', '#FF9FFC', '#B19EEF'];

interface BotCardProps {
  href: string;
  name: string;
  tone: string;
  description: string;
  status?: 'draft' | 'published';
}

export function BotCard({ href, name, tone, description, status = 'draft' }: BotCardProps) {
  return (
    <Link
      href={href}
      className="block h-full min-h-[160px] animate-in focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg rounded-xl overflow-hidden border border-white/10 hover:border-brand-primary/70 hover:shadow-[0_0_0_1px_hsl(var(--primary)_/_0.4)] transition-all duration-200"
    >
      <div className="relative w-full h-full rounded-xl overflow-hidden">
        <span
          className={`absolute top-3 right-3 z-20 px-2 py-0.5 rounded text-xs font-medium ${
            status === 'published'
              ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
          }`}
        >
          {status === 'published' ? 'Published' : 'Draft'}
        </span>
        {/* Liquid ether background – reacts to mouse hover on this card */}
        <div className="absolute inset-0 pointer-events-auto">
          <LiquidEther
            colors={LANDING_ETHER_COLORS}
            mouseForce={18}
            cursorSize={80}
            isViscous
            viscous={30}
            iterationsViscous={24}
            iterationsPoisson={24}
            resolution={0.4}
            isBounce={false}
            autoDemo={false}
            className="absolute inset-0 w-full h-full pointer-events-auto"
          />
        </div>
        {/* Glass overlay – keeps text readable, glass look; pointer-events-none so hover hits LiquidEther */}
        <div
          className="absolute inset-0 z-[1] bg-brand-bg/50 backdrop-blur-md border border-white/5 pointer-events-none"
          aria-hidden
        />
        {/* Content on top – pointer-events-none so hover hits LiquidEther */}
        <div className="relative z-10 p-6 flex flex-col justify-end pointer-events-none h-full">
          <h3 className="font-semibold text-brand-textHeading mb-1">{name}</h3>
          <p className="text-xs text-brand-textMuted capitalize mb-3">{tone}</p>
          <p className="text-sm text-brand-textMuted line-clamp-2">
            {description || '—'}
          </p>
        </div>
      </div>
    </Link>
  );
}
