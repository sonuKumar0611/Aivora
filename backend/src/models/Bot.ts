import mongoose, { Document, Schema } from 'mongoose';

/** React Flow node position */
export interface IFlowPosition {
  x: number;
  y: number;
}

/** Node data for prompt/conversation/action nodes */
export interface IFlowNodeData {
  label?: string;
  prompt?: string;
  nodeType?: 'prompt' | 'conversation' | 'end_call' | 'transfer_call' | 'message' | 'tool_call' | 'end_chat' | 'transfer_to_human';
  /** For tool_call nodes: ID of the AgentTool to invoke */
  toolId?: string;
}

/** Stored flow: nodes and edges in React Flow format */
export interface IFlowDefinition {
  nodes: Array<{
    id: string;
    type?: string;
    position: IFlowPosition;
    data: IFlowNodeData & Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    label?: string;
    data?: Record<string, unknown>;
  }>;
}

export interface IBot extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tone: string;
  botType: string;
  systemPrompt?: string;
  assignedSourceIds: mongoose.Types.ObjectId[];
  /** IDs of AgentTool documents this agent can use during conversations */
  assignedToolIds: mongoose.Types.ObjectId[];
  flowDefinition?: IFlowDefinition;
  status: 'draft' | 'published';
  /** When true, published agent responds to chat. When false, returns inactive message. Ignored for draft. */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const flowNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, default: 'prompt' },
    position: {
      x: { type: Number, required: true, default: 0 },
      y: { type: Number, required: true, default: 0 },
    },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false }
);

const flowEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String, default: null },
    targetHandle: { type: String, default: null },
    label: { type: String, default: '' },
    data: { type: Schema.Types.Mixed, default: undefined },
  },
  { _id: false }
);

const flowDefinitionSchema = new Schema(
  {
    nodes: { type: [flowNodeSchema], default: [] },
    edges: { type: [flowEdgeSchema], default: [] },
  },
  { _id: false }
);

const botSchema = new Schema<IBot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tone: { type: String, required: true, trim: true, default: 'professional' },
    botType: { type: String, trim: true, default: 'support' },
    systemPrompt: { type: String, trim: true, default: '' },
    assignedSourceIds: { type: [Schema.Types.ObjectId], ref: 'KnowledgeSource', default: [] },
    assignedToolIds: { type: [Schema.Types.ObjectId], ref: 'AgentTool', default: [] },
    flowDefinition: { type: flowDefinitionSchema, default: () => ({ nodes: [], edges: [] }) },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

botSchema.index({ userId: 1 });

botSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Bot = mongoose.model<IBot>('Bot', botSchema);
