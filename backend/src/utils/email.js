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

export async function sendOtpEmail(email, otp) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: email,
    subject: 'Your KirayaKart verification code',
    html: `<p>Your KirayaKart verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
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

// Import email templates
import {
  pickupConfirmationTemplate,
  returnReminderTemplate,
  lateReturnAlertTemplate,
  vendorLateReturnAlertTemplate,
} from './email-templates.js';

export async function sendPickupConfirmation(order, customer, vendor) {
  const html = pickupConfirmationTemplate(order, customer, vendor);
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: customer.email,
    subject: `Pickup Confirmed - Order #${order.orderNumber}`,
    html,
  });
}

export async function sendReturnReminder(order, customer, hoursRemaining = 24) {
  const html = returnReminderTemplate(order, customer, hoursRemaining);
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: customer.email,
    subject: `Return Reminder - Order #${order.orderNumber}`,
    html,
  });
}

export async function sendLateReturnAlert(order, customer, vendor, delayHours, lateFee) {
  // Send to customer
  const customerHtml = lateReturnAlertTemplate(order, customer, delayHours, lateFee);
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: customer.email,
    subject: `⚠️ Overdue Rental - Order #${order.orderNumber}`,
    html: customerHtml,
  });

  // Send to vendor
  const vendorHtml = vendorLateReturnAlertTemplate(order, customer, delayHours, lateFee);
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: vendor.email || process.env.ADMIN_EMAIL,
    subject: `Vendor Alert: Overdue Return - Order #${order.orderNumber}`,
    html: vendorHtml,
  });
}
