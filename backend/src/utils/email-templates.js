/**
 * Professional HTML Email Templates for KirayaKart
 */

const emailStyles = `
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1e293b; font-size: 22px; margin-bottom: 20px; }
    .content p { color: #475569; line-height: 1.6; margin-bottom: 15px; }
    .info-box { background-color: #f1f5f9; border-left: 4px solid: #0d9488; padding: 15px; margin: 20px 0; }
    .info-box strong { color: #1e293b; }
    .button { display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
    .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .alert strong { color: #dc2626; }
  </style>
`;

function emailWrapper(title, content) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 KirayaKart</h1>
        </div>
        ${content}
        <div class="footer">
          <p>KirayaKart - Your Trusted Rental Partner</p>
          <p>Need help? Contact us at support@kirayakart.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function pickupConfirmationTemplate(order, customer, vendor) {
    const productsList = order.items.map(item =>
        `<li>${item.product.name} (Qty: ${item.quantity})</li>`
    ).join('');

    const content = `
    <div class="content">
      <h2>Pickup Confirmed! ✅</h2>
      <p>Hello ${customer.firstName},</p>
      <p>Great news! Your rental items have been picked up successfully.</p>
      
      <div class="info-box">
        <strong>Order #:</strong> ${order.orderNumber}<br>
        <strong>Pickup Date:</strong> ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}<br>
        <strong>Return Due:</strong> ${new Date(order.items[0].endDate).toLocaleDateString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
      </div>

      <p><strong>Items Rented:</strong></p>
      <ul>${productsList}</ul>

      <p><strong>Rental Period:</strong><br>
      From: ${new Date(order.items[0].startDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}<br>
      To: ${new Date(order.items[0].endDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>

      <div class="info-box">
        <strong>Vendor Contact:</strong><br>
        ${vendor.companyName}<br>
        GST: ${vendor.gstNumber}
      </div>

      <p><strong>Important Reminders:</strong></p>
      <ul>
        <li>Please return all items by the due date to avoid late fees</li>
        <li>Keep items in good condition</li>
        <li>Contact us immediately if you need to extend the rental period</li>
      </ul>

      <p>Thank you for choosing KirayaKart!</p>
    </div>
  `;

    return emailWrapper('Pickup Confirmed', content);
}

export function returnReminderTemplate(order, customer, hoursRemaining) {
    const productsList = order.items.map(item =>
        `<li>${item.product.name}</li>`
    ).join('');

    const content = `
    <div class="content">
      <h2>Return Reminder ⏰</h2>
      <p>Hello ${customer.firstName},</p>
      <p>This is a friendly reminder that your rental period is ending soon.</p>
      
      <div class="info-box">
        <strong>Order #:</strong> ${order.orderNumber}<br>
        <strong>Return Due:</strong> ${new Date(order.items[0].endDate).toLocaleDateString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}<br>
        <strong>Time Remaining:</strong> ~${hoursRemaining} hours
      </div>

      <p><strong>Items to Return:</strong></p>
      <ul>${productsList}</ul>

      <div class="alert">
        <strong>⚠️ Late Fee Warning</strong><br>
        Returns after the due date will incur a late fee of ₹100 per day. Please return on time to avoid additional charges.
      </div>

      <p><strong>Need More Time?</strong><br>
      Contact us to extend your rental period before the due date.</p>

      <p>Thank you for being a responsible renter!</p>
    </div>
  `;

    return emailWrapper('Return Reminder', content);
}

export function lateReturnAlertTemplate(order, customer, delayHours, lateFee) {
    const delayDays = Math.ceil(delayHours / 24);
    const productsList = order.items.map(item =>
        `<li>${item.product.name}</li>`
    ).join('');

    const content = `
    <div class="content">
      <h2>Overdue Rental Alert ⚠️</h2>
      <p>Hello ${customer.firstName},</p>
      <p>Your rental period has ended, but we haven't received the items yet.</p>
      
      <div class="alert">
        <strong>Order #:</strong> ${order.orderNumber}<br>
        <strong>Due Date:</strong> ${new Date(order.items[0].endDate).toLocaleDateString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}<br>
        <strong>Delay:</strong> ${delayDays} day${delayDays > 1 ? 's' : ''} (${Math.round(delayHours)} hours)<br>
        <strong>Late Fee Applied:</strong> ₹${lateFee}
      </div>

      <p><strong>Overdue Items:</strong></p>
      <ul>${productsList}</ul>

      <p><strong>Immediate Action Required:</strong></p>
      <ul>
        <li>Please return the items as soon as possible</li>
        <li>Late fee: ₹100 per day will continue to apply</li>
        <li>Your invoice has been updated with the late charges</li>
      </ul>

      <p><strong>Need Assistance?</strong><br>
      If you're facing any issues returning the items, please contact us immediately.</p>

      <p>We appreciate your prompt attention to this matter.</p>
    </div>
  `;

    return emailWrapper('Overdue Rental Alert', content);
}

export function vendorLateReturnAlertTemplate(order, customer, delayHours, lateFee) {
    const delayDays = Math.ceil(delayHours / 24);
    const productsList = order.items.map(item =>
        `<li>${item.product.name} (Qty: ${item.quantity})</li>`
    ).join('');

    const content = `
    <div class="content">
      <h2>Customer Overdue Alert</h2>
      <p>A rental order is overdue and requires your attention.</p>
      
      <div class="alert">
        <strong>Order #:</strong> ${order.orderNumber}<br>
        <strong>Customer:</strong> ${customer.firstName} ${customer.lastName} (${customer.email})<br>
        <strong>Due Date:</strong> ${new Date(order.items[0].endDate).toLocaleDateString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}<br>
        <strong>Delay:</strong> ${delayDays} day${delayDays > 1 ? 's' : ''}<br>
        <strong>Late Fee:</strong> ₹${lateFee}
      </div>

      <p><strong>Overdue Items:</strong></p>
      <ul>${productsList}</ul>

      <p><strong>Recommended Actions:</strong></p>
      <ul>
        <li>Contact the customer to arrange return</li>
        <li>Monitor the order status in your dashboard</li>
        <li>Late fee has been automatically applied to the invoice</li>
      </ul>

      <p>This is an automated notification from KirayaKart.</p>
    </div>
  `;

    return emailWrapper('Vendor Alert: Overdue Return', content);
}
