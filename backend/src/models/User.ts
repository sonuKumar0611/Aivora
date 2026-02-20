import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type UserStatus = 'pending_invite' | 'active' | 'suspended';

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId;
  displayName?: string;
  status: UserStatus;
  inviteToken?: string;
  inviteTokenExpiresAt?: Date;
  invitedAt?: Date;
  invitedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    displayName: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending_invite', 'active', 'suspended'], default: 'active' },
    inviteToken: { type: String, sparse: true },
    inviteTokenExpiresAt: { type: Date },
    invitedAt: { type: Date },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.index({ email: 1 });
userSchema.index({ organizationId: 1 });
userSchema.index({ inviteToken: 1 }, { sparse: true });

userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);
