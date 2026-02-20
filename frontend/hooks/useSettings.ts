'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type Organization, type ApiKeyItem, type ApiKeyProvider, type TeamMember } from '@/lib/api';

const settingsKeys = {
  organization: ['settings', 'organization'] as const,
  profile: ['settings', 'profile'] as const,
  apiKeys: ['settings', 'apiKeys'] as const,
  team: ['settings', 'team'] as const,
};

export function useOrganization() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: settingsKeys.organization,
    queryFn: async () => {
      const { data } = await api.get<{ data: { organization: Organization } }>('/settings/organization');
      return data.data.organization;
    },
  });
  const update = useMutation({
    mutationFn: async (body: { name?: string; slug?: string }) => {
      const { data } = await api.put<{ data: { organization: Organization } }>('/settings/organization', body);
      return data.data.organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organization });
    },
  });
  return {
    organization: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    update,
    updateError: update.isError ? getErrorMessage(update.error) : null,
  };
}

export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: settingsKeys.profile,
    queryFn: async () => {
      const { data } = await api.get<{ data: { profile: { email: string; displayName: string; createdAt: string } } }>(
        '/settings/profile'
      );
      return data.data.profile;
    },
  });
  const update = useMutation({
    mutationFn: async (body: { displayName?: string }) => {
      const { data } = await api.put<{ data: { profile: { email: string; displayName: string; createdAt: string } } }>(
        '/settings/profile',
        body
      );
      return data.data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
  const changePassword = useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      await api.post('/settings/profile/change-password', body);
    },
  });
  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    update,
    changePassword,
    updateError: update.isError ? getErrorMessage(update.error) : null,
    changePasswordError: changePassword.isError ? getErrorMessage(changePassword.error) : null,
  };
}

export function useApiKeys() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: settingsKeys.apiKeys,
    queryFn: async () => {
      const { data } = await api.get<{ data: { apiKeys: ApiKeyItem[] } }>('/settings/api-keys');
      return data.data.apiKeys;
    },
  });
  const create = useMutation({
    mutationFn: async (body: { provider: ApiKeyProvider; key: string }) => {
      const { data } = await api.post<{ data: { apiKey: ApiKeyItem } }>('/settings/api-keys', body);
      return data.data.apiKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.apiKeys });
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/settings/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.apiKeys });
    },
  });
  return {
    apiKeys: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    create,
    remove,
    createError: create.isError ? getErrorMessage(create.error) : null,
  };
}

export function useTeamMembers() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: settingsKeys.team,
    queryFn: async () => {
      const { data } = await api.get<{ data: { members: TeamMember[] } }>('/settings/team');
      return data.data.members;
    },
  });
  const inviteUser = useMutation({
    mutationFn: async (body: { email: string; displayName?: string; role?: 'admin' | 'member' | 'viewer' }) => {
      const { data } = await api.post<{ data: { member: TeamMember } }>('/settings/team', body);
      return data.data.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team });
    },
  });
  const resendInvite = useMutation({
    mutationFn: async (memberId: string) => {
      await api.post(`/settings/team/${memberId}/resend-invite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team });
    },
  });
  const updateMember = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { displayName?: string; role?: 'admin' | 'member' | 'viewer' };
    }) => {
      const { data } = await api.put<{ data: { member: TeamMember } }>(`/settings/team/${id}`, body);
      return data.data.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team });
    },
  });
  const removeOrSuspendMember = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/settings/team/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team });
    },
  });
  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    inviteUser,
    resendInvite,
    updateMember,
    removeOrSuspendMember,
  };
}
