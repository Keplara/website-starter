


import bcrypt from 'bcrypt';
import { UserModel } from './models';
import express from 'express';
import { sendEmail } from './emailService';

const router = express.Router();

// If you have a Stripe SDK setup, import it here:
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
// Create User (with bcrypt password hash and Stripe customer creation)
router.post('/users', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create Stripe customer (replace with real Stripe API call)
    // const customer = await stripe.customers.create({ email, name });
    // const stripeCustomerId = customer.id;
    const stripeCustomerId = 'stripe_customer_id_placeholder';

    // Create user in DB
    const user = await UserModel.create({
      email,
      name,
      password: hashedPassword,
      stripeCustomerId
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: 'Welcome to Our Service!',
      text: `Hello${name ? ' ' + name : ''},\n\nThank you for signing up!`,
      html: `<p>Hello${name ? ' ' + name : ''},</p><p>Thank you for signing up!</p>`
    }).catch((err: any) => {
      console.error('Failed to send welcome email:', err);
    });

    // Exclude password from response
    const userObj = user.toObject() as { [key: string]: any };
    delete userObj.password;

    return res.status(201).json({ message: 'User created', data: userObj });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});
// No IAM concepts needed

// MOVE TO RESOURCE SERVER FOR PUBLIC ACCESS.

// Example endpoint: return static user details (no IAM)
router.get('/user-details', (req, res) => {
  return res.json({
    userId: 'demo-user',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@gmail.com',
    preferences: {
      defaultTheme: 'dark',
      language: 'en'
    }

  });
});



export default router;
