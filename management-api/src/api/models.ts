import mongoose from 'mongoose';

// Define Policy schema
const policySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    effect: { type: String, enum: ['Allow', 'Deny', 'allow', 'deny'], required: true },
    action: [String],
    resource: [String],
    conditions: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const PolicyModel = mongoose.model('Policy', policySchema);

// Define Group schema
const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    members: [{ type: String }], // Array of user IDs
    policies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Policy' }], // Array of policy IDs
  },
  { timestamps: true }
);

export const GroupModel = mongoose.model('Group', groupSchema);

// Define UserPolicy schema (for direct policy assignments to users)
const userPolicySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  },
  { timestamps: true }
);

userPolicySchema.index({ userId: 1, policyId: 1 }, { unique: true });

export const UserPolicyModel = mongoose.model('UserPolicy', userPolicySchema);
