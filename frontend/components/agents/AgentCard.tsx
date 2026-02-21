'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const LiquidEther = dynamic(() => import('@/components/LiquidEther'), { ssr: false });

const LANDING_ETHER_COLORS = ['#5227FF', '#FF9FFC', '#B19EEF'];

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffDays > 0) return diffDays === 1 ? 'Updated yesterday' : `Updated ${diffDays}d ago`;
    if (diffHours > 0) return `Updated ${diffHours}h ago`;
    if (diffMins > 0) return `Updated ${diffMins}m ago`;
    return 'Updated just now';
  } catch {
    return '';
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface AgentCardProps {
  href: string;
  name: string;
  tone: string;
  description: string;
  status?: 'draft' | 'published';
  botType?: string;
  knowledgeCount?: number;
  updatedAt?: string;
  isActive?: boolean;
}

export function AgentCard({
  href,
  name,
  tone,
  description,
  status = 'draft',
  botType,
  knowledgeCount = 0,
  updatedAt,
  isActive = true,
}: AgentCardProps) {
  const updatedLabel = updatedAt ? formatRelativeTime(updatedAt) : '';

  return (
    <Link
      href={href}
      className="block h-full min-h-[200px] animate-in focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg rounded-xl overflow-hidden border border-white/10 hover:border-brand-primary/70 hover:shadow-[0_0_0_1px_hsl(var(--primary)_/_0.4)] transition-all duration-200"
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
        <div className="relative z-10 p-6 flex flex-col justify-end pointer-events-none h-full min-h-[200px]">
          <h3 className="font-semibold text-brand-textHeading mb-1">{name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-brand-textMuted mb-2">
            <span className="capitalize">{capitalize(tone)}</span>
            {botType && (
              <>
                <span aria-hidden>·</span>
                <span>{capitalize(botType)}</span>
              </>
            )}
          </div>
          <p className="text-sm text-brand-textMuted line-clamp-2 mb-3">
            {description || '—'}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-textMuted mt-auto">
            {knowledgeCount >= 0 && (
              <span>
                {knowledgeCount === 0
                  ? 'No knowledge sources'
                  : knowledgeCount === 1
                    ? '1 knowledge source'
                    : `${knowledgeCount} knowledge sources`}
              </span>
            )}
            {updatedLabel && (
              <span>{updatedLabel}</span>
            )}
            {status === 'published' && (
              <span
                className={
                  isActive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }
              >
                {isActive ? 'Active' : 'Paused'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
