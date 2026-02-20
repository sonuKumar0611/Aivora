import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  botId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  messages: IMessage[];
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

const chatSchema = new Schema<IChat>(
  {
    botId: { type: Schema.Types.ObjectId, ref: 'Bot', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    messages: [messageSchema],
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
