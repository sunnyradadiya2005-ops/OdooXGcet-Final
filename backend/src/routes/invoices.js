import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateInvoiceNumber } from '../utils/generators.js';

export const invoiceRoutes = Router();

invoiceRoutes.use(authenticate);

invoiceRoutes.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.user.role === 'VENDOR' && req.user.vendor) where.vendorId = req.user.vendor.id;
    if (req.user.role === 'CUSTOMER') where.customerId = req.user.id;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
        },
        skip,
        take: parseInt(limit, 10),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const serialized = invoices.map((i) => ({
      ...i,
      subtotal: Number(i.subtotal),
      taxAmount: Number(i.taxAmount),
      totalAmount: Number(i.totalAmount),
      amountPaid: Number(i.amountPaid),
      lateFee: Number(i.lateFee),
    }));

    res.json({ invoices: serialized, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

invoiceRoutes.get('/by-order/:orderId', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        orderId: req.params.orderId,
        ...(req.user.role === 'CUSTOMER' ? { customerId: req.user.id } : {}),
        ...(req.user.role === 'VENDOR' && req.user.vendor ? { vendorId: req.user.vendor.id } : {}),
      },
      include: { order: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      amountPaid: Number(invoice.amountPaid),
      lateFee: Number(invoice.lateFee),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

invoiceRoutes.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role === 'CUSTOMER' ? { customerId: req.user.id } : {}),
        ...(req.user.role === 'VENDOR' && req.user.vendor ? { vendorId: req.user.vendor.id } : {}),
      },
      include: {
        order: { include: { items: { include: { product: true } } } },
        vendor: { include: { user: { select: { firstName: true, lastName: true } } } },
        customer: true,
        payments: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      securityDeposit: Number(invoice.securityDeposit),
      lateFee: Number(invoice.lateFee),
      totalAmount: Number(invoice.totalAmount),
      amountPaid: Number(invoice.amountPaid),
      order: {
        ...invoice.order,
        items: invoice.order.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

invoiceRoutes.post('/from-order/:orderId', async (req, res) => {
  try {
    const isVendorOrAdmin = ['VENDOR', 'ADMIN'].includes(req.user.role);
    const order = await prisma.rentalOrder.findFirst({
      where: {
        id: req.params.orderId,
        status: { in: ['RENTAL_ORDER', 'CONFIRMED', 'PICKED_UP', 'RETURNED'] },
        ...(isVendorOrAdmin && req.user.role === 'VENDOR' ? { vendorId: req.user.vendor.id } : {}),
        ...(req.user.role === 'CUSTOMER' ? { customerId: req.user.id } : {}),
      },
      include: { items: true, returns: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found or not eligible for invoice' });

    const existing = await prisma.invoice.findFirst({ where: { orderId: order.id } });
    if (existing) return res.status(400).json({ error: 'Invoice already exists for this order' });

    const lateFee = order.returns[0]?.lateFee
      ? new Decimal(order.returns[0].lateFee)
      : new Decimal(0);
    const damageFee = order.returns[0]?.damageFee
      ? new Decimal(order.returns[0].damageFee)
      : new Decimal(0);

    const totalAmount = order.totalAmount.add(lateFee).add(damageFee);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        orderId: order.id,
        vendorId: order.vendorId,
        customerId: order.customerId,
        status: 'DRAFT',
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        securityDeposit: order.securityDeposit,
        lateFee,
        totalAmount,
      },
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

invoiceRoutes.patch('/:id/post', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        status: 'DRAFT',
        ...(req.user.role === 'VENDOR' ? { vendorId: req.user.vendor.id } : {}),
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found or already posted' });

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'POSTED', postedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
