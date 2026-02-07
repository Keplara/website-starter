import mongoose from 'mongoose';

// Assumed Role Session schema for session-based role assumption (no tokens)
const assumedRoleSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    roleName: { type: String, required: true },
    roleId: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// TTL index to auto-remove expired sessions
assumedRoleSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AssumedRoleSessionModel =
  mongoose.models.AssumedRoleSession || mongoose.model('AssumedRoleSession', assumedRoleSessionSchema);

// Minimal Policy and Group schemas (to match IAM service) in case this service reads them
const policySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    effect: { type: String, enum: ['Allow', 'Deny', 'allow', 'deny'], required: true },
    action: [String],
    resource: [String],
    principal: [mongoose.Schema.Types.Mixed],
    conditions: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const PolicyModel = mongoose.models.Policy || mongoose.model('Policy', policySchema);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    members: [{ type: String }],
    policies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Policy' }],
    roles: [{ type: String }],
  },
  { timestamps: true }
);

export const GroupModel = mongoose.models.Group || mongoose.model('Group', groupSchema);
