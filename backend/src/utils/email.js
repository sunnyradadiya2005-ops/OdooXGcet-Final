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

export async function sendOrderUpdateEmail(order, customer, vendor, invoicePdfBuffer) {
  const statusColors = {
    CONFIRMED: '#2563EB', // Blue
    PICKED_UP: '#059669', // Green
    RETURNED: '#7C3AED', // Purple
    CANCELLED: '#DC2626', // Red
  };

  const statusMessages = {
    CONFIRMED: 'Your rental order has been confirmed! Please find the invoice attached.',
    PICKED_UP: 'Your items have been picked up. Enjoy your rental!',
    RETURNED: 'Your items have been returned. The final invoice with refund details is attached.',
    CANCELLED: 'Your order has been cancelled.',
  };

  const color = statusColors[order.status] || '#4B5563';
  const message = statusMessages[order.status] || `Your order status has been updated to ${order.status}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0F766E; margin: 0;">KirayaKart</h1>
        <p style="color: #6B7280; margin: 5px 0;">Order Update</p>
      </div>

      <div style="background-color: ${color}; color: white; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 20px;">${order.status.replace('_', ' ')}</h2>
      </div>

      <p style="color: #374151; font-size: 16px;">Hello ${customer.firstName},</p>
      
      <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">
        ${message}
      </p>

      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <div style="margin-bottom: 8px;"><strong>Order ID:</strong> #${order.orderNumber}</div>
        <div style="margin-bottom: 8px;"><strong>Product:</strong> ${order.items[0]?.product?.name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}</div>
        <div><strong>Total Amount:</strong> Rs. ${Number(order.totalAmount).toFixed(2)}</div>
      </div>

      <p style="color: #6B7280; font-size: 14px; margin-top: 30px; text-align: center;">
        Please find your updated invoice attached to this email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      
      <p style="text-align: center; color: #9CA3AF; font-size: 12px;">
        &copy; ${new Date().getFullYear()} KirayaKart. All rights reserved.
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: customer.email,
    subject: `Order ${order.status.replace('_', ' ')} - #${order.orderNumber}`,
    html,
    attachments: [
      {
        filename: `Invoice-${order.orderNumber}.pdf`,
        content: invoicePdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`📧 Order update email sent to ${customer.email} for status ${order.status}`);
}

export async function sendPaymentConfirmationEmail(invoice, amountPaid, customer) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0F766E; margin: 0;">KirayaKart</h1>
        <p style="color: #6B7280; margin: 5px 0;">Payment Successful</p>
      </div>

      <div style="background-color: #059669; color: white; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px;">₹${amountPaid}</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Paid Successfully</p>
      </div>

      <p style="color: #374151; font-size: 16px;">Hello ${customer.firstName},</p>
      
      <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">
        We have received your payment for Invoice <strong>#${invoice.invoiceNumber}</strong>.
      </p>

      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span style="color: #6B7280;">Order ID:</span>
          <strong>#${invoice.order?.orderNumber || 'N/A'}</strong>
        </div>
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span style="color: #6B7280;">Payment Date:</span>
          <strong>${new Date().toLocaleDateString()}</strong>
        </div>
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span style="color: #6B7280;">Payment Method:</span>
          <strong>Online (Razorpay)</strong>
        </div>
        <hr style="border: none; border-top: 1px solid #D1D5DB; margin: 8px 0;" />
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #374151;">Remaining Balance:</span>
          <strong style="color: #DC2626;">₹${Math.max(0, Number(invoice.totalAmount) - Number(invoice.amountPaid)).toFixed(2)}</strong>
        </div>
      </div>

      <p style="color: #6B7280; font-size: 14px; margin-top: 30px; text-align: center;">
        You can view your full invoice history in your dashboard.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      
      <p style="text-align: center; color: #9CA3AF; font-size: 12px;">
        &copy; ${new Date().getFullYear()} KirayaKart. All rights reserved.
      </p>
    </div>
  `;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@kirayakart.com',
    to: customer.email,
    subject: `Payment Received - ₹${amountPaid}`,
    html,
  });
  console.log(`📧 Payment confirmation email sent to ${customer.email}`);
}
