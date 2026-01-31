import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const paymentRoutes = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

paymentRoutes.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount, invoiceId, currency = 'INR' } = req.body;
    const amtPaise = Math.round(parseFloat(amount) * 100);

    const order = await razorpay.orders.create({
      amount: amtPaise,
      currency,
      receipt: `inv_${invoiceId || Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: amtPaise,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
  }
});

paymentRoutes.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, amount } =
      req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    if (invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          ...(req.user.role === 'CUSTOMER' ? { customerId: req.user.id } : {}),
        },
      });
      if (invoice) {
        const paidAmount = new Decimal(amount || 0).div(100);
        const newAmountPaid = new Decimal(invoice.amountPaid).add(paidAmount);
        const totalAmount = new Decimal(invoice.totalAmount);
        let newStatus = 'PARTIALLY_PAID';
        if (newAmountPaid.gte(totalAmount)) newStatus = 'PAID';

        await prisma.payment.create({
          data: {
            invoiceId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: paidAmount,
            status: 'COMPLETED',
            method: 'card',
            paidAt: new Date(),
          },
        });

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { amountPaid: newAmountPaid, status: newStatus },
        });
      }
    }

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

paymentRoutes.post('/register', authenticate, requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const { invoiceId, amount, method = 'cash' } = req.body;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        status: { in: ['POSTED', 'PARTIALLY_PAID'] },
        ...(req.user.role === 'VENDOR' ? { vendorId: req.user.vendor.id } : {}),
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const paidAmount = new Decimal(amount);
    const newAmountPaid = new Decimal(invoice.amountPaid).add(paidAmount);
    const totalAmount = new Decimal(invoice.totalAmount);
    let newStatus = 'PARTIALLY_PAID';
    if (newAmountPaid.gte(totalAmount)) newStatus = 'PAID';

    await prisma.payment.create({
      data: {
        invoiceId,
        amount: paidAmount,
        status: 'COMPLETED',
        method,
        paidAt: new Date(),
      },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newAmountPaid, status: newStatus },
    });

    res.json({ message: 'Payment registered', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
