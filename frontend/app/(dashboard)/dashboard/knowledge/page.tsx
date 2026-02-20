'use client';

import { useRouter } from 'next/navigation';
import { useBots } from '@/hooks/useBots';
import { DataTable } from '@/components/ui/DataTable';
import { BookOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Bot } from '@/lib/api';

const BOT_COLUMNS = [
  { id: 'name', label: 'Bot name', accessor: 'name' as const },
  { id: 'description', label: 'Description', accessor: 'description' as const },
  { id: 'tone', label: 'Tone', accessor: 'tone' as const },
];

export default function KnowledgePage() {
  const router = useRouter();
  const { bots, isLoading: botsLoading } = useBots();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-brand-textHeading">Knowledge Base</h1>
        <p className="mt-1 text-sm text-brand-textMuted">
          Choose a bot to manage its knowledge. You’ll open a dedicated page for that bot’s sources and uploads.
        </p>
      </div>

      <DataTable<Bot>
        title="Bots"
        description="Click “View” to open this bot’s knowledge page."
        searchPlaceholder="Search bots..."
        columns={BOT_COLUMNS}
        data={bots}
        getRowId={(row) => row.id}
        getSearchableText={(row) => `${row.name} ${row.description} ${row.tone}`}
        isLoading={botsLoading}
        emptyMessage={
          <EmptyState
            icon={<BookOpen className="w-10 h-10 mx-auto" />}
            title="No bots yet"
            description="Create a bot first from My Bots, then come back to add knowledge."
          />
        }
        actions={{
          onView: (row) => router.push(`/dashboard/knowledge/${row.id}`),
        }}
      />
    </div>
  );
}
