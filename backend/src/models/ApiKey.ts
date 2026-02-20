import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';
import { env } from '../utils/env';

export type ApiKeyProvider = 'openai';

export interface IApiKey extends Document {
  organizationId: mongoose.Types.ObjectId;
  provider?: ApiKeyProvider;
  label: string;
  keyHash: string;
  keyPrefix: string;
  encryptedValue: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    provider: { type: String, enum: ['openai'], trim: true },
    label: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true },
    keyPrefix: { type: String, required: true },
    encryptedValue: { type: String, required: true },
    lastUsedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

apiKeySchema.index({ organizationId: 1 });
apiKeySchema.index({ organizationId: 1, provider: 1 }, { unique: true, sparse: true });
apiKeySchema.index({ keyHash: 1 });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || env.JWT_SECRET;
  return crypto.scryptSync(secret, 'aivora-apikey', KEY_LENGTH);
}

export function encryptApiKey(plainKey: string): { encrypted: string; hash: string; prefix: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  const hash = crypto.createHash('sha256').update(plainKey).digest('hex');
  const prefix = plainKey.length > 8 ? `${plainKey.slice(0, 4)}...${plainKey.slice(-4)}` : '****';
  return {
    encrypted: combined.toString('base64'),
    hash,
    prefix,
  };
}

export function decryptApiKey(encryptedValue: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedValue, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);
