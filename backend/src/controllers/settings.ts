import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { ApiKey, encryptApiKey } from '../models/ApiKey';
import { OrganizationIntegration } from '../models/OrganizationIntegration';
import type { IntegrationProvider } from '../models/OrganizationIntegration';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import type { UserRole } from '../models/User';
import { sendInviteEmail } from '../services/email';
import { env } from '../utils/env';

const ROLES_HIGHER_UPS: UserRole[] = ['owner', 'admin'];

function canAccessHigherUps(req: AuthRequest): boolean {
  return !!req.user && ROLES_HIGHER_UPS.includes(req.user.role);
}

const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120).optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens').optional(),
});

export async function getOrganization(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const org = await Organization.findById(req.user.organizationId);
    if (!org) {
      throw new ApiError('Organization not found', 404);
    }
    res.json({
      data: {
        organization: {
          id: org._id.toString(),
          name: org.name,
          slug: org.slug,
          updatedAt: org.updatedAt,
        },
      },
      message: 'OK',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function updateOrganization(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can update organization details', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const body = updateOrganizationSchema.parse(req.body);
    const org = await Organization.findById(u.organizationId);
    if (!org) {
      throw new ApiError('Organization not found', 404);
    }
    if (body.slug !== undefined) {
      const existing = await Organization.findOne({ slug: body.slug, _id: { $ne: org._id } });
      if (existing) {
        throw new ApiError('This slug is already in use', 400);
      }
      org.slug = body.slug;
    }
    if (body.name !== undefined) org.name = body.name;
    await org.save();
    res.json({
      data: {
        organization: {
          id: org._id.toString(),
          name: org.name,
          slug: org.slug,
          updatedAt: org.updatedAt,
        },
      },
      message: 'Organization updated',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
});

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.id).select('email displayName createdAt');
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    res.json({
      data: {
        profile: {
          email: user.email,
          displayName: (user as { displayName?: string }).displayName ?? '',
          createdAt: user.createdAt,
        },
      },
      message: 'OK',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    if (body.displayName !== undefined) (user as { displayName?: string }).displayName = body.displayName;
    await user.save();
    const updated = await User.findById(req.user!.id).select('email displayName');
    res.json({
      data: {
        profile: {
          email: updated!.email,
          displayName: (updated as { displayName?: string })?.displayName ?? '',
          createdAt: (updated as { createdAt: Date }).createdAt,
        },
      },
      message: 'Profile updated',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

const updateOnboardingSchema = z.object({
  step: z.number().int().min(0).max(10).optional(),
  completed: z.boolean().optional(),
});

export async function updateOnboarding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateOnboardingSchema.parse(req.body);
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    const u = user as { onboardingStep?: number; onboardingCompleted?: boolean };
    if (body.step !== undefined) u.onboardingStep = body.step;
    if (body.completed === true) {
      u.onboardingCompleted = true;
      u.onboardingStep = 0; // reset for consistency
    }
    await user.save();
    res.json({
      data: {
        onboarding: {
          step: u.onboardingStep ?? 0,
          completed: u.onboardingCompleted ?? false,
        },
      },
      message: 'Onboarding updated',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function listApiKeys(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can manage API keys', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const keys = await ApiKey.find({ organizationId: u.organizationId })
      .sort({ createdAt: -1 })
      .select('_id provider label keyPrefix lastUsedAt createdAt')
      .lean();
    res.json({
      data: {
        apiKeys: keys.map((k) => ({
          id: k._id.toString(),
          provider: (k as { provider?: string }).provider ?? 'openai',
          label: k.label,
          keyPrefix: k.keyPrefix,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
        })),
      },
      message: 'OK',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

const PROVIDER_LABELS: Record<string, string> = { openai: 'OpenAI' };

const createApiKeySchema = z.object({
  provider: z.enum(['openai']),
  key: z.string().min(1, 'API key is required'),
});

export async function createApiKey(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can create API keys', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const body = createApiKeySchema.parse(req.body);
    const { encrypted, hash, prefix } = encryptApiKey(body.key);
    const label = PROVIDER_LABELS[body.provider] ?? body.provider;
    const doc = await ApiKey.findOneAndUpdate(
      { organizationId: u.organizationId, provider: body.provider },
      {
        organizationId: u.organizationId,
        provider: body.provider,
        label,
        keyHash: hash,
        keyPrefix: prefix,
        encryptedValue: encrypted,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const created = !!(doc as { createdAt?: Date }).createdAt;
    res.status(created ? 201 : 200).json({
      data: {
        apiKey: {
          id: doc._id.toString(),
          provider: body.provider,
          label: doc.label,
          keyPrefix: prefix,
          createdAt: doc.createdAt,
        },
      },
      message: created ? 'API key saved. It will not be shown again in full.' : 'API key updated.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function deleteApiKey(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can delete API keys', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const keyId = req.params.id;
    const key = await ApiKey.findOne({
      _id: keyId,
      organizationId: u.organizationId,
    });
    if (!key) {
      throw new ApiError('API key not found', 404);
    }
    await ApiKey.deleteOne({ _id: keyId });
    res.json({ data: { deleted: true }, message: 'API key deleted' });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  });

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user!.id).select('+password');
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    const match = await bcrypt.compare(body.currentPassword, user.password);
    if (!match) {
      throw new ApiError('Current password is incorrect', 400);
    }
    user.password = await bcrypt.hash(body.newPassword, 12);
    await user.save();
    res.json({ data: { ok: true }, message: 'Password updated' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function listTeamMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can view team members', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const members = await User.find({ organizationId: u.organizationId })
      .select('email displayName role status createdAt updatedAt invitedAt')
      .sort({ createdAt: 1 })
      .lean();
    res.json({
      data: {
        members: members.map((m) => ({
          id: m._id.toString(),
          email: m.email,
          displayName: (m as { displayName?: string }).displayName ?? '',
          role: (m as { role?: string }).role ?? 'member',
          status: (m as { status?: string }).status ?? 'active',
          createdAt: (m as { createdAt: Date }).createdAt,
          updatedAt: (m as { updatedAt?: Date }).updatedAt ?? (m as { createdAt: Date }).createdAt,
          invitedAt: (m as { invitedAt?: Date }).invitedAt,
        })),
      },
      message: 'OK',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  displayName: z.string().max(100).optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const INVITE_TOKEN_EXPIRY_DAYS = 7;

export async function inviteMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can invite members', 403);
    }
    const inviter = req.user!;
    if (!inviter.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const body = inviteMemberSchema.parse(req.body);
    const email = body.email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.organizationId?.toString() === inviter.organizationId.toString()) {
        throw new ApiError('This user is already in your organization', 400);
      }
      throw new ApiError('Email already registered to another organization', 400);
    }
    const org = await Organization.findById(inviter.organizationId);
    if (!org) {
      throw new ApiError('Organization not found', 404);
    }
    const tempPassword = crypto.randomBytes(8).toString('base64').replace(/[+/=]/g, (c) => ({ '+': 'x', '/': 'y', '=': '' }[c] ?? '')).slice(0, 12);
    const hashed = await bcrypt.hash(tempPassword, 12);
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const member = await User.create({
      email,
      password: hashed,
      role: body.role,
      organizationId: inviter.organizationId,
      displayName: body.displayName?.trim() ?? '',
      status: 'pending_invite',
      inviteToken,
      inviteTokenExpiresAt,
      invitedAt: new Date(),
      invitedBy: inviter.id,
      onboardingCompleted: true,
      onboardingStep: 0,
    });
    const frontendUrl = env.FRONTEND_URL.replace(/\/$/, '');
    const acceptInviteUrl = `${frontendUrl}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
    await sendInviteEmail({
      to: email,
      inviterName: (inviter.displayName ?? inviter.email) || 'A team admin',
      organizationName: org.name,
      tempPassword,
      acceptInviteUrl,
    });
    res.status(201).json({
      data: {
        member: {
          id: member._id.toString(),
          email: member.email,
          displayName: (member as { displayName?: string }).displayName ?? '',
          role: (member as { role?: string }).role ?? 'member',
          status: 'pending_invite',
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          invitedAt: member.invitedAt,
        },
      },
      message: 'Invitation sent',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function resendInvite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can resend invites', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const memberId = req.params.id;
    const member = await User.findOne({
      _id: memberId,
      organizationId: u.organizationId,
    }).select('+inviteToken +inviteTokenExpiresAt email displayName status');
    if (!member) {
      throw new ApiError('Member not found', 404);
    }
    const m = member as { status?: string; inviteToken?: string; inviteTokenExpiresAt?: Date };
    if (m.status !== 'pending_invite') {
      throw new ApiError('User has already accepted the invite', 400);
    }
    const tempPassword = crypto.randomBytes(8).toString('base64').replace(/[+/=]/g, (c) => ({ '+': 'x', '/': 'y', '=': '' }[c] ?? '')).slice(0, 12);
    const hashed = await bcrypt.hash(tempPassword, 12);
    member.password = hashed;
    const inviteToken = crypto.randomBytes(32).toString('hex');
    (member as { inviteToken?: string }).inviteToken = inviteToken;
    (member as { inviteTokenExpiresAt?: Date }).inviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await member.save();
    const org = await Organization.findById(u.organizationId);
    const frontendUrl = env.FRONTEND_URL.replace(/\/$/, '');
    const acceptInviteUrl = `${frontendUrl}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
    await sendInviteEmail({
      to: member.email,
      inviterName: (u.displayName ?? u.email) || 'A team admin',
      organizationName: org?.name ?? 'Your organization',
      tempPassword,
      acceptInviteUrl,
    });
    res.json({
      data: { ok: true },
      message: 'Invitation resent',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

const updateMemberSchema = z.object({
  displayName: z.string().max(100).optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
});

export async function updateMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can update members', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const memberId = req.params.id;
    const member = await User.findOne({
      _id: memberId,
      organizationId: u.organizationId,
    });
    if (!member) {
      throw new ApiError('Member not found', 404);
    }
    if ((member as { role?: string }).role === 'owner') {
      throw new ApiError('Cannot change owner details', 403);
    }
    const body = updateMemberSchema.parse(req.body);
    if (body.displayName !== undefined) (member as { displayName?: string }).displayName = body.displayName;
    if (body.role !== undefined) (member as { role?: string }).role = body.role;
    await member.save();
    res.json({
      data: {
        member: {
          id: member._id.toString(),
          email: member.email,
          displayName: (member as { displayName?: string }).displayName ?? '',
          role: (member as { role?: string }).role ?? 'member',
          status: (member as { status?: string }).status ?? 'active',
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          invitedAt: (member as { invitedAt?: Date }).invitedAt,
        },
      },
      message: 'Member updated',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function removeOrSuspendMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can remove or suspend members', 403);
    }
    const u = req.user!;
    if (!u.organizationId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const memberId = req.params.id;
    const member = await User.findOne({
      _id: memberId,
      organizationId: u.organizationId,
    });
    if (!member) {
      throw new ApiError('Member not found', 404);
    }
    const m = member as { role?: string; status?: string };
    if (m.role === 'owner') {
      throw new ApiError('Cannot remove or suspend the owner', 403);
    }
    if (m.status === 'pending_invite') {
      await User.deleteOne({ _id: memberId });
      res.json({
        data: { removed: true, wasPending: true },
        message: 'Invite removed',
      });
      return;
    }
    (member as { status?: string }).status = 'suspended';
    await member.save();
    res.json({
      data: { removed: false, suspended: true },
      message: 'Member suspended',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

// --- Integrations (org-level, higher ups only) ---

export const INTEGRATION_CATALOG: {
  id: IntegrationProvider;
  name: string;
  description: string;
  category: string;
}[] = [
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Manage calendar events and schedule appointments.',
    category: 'Productivity',
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Read and write data to Google Sheets spreadsheets.',
    category: 'Productivity',
  },
];

export async function listIntegrations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can manage integrations', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const connections = await OrganizationIntegration.find({
      organizationId: orgId,
      status: 'connected',
    })
      .lean()
      .exec();
    const connectedSet = new Set(connections.map((c) => (c as { provider?: string }).provider));
    const connectedAtMap = new Map(
      connections.map((c) => [(c as { provider?: string }).provider, (c as { connectedAt?: Date }).connectedAt])
    );
    const byCategory = new Map<string, typeof INTEGRATION_CATALOG>();
    for (const item of INTEGRATION_CATALOG) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    const list = Array.from(byCategory.entries()).map(([category, items]) => ({
      category,
      integrations: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        category: i.category,
        connected: connectedSet.has(i.id),
        connectedAt: connectedAtMap.get(i.id),
      })),
    }));
    res.json({
      data: { categories: list },
      message: 'OK',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function connectIntegration(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can manage integrations', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const provider = req.params.provider as IntegrationProvider;
    if (!INTEGRATION_CATALOG.some((i) => i.id === provider)) {
      throw new ApiError('Unknown integration', 400);
    }
    const existing = await OrganizationIntegration.findOne({
      organizationId: orgId,
      provider,
    });
    if (existing) {
      (existing as { status?: string }).status = 'connected';
      (existing as { connectedAt?: Date }).connectedAt = new Date();
      (existing as { disconnectedAt?: Date }).disconnectedAt = undefined;
      await existing.save();
    } else {
      await OrganizationIntegration.create({
        organizationId: orgId,
        provider,
        status: 'connected',
        connectedAt: new Date(),
      });
    }
    res.json({
      data: { provider, connected: true },
      message: 'Integration connected',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}

export async function disconnectIntegration(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canAccessHigherUps(req)) {
      throw new ApiError('Only owners and admins can manage integrations', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const provider = req.params.provider as IntegrationProvider;
    await OrganizationIntegration.findOneAndUpdate(
      { organizationId: orgId, provider },
      { status: 'disconnected', disconnectedAt: new Date() },
      { new: true }
    );
    res.json({
      data: { provider, connected: false },
      message: 'Integration disconnected',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}
