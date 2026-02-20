import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { ApiKey, encryptApiKey } from '../models/ApiKey';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import type { UserRole } from '../models/User';

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
      .select('email displayName role createdAt')
      .sort({ createdAt: 1 })
      .lean();
    res.json({
      data: {
        members: members.map((m) => ({
          id: m._id.toString(),
          email: m.email,
          displayName: (m as { displayName?: string }).displayName ?? '',
          role: (m as { role?: string }).role ?? 'member',
          createdAt: m.createdAt,
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
