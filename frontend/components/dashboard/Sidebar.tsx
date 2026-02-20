'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessageSquare,
  BarChart3,
  Settings,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/bots', label: 'My Bots', icon: Bot },
  { href: '/dashboard/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { href: '/dashboard/chat', label: 'Test Chat', icon: MessageSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-brand-border bg-brand-sidebar">
      <div className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-brand-textHeading">
          Aivora
        </Link>
      </div>
      <nav className="px-3 py-2 space-y-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-brand-divider text-white [&_svg]:text-brand-link'
                  : 'text-brand-textMuted hover:bg-brand-divider/70 hover:text-brand-textHeading'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
