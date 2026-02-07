import mongoose from 'mongoose';

// Define Role schema to match interfaces.Role
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    // Store policy IDs (string identifiers)
    policies: [{ type: String }],
    // Optional max session duration
    maxSessionDuration: { type: Number },
    // Trust policy controlling who can assume this role
    trustPolicy: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Reuse compiled model to avoid OverwriteModelError
export const RoleModel =
  mongoose.models.Role || mongoose.model('Role', roleSchema);

// Define User schema
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: [{ type: String }],
    groupIds: [{ type: String }],
  },
  { timestamps: true }
);

// Define User schema inline (can be moved to models.ts)
const iamUserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true }, // Optional, if using password authentication
    email: { type: String, required: true, unique: true },
    roles: [{ type: String }], // Array of role IDs or names
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], // Array of group IDs
    isActive: { type: Boolean, default: true },
    password: { type: String, required: true }, // bcrypt hash
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model('User', userSchema);

export const IAMUserModel =
  mongoose.models.User || mongoose.model('IAMUser', iamUserSchema);


// Define Policy schema
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

export const PolicyModel =
  mongoose.models.Policy || mongoose.model('Policy', policySchema);

// Define Group schema
const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    members: [{ type: String }],
    policies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Policy' }],
    roles: [{ type: String }], // if you attach roles to groups
  },
  { timestamps: true }
);

export const GroupModel =
  mongoose.models.Group || mongoose.model('Group', groupSchema);

// Define UserPolicy schema (direct policy assignments to users)
const userPolicySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  },
  { timestamps: true }
);

userPolicySchema.index({ userId: 1, policyId: 1 }, { unique: true });

export const UserPolicyModel =
  mongoose.models.UserPolicy || mongoose.model('UserPolicy', userPolicySchema);

// Assumed Role Session model for session-based role assumption (no tokens)
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
