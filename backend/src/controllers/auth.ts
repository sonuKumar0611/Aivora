import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { env } from '../utils/env';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/email';

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      throw new ApiError('Email already registered', 400);
    }
    const org = await Organization.create({
      name: 'My Organization',
      slug: `org-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    });
    const hashed = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      email: body.email.toLowerCase(),
      password: hashed,
      role: 'owner',
      organizationId: org._id,
    });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const u = user as { onboardingStep?: number; onboardingCompleted?: boolean };
    res.status(201).json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: 'owner',
          organizationId: org._id.toString(),
          displayName: user.displayName ?? '',
          onboardingStep: u.onboardingStep ?? 0,
          onboardingCompleted: u.onboardingCompleted ?? false,
        },
        token,
        expiresIn: '7d',
      },
      message: 'Account created',
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: 'Bad request', message: err.message });
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() }).select('+password role organizationId displayName status onboardingStep onboardingCompleted');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials', message: 'Email or password incorrect' });
      return;
    }
    const uStatus = user as { status?: string };
    if (uStatus.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended', message: 'Your account has been suspended. Contact your organization admin.' });
      return;
    }
    if (uStatus.status === 'pending_invite') {
      res.status(403).json({ error: 'Invite pending', message: 'Please accept your invite using the link sent to your email before logging in.' });
      return;
    }
    const match = await bcrypt.compare(body.password, user.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials', message: 'Email or password incorrect' });
      return;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const orgId = user.organizationId?.toString() ?? null;
    const uOut = user as { role?: string; displayName?: string; onboardingStep?: number; onboardingCompleted?: boolean };
    res.json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: uOut.role ?? 'owner',
          organizationId: orgId,
          displayName: uOut.displayName ?? '',
          onboardingStep: uOut.onboardingStep ?? 0,
          onboardingCompleted: uOut.onboardingCompleted ?? false,
        },
        token,
        expiresIn: '7d',
      },
      message: 'Logged in',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          organizationId: req.user.organizationId,
          displayName: req.user.displayName ?? '',
          onboardingStep: req.user.onboardingStep ?? 0,
          onboardingCompleted: req.user.onboardingCompleted ?? false,
        },
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

const RESET_TOKEN_BYTES = 32;
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    // Always return success to avoid email enumeration
    if (!user) {
      res.json({ data: { sent: true }, message: 'If that email is registered, we sent a reset link.' });
      return;
    }
    const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
    (user as { passwordResetToken?: string }).passwordResetToken = token;
    (user as { passwordResetExpires?: Date }).passwordResetExpires = new Date(Date.now() + RESET_EXPIRY_MS);
    await user.save();
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      expiresInMinutes: Math.floor(RESET_EXPIRY_MS / 60000),
    });
    res.json({ data: { sent: true }, message: 'If that email is registered, we sent a reset link.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const user = await User.findOne({
      passwordResetToken: body.token,
    })
      .select('+password +passwordResetToken +passwordResetExpires')
      .exec();
    if (!user) {
      res.status(400).json({ error: 'Invalid link', message: 'Reset link is invalid or has expired' });
      return;
    }
    const u = user as { passwordResetExpires?: Date };
    if (u.passwordResetExpires && u.passwordResetExpires < new Date()) {
      res.status(400).json({ error: 'Link expired', message: 'This reset link has expired. Request a new one.' });
      return;
    }
    user.password = await bcrypt.hash(body.newPassword, 12);
    (user as { passwordResetToken?: string }).passwordResetToken = undefined;
    (user as { passwordResetExpires?: Date }).passwordResetExpires = undefined;
    await user.save();
    res.json({ data: { ok: true }, message: 'Password updated. You can log in with your new password.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = acceptInviteSchema.parse(req.body);
    const user = await User.findOne({
      inviteToken: body.token,
      status: 'pending_invite',
    })
      .select('+password +inviteToken +inviteTokenExpiresAt')
      .exec();
    if (!user) {
      res.status(400).json({ error: 'Invalid invite', message: 'Invite link is invalid or has expired' });
      return;
    }
    const u = user as { inviteTokenExpiresAt?: Date };
    if (u.inviteTokenExpiresAt && u.inviteTokenExpiresAt < new Date()) {
      res.status(400).json({ error: 'Invite expired', message: 'This invite link has expired' });
      return;
    }
    user.password = await bcrypt.hash(body.newPassword, 12);
    (user as { status?: string }).status = 'active';
    (user as { inviteToken?: string }).inviteToken = undefined;
    (user as { inviteTokenExpiresAt?: Date }).inviteTokenExpiresAt = undefined;
    (user as { onboardingCompleted?: boolean }).onboardingCompleted = true;
    (user as { onboardingStep?: number }).onboardingStep = 0;
    await user.save();
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const orgId = user.organizationId?.toString() ?? null;
    const uOut = user as { role?: string; displayName?: string };
    res.json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: uOut.role ?? 'member',
          organizationId: orgId,
          displayName: uOut.displayName ?? '',
          onboardingStep: 0,
          onboardingCompleted: true,
        },
        token,
        expiresIn: '7d',
      },
      message: 'Invite accepted. You are now logged in.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}
