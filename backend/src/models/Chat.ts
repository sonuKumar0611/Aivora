import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/** Token usage for this conversation (accumulated). */
export interface ITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Sentiment scores for the conversation (0–1 range, sum to 1). */
export interface ISentimentScores {
  positive: number;
  negative: number;
  neutral: number;
}

export interface IChat extends Document {
  botId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  /** Optional client-provided session id to group conversations (e.g. same visitor). */
  sessionId?: string | null;
  messages: IMessage[];
  /** Accumulated token usage for this conversation. */
  tokenUsage?: ITokenUsage;
  /** Sentiment of the conversation (computed from messages). */
  sentiment?: ISentimentScores;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const tokenUsageSchema = new Schema<ITokenUsage>(
  {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  { _id: false }
);

const sentimentSchema = new Schema<ISentimentScores>(
  {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
  },
  { _id: false }
);

const chatSchema = new Schema<IChat>(
  {
    botId: { type: Schema.Types.ObjectId, ref: 'Bot', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, default: null },
    messages: [messageSchema],
    tokenUsage: { type: tokenUsageSchema, default: () => ({ promptTokens: 0, completionTokens: 0, totalTokens: 0 }) },
    sentiment: { type: sentimentSchema, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

chatSchema.index({ botId: 1, createdAt: -1 });
chatSchema.index({ userId: 1 });

chatSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
