import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import type { UserRole } from '../models/User';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string | null;
    displayName?: string;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required', message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId).select('email role organizationId displayName');
    if (!user) {
      res.status(401).json({ error: 'Invalid token', message: 'User not found' });
      return;
    }
    let organizationId: string | null = user.organizationId?.toString() ?? null;
    if (!organizationId) {
      const org = await Organization.create({
        name: 'My Organization',
        slug: `org-${user._id.toString().slice(-8)}`,
      });
      user.organizationId = org._id;
      user.role = 'owner';
      await user.save();
      organizationId = org._id.toString();
    }
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: (user.role as UserRole) || 'owner',
      organizationId,
      displayName: user.displayName,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token', message: 'Token expired or invalid' });
  }
}

/** Require user to have one of the given roles. Use after authMiddleware. */
export function requireRole(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', message: 'No token provided' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      });
      return;
    }
    next();
  };
}

/** Optional auth: set req.user if valid token, otherwise continue without user (e.g. for widget). */
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId).select('email role organizationId displayName');
    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: ((user as { role?: string }).role as UserRole) || 'owner',
        organizationId: user.organizationId?.toString() ?? null,
        displayName: (user as { displayName?: string }).displayName,
      };
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
