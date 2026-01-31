import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: email,
    subject: 'Verify your KirayaKart email',
    html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: email,
    subject: 'Reset your KirayaKart password',
    html: `<p>Click to reset: <a href="${resetUrl}">${resetUrl}</a></p><p>Link expires in 1 hour.</p>`,
  });
}
