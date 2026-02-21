import mongoose, { Document, Schema } from 'mongoose';

/** Tool types that map to integration providers and actions */
export type AgentToolType =
  | 'google_calendar_create_event'
  | 'google_calendar_check_availability'
  | 'google_sheets_create_row';

/** Config shape per tool type */
export interface IAgentToolConfig {
  /** Google Calendar: optional calendar ID (default primary) */
  calendarId?: string;
  /** Google Sheets: spreadsheet ID */
  spreadsheetId?: string;
  /** Google Sheets: sheet name or A1 range (e.g. "Sheet1" or "Sheet1!A:E") */
  sheetName?: string;
  /** Optional: column mapping for sheets (e.g. ["name", "email", "notes"]) */
  columns?: string[];
  [key: string]: unknown;
}

export interface IAgentTool extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: AgentToolType;
  config: IAgentToolConfig;
  createdAt: Date;
  updatedAt: Date;
}

const agentToolConfigSchema = new Schema(
  {
    calendarId: { type: String, trim: true },
    spreadsheetId: { type: String, trim: true },
    sheetName: { type: String, trim: true },
    columns: { type: [String], default: undefined },
  },
  { _id: false, strict: false }
);

const agentToolSchema = new Schema<IAgentTool>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['google_calendar_create_event', 'google_calendar_check_availability', 'google_sheets_create_row'],
      required: true,
    },
    config: { type: agentToolConfigSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

agentToolSchema.index({ organizationId: 1 });
agentToolSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const AgentTool = mongoose.model<IAgentTool>('AgentTool', agentToolSchema);
