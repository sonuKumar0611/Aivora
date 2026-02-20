import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { User } from '../models/User';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
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
    const user = await User.findById(decoded.userId).select('email');
    if (!user) {
      res.status(401).json({ error: 'Invalid token', message: 'User not found' });
      return;
    }
    req.user = { id: user._id.toString(), email: user.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token', message: 'Token expired or invalid' });
  }
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
    const user = await User.findById(decoded.userId).select('email');
    if (user) req.user = { id: user._id.toString(), email: user.email };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
