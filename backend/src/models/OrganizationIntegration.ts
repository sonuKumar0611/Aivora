import mongoose, { Document, Schema } from 'mongoose';

export type IntegrationProvider =
  | 'google_calendar'
  | 'google_sheets';

export type IntegrationStatus = 'connected' | 'disconnected';

export interface IOrganizationIntegration extends Document {
  organizationId: mongoose.Types.ObjectId;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  /** Optional metadata (e.g. scopes, user email) – for future OAuth */
  metadata?: Record<string, unknown>;
  connectedAt?: Date;
  disconnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const organizationIntegrationSchema = new Schema<IOrganizationIntegration>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    provider: { type: String, enum: ['google_calendar', 'google_sheets'], required: true },
    status: { type: String, enum: ['connected', 'disconnected'], default: 'connected' },
    metadata: { type: Schema.Types.Mixed },
    connectedAt: { type: Date, default: Date.now },
    disconnectedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

organizationIntegrationSchema.index({ organizationId: 1, provider: 1 }, { unique: true });
organizationIntegrationSchema.index({ organizationId: 1 });

organizationIntegrationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const OrganizationIntegration = mongoose.model<IOrganizationIntegration>(
  'OrganizationIntegration',
  organizationIntegrationSchema
);
