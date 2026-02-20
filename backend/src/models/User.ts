import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'admin' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    displayName: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.index({ email: 1 });
userSchema.index({ organizationId: 1 });

userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);
