'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBots } from '@/hooks/useBots';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useAnalytics } from '@/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Bot,
  BookOpen,
  Plug,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Settings,
  Plus,
  BarChart3,
  Smile,
  Meh,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const SENTIMENT_COLORS = { positive: '#22C55E', negative: '#EF4444', neutral: '#9CA3AF' };

function StatCard({
  icon: Icon,
  value,
  label,
  subLabel,
  href,
  accent = 'primary',
  delay = 0,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  subLabel?: string;
  href?: string;
  accent?: 'primary' | 'success' | 'accent';
  delay?: number;
}) {
  const accentClasses = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    success: 'bg-brand-success/10 text-brand-success border-brand-success/20',
    accent: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
  };
  const Wrapper = href ? Link : 'div';
  const wrapperProps = href ? { href } : {};
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Wrapper
        {...wrapperProps}
        className="block rounded-2xl border border-white/10 glass-dashboard hover:border-white/15 hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-200 overflow-hidden group"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className={`rounded-xl border p-3 ${accentClasses[accent]}`}>
              <Icon className="h-6 w-6" />
            </div>
            {href && (
              <span className="text-brand-textMuted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all shrink-0">
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </div>
          <p className="text-2xl font-semibold text-brand-textHeading tabular-nums mt-2">{value}</p>
          <p className="text-sm font-medium text-brand-textHeading">{label}</p>
          {subLabel && <p className="text-xs text-brand-textMuted mt-0.5">{subLabel}</p>}
        </div>
      </Wrapper>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { bots, isLoading: botsLoading, isError, refetch } = useBots();
  const { sources, isLoading: sourcesLoading } = useKnowledge();
  const { categories: integrationCategories } = useIntegrations();
  const firstBotId = bots.length > 0 ? (bots.find((b) => b.status === 'published') ?? bots[0]).id : null;
  const {
    totalConversations,
    totalMessages,
    dailyUsage,
    sentimentDistribution,
    isLoading: analyticsLoading,
  } = useAnalytics(firstBotId);

  const publishedCount = bots.filter((b) => b.status === 'published').length;
  const totalSources = sources.length;
  const connectedIntegrations = integrationCategories.flatMap((c) => c.integrations).filter((i) => i.connected).length;

  const isLoading = botsLoading;
  const recentBots = bots.slice(0, 5);

  const sentimentData = [
    { name: 'Positive', value: sentimentDistribution.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Negative', value: sentimentDistribution.negative, color: SENTIMENT_COLORS.negative },
    { name: 'Neutral', value: sentimentDistribution.neutral, color: SENTIMENT_COLORS.neutral },
  ].filter((d) => d.value > 0);

  const showCharts = bots.length > 0;

  const quickActions = [
    {
      href: '/dashboard/agents/new',
      icon: Plus,
      label: 'Create new agent',
      description: 'Build an AI agent with your tone, knowledge, and tools.',
      cta: 'Get started',
      hero: true,
      gradient: 'from-brand-primary/20 via-brand-primary/10 to-transparent',
      borderGlow: 'hover:shadow-glow-primary',
    },
    {
      href: '/dashboard/agents',
      icon: Bot,
      label: 'My Agents',
      description: 'Edit, publish, and manage all your agents.',
      hero: false,
      gradient: 'from-brand-primary/10 to-transparent',
      borderGlow: 'hover:shadow-brand-primary/10',
    },
    {
      href: '/dashboard/knowledge',
      icon: BookOpen,
      label: 'Knowledge Base',
      description: 'Upload PDFs, URLs, or paste text to train agents.',
      hero: false,
      gradient: 'from-brand-accent/10 to-transparent',
      borderGlow: 'hover:shadow-glow-accent',
    },
    {
      href: '/dashboard/integrations',
      icon: Plug,
      label: 'Integrations',
      description: 'Connect Google Calendar, Sheets, and more.',
      hero: false,
      gradient: 'from-brand-primary/10 to-transparent',
      borderGlow: 'hover:shadow-brand-primary/10',
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: 'Settings',
      description: 'API keys, team, and preferences.',
      hero: false,
      gradient: 'from-brand-border to-transparent',
      borderGlow: 'hover:shadow-lg',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="relative">
        <h1 className="text-2xl font-semibold text-brand-textHeading">Dashboard</h1>
        <p className="mt-1 text-sm text-brand-textMuted">
          Overview of your AI support agents, knowledge, and analytics
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Bot}
          value={isLoading ? '—' : bots.length}
          label="Total agents"
          subLabel={publishedCount > 0 ? `${publishedCount} published` : undefined}
          href="/dashboard/agents"
          accent="primary"
          delay={0}
        />
        <StatCard
          icon={CheckCircle2}
          value={isLoading ? '—' : publishedCount}
          label="Published"
          subLabel="Live and embeddable"
          href="/dashboard/agents"
          accent="success"
          delay={0.05}
        />
        <StatCard
          icon={BookOpen}
          value={sourcesLoading ? '—' : totalSources}
          label="Knowledge sources"
          subLabel="PDFs, URLs, text"
          href="/dashboard/knowledge"
          accent="accent"
          delay={0.1}
        />
        <StatCard
          icon={Plug}
          value={connectedIntegrations}
          label="Integrations"
          subLabel="Connected services"
          href="/dashboard/integrations"
          accent="primary"
          delay={0.15}
        />
      </div>

      {/* Charts row */}
      {showCharts && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Activity overview – conversations over time */}
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-white/10 glass-dashboard-strong p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-primary" />
                <h2 className="font-semibold text-brand-textHeading">Activity</h2>
              </div>
              {firstBotId && (
                <Link
                  href={`/dashboard/agents/${firstBotId}?tab=analytics`}
                  className="text-sm font-medium text-brand-primary hover:underline"
                >
                  Full analytics →
                </Link>
              )}
            </div>
            <p className="text-sm text-brand-textMuted mb-4">
              Conversations over time {firstBotId && '(primary agent)'}
            </p>
            <div className="h-56">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center text-brand-textMuted text-sm">
                  Loading…
                </div>
              ) : dailyUsage.length === 0 ? (
                <div className="h-full flex items-center justify-center text-brand-textMuted text-sm rounded-xl bg-white/[0.02] border border-white/5">
                  No conversation data yet. Publish an agent and chat to see trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyUsage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="conversationsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="rgba(255,255,255,0.06)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                      }}
                      labelStyle={{ color: '#F9FAFB' }}
                      formatter={(value: number) => [value, 'Conversations']}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fill="url(#conversationsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sentiment */}
          <div className="overflow-hidden rounded-2xl border border-white/10 glass-dashboard-strong p-6">
            <div className="flex items-center gap-2 mb-4">
              <Smile className="h-5 w-5 text-brand-primary" />
              <h2 className="font-semibold text-brand-textHeading">Sentiment</h2>
            </div>
            <p className="text-sm text-brand-textMuted mb-4">Conversation sentiment (primary agent)</p>
            <div className="h-56 flex items-center justify-center">
              {analyticsLoading ? (
                <span className="text-brand-textMuted text-sm">Loading…</span>
              ) : sentimentData.length === 0 ? (
                <div className="text-center text-brand-textMuted text-sm">
                  <Meh className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No sentiment data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(15,23,42,0.8)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {sentimentData.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {sentimentDistribution.positive > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-textMuted">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> Positive {sentimentDistribution.positive}
                  </span>
                )}
                {sentimentDistribution.neutral > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-textMuted">
                    <span className="w-2 h-2 rounded-full bg-gray-400" /> Neutral {sentimentDistribution.neutral}
                  </span>
                )}
                {sentimentDistribution.negative > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-textMuted">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Negative {sentimentDistribution.negative}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick actions – bento style */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
      >
        <h2 className="flex items-center gap-2 font-semibold text-brand-textHeading mb-4">
          <Zap className="h-5 w-5 text-brand-primary" />
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 grid-rows-[auto_auto]">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            const isHero = action.hero;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                className={isHero ? 'sm:col-span-2 lg:col-span-2' : ''}
              >
                <Link
                  href={action.href}
                  className={`group block h-full rounded-2xl border border-white/10 glass-dashboard-strong overflow-hidden bg-gradient-to-br ${action.gradient} hover:border-brand-primary/30 ${action.borderGlow} hover:scale-[1.01] active:scale-[0.99] transition-all duration-200`}
                >
                  <div className={`p-6 ${isHero ? 'flex flex-col sm:flex-row items-start sm:items-center gap-6' : ''}`}>
                    <div
                      className={`rounded-2xl border border-white/10 bg-white/5 p-4 text-brand-primary group-hover:bg-brand-primary/15 group-hover:border-brand-primary/30 transition-all shrink-0 ${
                        isHero ? 'sm:p-5' : ''
                      }`}
                    >
                      <Icon className={isHero ? 'h-10 w-10' : 'h-8 w-8'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-brand-textHeading group-hover:text-brand-primary transition-colors">
                        {action.label}
                      </h3>
                      <p className={`text-brand-textMuted mt-1 ${isHero ? 'text-sm' : 'text-sm'}`}>
                        {action.description}
                      </p>
                      {isHero && (
                        <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-brand-primary">
                          {action.cta}
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                    {!isHero && (
                      <ArrowRight className="h-5 w-5 text-brand-textMuted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent agents */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.5 }}
        className="overflow-hidden rounded-2xl border border-white/10 glass-dashboard-strong transition-shadow hover:shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="font-semibold text-brand-textHeading">Recent agents</h2>
          {bots.length > 0 && (
            <Link
              href="/dashboard/agents"
              className="text-sm font-medium text-brand-primary hover:text-brand-primaryLight transition-colors"
            >
              View all
            </Link>
          )}
        </div>
        <div className="p-6">
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : bots.length === 0 ? (
            <EmptyState
              icon={<Bot className="w-12 h-12" />}
              title="No agents yet"
              description="Create your first agent to get started with AI customer support."
              action={{
                label: 'Create your first agent',
                onClick: () => router.push('/dashboard/agents'),
              }}
            />
          ) : (
            <ul className="space-y-3">
              {recentBots.map((bot) => (
                <li key={bot.id}>
                  <Link
                    href={`/dashboard/agents/${bot.id}`}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.06] hover:border-brand-primary/20 hover:shadow-md transition-all duration-200 group"
                  >
                    <div
                      className={`rounded-lg p-2 ${
                        bot.status === 'published'
                          ? 'bg-brand-success/10 text-brand-success'
                          : 'bg-brand-border text-brand-textMuted'
                      }`}
                    >
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-brand-textHeading group-hover:text-brand-primary transition-colors">
                        {bot.name}
                      </span>
                      <p className="text-sm text-brand-textMuted mt-0.5 line-clamp-1">
                        {bot.description || 'No description'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        bot.status === 'published'
                          ? 'bg-brand-success/15 text-brand-success'
                          : 'bg-brand-border text-brand-textMuted'
                      }`}
                    >
                      {bot.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-brand-textMuted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>

      {/* Insight strip */}
      {!isLoading && bots.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4 flex items-start gap-3"
        >
          <MessageSquare className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-textHeading">
              {publishedCount === 0
                ? 'Publish an agent to get your first conversations. Use the agent page to publish and copy the embed code.'
                : totalSources === 0
                  ? 'Add knowledge sources so your agents can answer from your docs, FAQs, or URLs.'
                  : 'View analytics per agent to see conversation volume and sentiment.'}
            </p>
            <Link
              href={
                publishedCount === 0
                  ? `/dashboard/agents/${recentBots[0]?.id}`
                  : totalSources === 0
                    ? '/dashboard/knowledge'
                    : `/dashboard/agents/${recentBots[0]?.id}?tab=analytics`
              }
              className="text-sm font-medium text-brand-primary hover:underline mt-1 inline-block"
            >
              {publishedCount === 0 ? 'Open agent →' : totalSources === 0 ? 'Add knowledge →' : 'Open analytics →'}
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
