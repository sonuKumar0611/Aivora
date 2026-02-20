'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization, useProfile, useApiKeys, useTeamMembers } from '@/hooks/useSettings';
import { getErrorMessage } from '@/lib/api';
import type { UserRole, ApiKeyProvider } from '@/lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import {
  Building2,
  Users,
  Key,
  User,
  Shield,
  Loader2,
  Trash2,
  Plus,
  AlertCircle,
  Pencil,
  Check,
  Sparkles,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

const INPUT_CLASS =
  'w-full rounded-lg border border-brand-borderLight bg-brand-sidebar px-3 py-2.5 text-brand-text placeholder-brand-textDisabled transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-0 focus:ring-offset-transparent disabled:opacity-60';

const LABEL_CLASS = 'block text-sm font-medium text-brand-textMuted mb-1.5';

const canAccessHigherUps = (role: UserRole) => role === 'owner' || role === 'admin';

type SettingsTabId = 'organization' | 'team' | 'api-keys' | 'profile' | 'security';

const TABS: { id: SettingsTabId; label: string; icon: typeof Building2; roles?: UserRole[] }[] = [
  { id: 'organization', label: 'Organization', icon: Building2, roles: ['owner', 'admin'] },
  { id: 'team', label: 'Team members', icon: Users, roles: ['owner', 'admin'] },
  { id: 'api-keys', label: 'AI providers', icon: Key, roles: ['owner', 'admin'] },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'member';
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');

  const visibleTabs = TABS.filter((tab) => !tab.roles || tab.roles.includes(role));

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [role, activeTab, visibleTabs]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 animate-fade-in">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-semibold text-brand-textHeading">Settings</h1>
        <p className="mt-1 text-sm text-brand-textMuted">Account, organization, and preferences</p>
      </div>

      <div className="flex flex-shrink-0 flex-wrap gap-1 rounded-lg border border-brand-borderLight bg-brand-sidebar p-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-bgCard text-brand-textHeading shadow-sm' : 'text-brand-textMuted hover:text-brand-text'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 flex flex-col">
        {activeTab === 'organization' && <OrganizationTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'api-keys' && <ApiKeysTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}

function OrganizationTab() {
  const { organization, isLoading, isError, refetch, update, updateError } = useOrganization();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setSlug(organization.slug);
    }
  }, [organization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const payload: { name?: string; slug?: string } = {};
    if (name.trim()) payload.name = name.trim();
    if (slug.trim()) payload.slug = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!Object.keys(payload).length) {
      toast.error('Enter at least one field to update');
      return;
    }
    update.mutate(payload, {
      onSuccess: () => {
        toast.success('Organization updated');
        setTouched(false);
      },
      onError: () => {
        toast.error(updateError ?? 'Failed to update');
      },
    });
  };

  if (isLoading || !organization) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="flex-1 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex-1 py-12">
          <ErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <h2 className="font-semibold text-brand-textHeading">Organization details</h2>
        <p className="mt-1 text-sm text-brand-textMuted">Only owners and admins can update these.</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          {updateError && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-error/10 border border-brand-error/30 px-3 py-2 text-sm text-brand-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {updateError}
            </div>
          )}
          <div>
            <label htmlFor="org-name" className={LABEL_CLASS}>Organization name</label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="My Organization"
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="org-slug" className={LABEL_CLASS}>Slug (URL-friendly)</label>
            <input
              id="org-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={INPUT_CLASS}
              placeholder="my-org"
              maxLength={80}
            />
            <p className="mt-1 text-xs text-brand-textMuted">Lowercase letters, numbers, and hyphens only.</p>
          </div>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TeamTab() {
  const { members, isLoading, isError, refetch } = useTeamMembers();

  if (isLoading) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex-1 py-12">
          <ErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <h2 className="font-semibold text-brand-textHeading">Team members</h2>
        <p className="mt-1 text-sm text-brand-textMuted">People in your organization. Invites can be added later.</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <ul className="divide-y divide-brand-border">
          {members.length === 0 ? (
            <li className="py-4 text-sm text-brand-textMuted">No other members yet.</li>
          ) : (
            members.map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-brand-textHeading">{m.displayName || m.email}</p>
                  <p className="text-sm text-brand-textMuted">{m.email}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-brand-divider text-brand-textMuted capitalize">
                  {m.role}
                </span>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

const AI_PROVIDERS: { id: ApiKeyProvider; name: string; icon: typeof Sparkles }[] = [
  { id: 'openai', name: 'OpenAI', icon: Sparkles },
];

function ApiKeysTab() {
  const { apiKeys, isLoading, isError, refetch, create, remove, createError } = useApiKeys();
  const [editingProvider, setEditingProvider] = useState<ApiKeyProvider | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getKeyForProvider = (provider: ApiKeyProvider) =>
    apiKeys.find((k) => k.provider === provider) ?? apiKeys.find((k) => (k.provider ?? 'openai') === provider);

  const handleAddOrUpdate = (provider: ApiKeyProvider) => {
    const key = keyInput.trim();
    if (!key) {
      toast.error('Enter your API key');
      return;
    }
    create.mutate(
      { provider, key },
      {
        onSuccess: () => {
          toast.success('API key saved. It won’t be shown again in full.');
          setKeyInput('');
          setEditingProvider(null);
        },
        onError: () => {
          toast.error(createError ?? 'Failed to save key');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => {
        toast.success('API key removed');
        setDeleteId(null);
      },
      onError: () => {
        toast.error(getErrorMessage(remove.error));
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex-1 py-12">
          <ErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <h2 className="font-semibold text-brand-textHeading">AI providers</h2>
        <p className="mt-1 text-sm text-brand-textMuted">Manage your AI provider API keys. Keys are stored securely and used for your organization.</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {createError && (
          <div className="flex items-center gap-2 rounded-lg bg-brand-error/10 border border-brand-error/30 px-3 py-2 text-sm text-brand-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {createError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AI_PROVIDERS.map((provider) => {
            const saved = getKeyForProvider(provider.id);
            const isEditing = editingProvider === provider.id;
            const Icon = provider.icon;
            return (
              <div
                key={provider.id}
                className="rounded-xl border border-brand-border bg-brand-sidebar p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-divider text-brand-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-brand-textHeading truncate">{provider.name}</h3>
                    <p className="text-xs text-brand-textMuted">API Key</p>
                  </div>
                  {saved && !isEditing && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500" title="Configured">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                {saved && !isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={saved.keyPrefix}
                      className={clsx(INPUT_CLASS, 'font-mono text-sm')}
                    />
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProvider(provider.id);
                          setKeyInput('');
                        }}
                        className="rounded-lg p-2 text-brand-textMuted hover:bg-brand-divider hover:text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        title="Edit key"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(saved.id)}
                        className="rounded-lg p-2 text-brand-textMuted hover:bg-brand-error/10 hover:text-brand-error focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        title="Remove key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="sk-..."
                      className={INPUT_CLASS}
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={create.isPending || !keyInput.trim()}
                      onClick={() => handleAddOrUpdate(provider.id)}
                    >
                      {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved && isEditing ? null : <Plus className="h-4 w-4" />}
                      {saved && isEditing ? 'Update' : 'Add'}
                    </Button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setEditingProvider(null)}
                        className="text-sm text-brand-textMuted hover:text-brand-text"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {deleteId && (
        <ConfirmModal
          title="Remove API key?"
          description="This key will no longer be used for this provider. You can add a new key anytime."
          confirmLabel="Remove"
          variant="danger"
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => handleDelete(deleteId)}
          isLoading={remove.isPending}
        />
      )}
    </Card>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const { profile, isLoading, isError, refetch, update, updateError } = useProfile();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName ?? '');
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { displayName: displayName.trim() || undefined },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: () => toast.error(updateError ?? 'Failed to update'),
      }
    );
  };

  if (isLoading || !profile) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
        <CardContent className="flex-1 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex-1 py-12">
          <ErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <h2 className="font-semibold text-brand-textHeading">Profile</h2>
        <p className="mt-1 text-sm text-brand-textMuted">Your personal information and demographics.</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          {updateError && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-error/10 border border-brand-error/30 px-3 py-2 text-sm text-brand-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {updateError}
            </div>
          )}
          <div>
            <label htmlFor="profile-email" className={LABEL_CLASS}>Email</label>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              readOnly
              className={clsx(INPUT_CLASS, 'opacity-80 cursor-not-allowed')}
            />
            <p className="mt-1 text-xs text-brand-textMuted">Email cannot be changed here.</p>
          </div>
          <div>
            <label htmlFor="profile-displayName" className={LABEL_CLASS}>Display name</label>
            <input
              id="profile-displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Your name"
              maxLength={100}
            />
          </div>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const { changePassword, changePasswordError } = useProfile();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('Password updated');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: () => {
          toast.error(changePasswordError ?? 'Failed to update password');
        },
      }
    );
  };

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <h2 className="font-semibold text-brand-textHeading">Security</h2>
        <p className="mt-1 text-sm text-brand-textMuted">Change your password.</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
          {changePasswordError && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-error/10 border border-brand-error/30 px-3 py-2 text-sm text-brand-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {changePasswordError}
            </div>
          )}
          <div>
            <label htmlFor="current-password" className={LABEL_CLASS}>Current password</label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="new-password" className={LABEL_CLASS}>New password</label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={LABEL_CLASS}>Confirm new password</label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
