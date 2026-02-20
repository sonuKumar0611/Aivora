'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import Spline from '@splinetool/react-spline';
import ShinyText from '@/components/ui/ShinyText';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'aivora-sidebar-collapsed';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/agents', label: 'My Agents', icon: Bot },
  { href: '/dashboard/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [borderHovered, setBorderHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed, mounted]);

  return (
    <aside
      className={clsx(
        'flex-shrink-0 h-full flex flex-col border-r border-brand-border bg-brand-sidebar transition-[width] duration-300 ease-in-out',
        'relative overflow-visible',
        collapsed ? 'w-[72px]' : 'w-56'
      )}
    >
      {/* Subtle gradient overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-primary/5 via-transparent to-transparent opacity-80 overflow-hidden"
        aria-hidden
      />

      <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
        {/* Brand name with shine */}
        <div className={clsx('flex items-center border-b border-brand-border/80', collapsed ? 'min-h-[52px] px-2 py-2 justify-center' : 'min-h-[56px] px-4 py-2.5')}>
          <Link
            href="/dashboard"
            className={clsx(
              'flex items-center justify-center overflow-hidden rounded-lg transition-opacity hover:opacity-90',
              collapsed ? 'h-10 w-10 shrink-0' : 'min-w-0 flex-1 gap-2'
            )}
            title="Aivora"
          >
            {collapsed ? (
              <Image
                src="/brand-logo.png"
                alt="Aivora"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <>
                <Image
                  src="/brand-logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 object-contain"
                  aria-hidden
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
              </>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  'hover:bg-brand-divider/80 active:scale-[0.98]',
                  collapsed && 'justify-center px-0 py-2.5',
                  isActive
                    ? 'bg-brand-divider text-white shadow-sm [&_svg]:text-brand-link'
                    : 'text-brand-textMuted hover:text-brand-textHeading',
                  isActive && !collapsed && 'border-l-2 border-brand-primary -ml-px pl-[13px]',
                  isActive && collapsed && 'ring-2 ring-brand-primary/50 ring-inset'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Robot – just above logout */}
        <div className={clsx('flex-shrink-0 flex items-center justify-center py-3', collapsed ? 'px-2' : 'px-3')}>
          <span
            className={clsx(
              'relative rounded-lg bg-white/5 flex items-center justify-center overflow-hidden',
              collapsed ? 'sidebar-spline-robot-collapsed h-14 w-14' : 'sidebar-spline-robot h-[90px] w-[140px]'
            )}
          >
            <Spline scene="https://prod.spline.design/12szciltoAEi7SfN/scene.splinecode" />
          </span>
        </div>

        {/* Log out at bottom */}
        <div className="relative p-2 border-t border-brand-border/80">
          <button
            type="button"
            onClick={() => logout()}
            title={collapsed ? 'Log out' : undefined}
            className={clsx(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              'text-brand-textMuted hover:bg-brand-divider hover:text-brand-textHeading focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-inset',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">Log out</span>}
          </button>
        </div>
      </div>

      {/* Border hover zone: full height so arrow shows when hovering logo or menu items; arrow stays near logo */}
      <div
        className="absolute -right-4 top-0 bottom-0 w-12 z-50"
        onMouseEnter={() => setBorderHovered(true)}
        onMouseLeave={() => setBorderHovered(false)}
        aria-hidden
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={clsx(
            'absolute -right-0 top-[3.4rem] h-8 w-8 -translate-y-1/2 translate-x-0 rounded-full',
            'flex items-center justify-center shrink-0',
            'border border-brand-border bg-brand-bgCard text-brand-textMuted shadow-md',
            'transition-opacity duration-200 hover:bg-brand-divider hover:text-brand-textHeading hover:border-brand-borderLight',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-sidebar',
            borderHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
