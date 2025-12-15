// User schema for authentication and Stripe integration
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String, required: true }, // bcrypt hash
    stripeCustomerId: { type: String },
    defaultPaymentMethodId: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', userSchema);
import mongoose from 'mongoose';

// Product schema only
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model('Product', productSchema);
