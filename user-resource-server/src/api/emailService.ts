import nodemailer from 'nodemailer';

export interface EmailConfig {
  mode: 'smtp' | 'ses';
  smtp?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  ses?: {
    region: string;
  };
}

// Example: load config from environment or a config file
const emailConfig: EmailConfig = {
  mode: (process.env.EMAIL_MODE as 'smtp' | 'ses') || 'smtp',
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    username: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
  },
  ses: {
    region: process.env.SES_REGION || 'us-east-1',
  },
};

// Only SMTP implemented here for simplicity
const transporter = nodemailer.createTransport({
  host: emailConfig.smtp?.host,
  port: emailConfig.smtp?.port,
  secure: false,
  auth: {
    user: emailConfig.smtp?.username,
    pass: emailConfig.smtp?.password,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}) {
  const info = await transporter.sendMail({
    from: from || process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    text,
    html,
  });
  return info;
}


export async function sendUserVerificationEmail(to: string, verifyUrl: string, name?: string) {
  return sendEmail({
    to,
    subject: 'Verify your email address',
    text: `Hello${name ? ' ' + name : ''},\n\nThank you for signing up! Please verify your email by clicking the following link: ${verifyUrl}`,
    html: `<p>Hello${name ? ' ' + name : ''},</p><p>Thank you for signing up! Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}
