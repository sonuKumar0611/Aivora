import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AgentTool, type AgentToolType } from '../models/AgentTool';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import type { UserRole } from '../models/User';

const ROLES_HIGHER_UPS: UserRole[] = ['owner', 'admin'];

function canManageTools(req: AuthRequest): boolean {
  return !!req.user && ROLES_HIGHER_UPS.includes(req.user.role);
}

const TOOL_TYPES: AgentToolType[] = [
  'google_calendar_create_event',
  'google_calendar_check_availability',
  'google_sheets_create_row',
];

const createToolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).optional().default(''),
  type: z.enum(TOOL_TYPES as unknown as [string, ...string[]]),
  config: z.record(z.unknown()).optional().default({}),
});

const updateToolSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(TOOL_TYPES as unknown as [string, ...string[]]).optional(),
  config: z.record(z.unknown()).optional(),
});

function toToolResponse(doc: { _id: mongoose.Types.ObjectId; organizationId: mongoose.Types.ObjectId; name: string; description?: string; type: string; config?: Record<string, unknown>; createdAt: Date; updatedAt: Date }) {
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    name: doc.name,
    description: doc.description ?? '',
    type: doc.type,
    config: doc.config ?? {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listTools(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canManageTools(req)) {
      throw new ApiError('Only owners and admins can manage tools', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const tools = await AgentTool.find({ organizationId: orgId }).sort({ updatedAt: -1 }).lean();
    res.json({
      data: { tools: tools.map((t) => toToolResponse(t as Parameters<typeof toToolResponse>[0])) },
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

export async function createTool(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canManageTools(req)) {
      throw new ApiError('Only owners and admins can manage tools', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const body = createToolSchema.parse(req.body);
    const tool = await AgentTool.create({
      organizationId: orgId,
      name: body.name.trim(),
      description: (body.description ?? '').trim(),
      type: body.type as AgentToolType,
      config: body.config ?? {},
    });
    res.status(201).json({
      data: { tool: toToolResponse(tool) },
      message: 'Tool created',
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

export async function getTool(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canManageTools(req)) {
      throw new ApiError('Only owners and admins can manage tools', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const { id } = req.params;
    const tool = await AgentTool.findOne({ _id: id, organizationId: orgId }).lean();
    if (!tool) {
      throw new ApiError('Tool not found', 404);
    }
    res.json({
      data: { tool: toToolResponse(tool as Parameters<typeof toToolResponse>[0]) },
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

export async function updateTool(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canManageTools(req)) {
      throw new ApiError('Only owners and admins can manage tools', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const { id } = req.params;
    const body = updateToolSchema.parse(req.body);
    const tool = await AgentTool.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.config !== undefined && { config: body.config }),
      },
      { new: true }
    ).lean();
    if (!tool) {
      throw new ApiError('Tool not found', 404);
    }
    res.json({
      data: { tool: toToolResponse(tool as Parameters<typeof toToolResponse>[0]) },
      message: 'Tool updated',
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

export async function deleteTool(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!canManageTools(req)) {
      throw new ApiError('Only owners and admins can manage tools', 403);
    }
    const orgId = req.user!.organizationId;
    if (!orgId) {
      throw new ApiError('No organization associated with your account', 400);
    }
    const { id } = req.params;
    const tool = await AgentTool.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!tool) {
      throw new ApiError('Tool not found', 404);
    }
    res.json({ data: { deleted: true }, message: 'Tool deleted' });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: err.name, message: err.message });
      return;
    }
    next(err);
  }
}
