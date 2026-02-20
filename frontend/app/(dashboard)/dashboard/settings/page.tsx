'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Account and preferences
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Profile</h2>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">{user?.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
