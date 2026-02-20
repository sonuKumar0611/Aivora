import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

organizationSchema.index({ slug: 1 });

organizationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
