import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateOrderNumber, generateQuoteNumber } from '../utils/generators.js';

export const orderRoutes = Router();

orderRoutes.use(authenticate);

orderRoutes.get('/', async (req, res) => {
  try {
    const { role } = req.user;
    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role === 'VENDOR' && req.user.vendor) where.vendorId = req.user.vendor.id;
    if (role === 'CUSTOMER') where.customerId = req.user.id;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.rentalOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          vendor: { select: { id: true, companyName: true } },
          items: { include: { product: { select: { name: true, images: true } } } },
        },
        skip,
        take: parseInt(limit, 10),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rentalOrder.count({ where }),
    ]);

    const serialized = orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      taxAmount: Number(o.taxAmount),
      discountAmount: Number(o.discountAmount),
      totalAmount: Number(o.totalAmount),
      securityDeposit: Number(o.securityDeposit),
    }));

    res.json({ orders: serialized, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.get('/kanban', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'VENDOR' && req.user.vendor) where.vendorId = req.user.vendor.id;

    const orders = await prisma.rentalOrder.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const columns = {
      QUOTATION: [],
      RENTAL_ORDER: [],
      CONFIRMED: [],
      PICKED_UP: [],
      RETURNED: [],
      CANCELLED: [],
    };
    orders.forEach((o) => {
      const arr = columns[o.status];
      if (arr) arr.push({ ...o, totalAmount: Number(o.totalAmount) });
    });

    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.get('/:id', async (req, res) => {
  try {
    const order = await prisma.rentalOrder.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role === 'CUSTOMER' ? { customerId: req.user.id } : {}),
        ...(req.user.role === 'VENDOR' && req.user.vendor ? { vendorId: req.user.vendor.id } : {}),
      },
      include: {
        customer: true,
        vendor: { include: { user: { select: { email: true } } } },
        items: { include: { product: true } },
        pickups: true,
        returns: true,
        invoices: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const serialized = {
      ...order,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      securityDeposit: Number(order.securityDeposit),
      items: order.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
    };
    res.json(serialized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.post('/from-cart', requireRole('CUSTOMER'), async (req, res) => {
  try {
    const { deliveryMethod, deliveryAddress, couponCode } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

    const vendorGroups = {};
    cartItems.forEach((ci) => {
      const vid = ci.product.vendorId;
      if (!vendorGroups[vid]) vendorGroups[vid] = [];
      vendorGroups[vid].push(ci);
    });

    const orders = [];
    for (const [vendorId, items] of Object.entries(vendorGroups)) {
      let subtotal = new Decimal(0);
      const orderItems = [];

      for (const ci of items) {
        const days = Math.ceil((new Date(ci.endDate) - new Date(ci.startDate)) / (1000 * 60 * 60 * 24)) || 1;
        const unitPrice = new Decimal(ci.product.basePrice).mul(days);
        const lineTotal = unitPrice.mul(ci.quantity);
        subtotal = subtotal.add(lineTotal);
        orderItems.push({
          productId: ci.productId,
          variantId: ci.variantId,
          quantity: ci.quantity,
          startDate: ci.startDate,
          endDate: ci.endDate,
          unitPrice,
          lineTotal,
        });
      }

      const taxAmount = subtotal.mul(0.18);
      let discountAmount = new Decimal(0);
      if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
          where: {
            code: couponCode,
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() },
          },
        });
        if (coupon) {
          if (coupon.discountType === 'percent') {
            discountAmount = subtotal.mul(Number(coupon.discountValue) / 100);
            if (coupon.maxDiscount && discountAmount.gt(coupon.maxDiscount)) {
              discountAmount = new Decimal(coupon.maxDiscount);
            }
          } else {
            discountAmount = new Decimal(coupon.discountValue);
          }
        }
      }

      const totalAmount = subtotal.add(taxAmount).sub(discountAmount);

      const order = await prisma.rentalOrder.create({
        data: {
          orderNumber: generateOrderNumber(),
          vendorId,
          customerId: req.user.id,
          status: 'RENTAL_ORDER',
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          deliveryMethod: deliveryMethod || 'standard',
          deliveryAddress: deliveryAddress || null,
          items: { create: orderItems },
        },
        include: { items: true, vendor: true, customer: true },
      });

      await prisma.cartItem.deleteMany({
        where: {
          userId: req.user.id,
          productId: { in: items.map((i) => i.productId) },
        },
      });

      orders.push(order);
    }

    res.status(201).json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.post('/', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const { customerId, items, rentalPeriod, notes } = req.body;
    const vendorId = req.user.role === 'ADMIN' ? req.body.vendorId : req.user.vendor.id;
    if (!vendorId || !customerId || !items?.length) {
      return res.status(400).json({ error: 'customerId, vendorId, and items required' });
    }

    let subtotal = new Decimal(0);
    const orderItems = [];
    for (const li of items) {
      const product = await prisma.product.findUnique({ where: { id: li.productId } });
      if (!product) return res.status(404).json({ error: `Product ${li.productId} not found` });
      const unitPrice = new Decimal(li.unitPrice || product.basePrice);
      const lineTotal = unitPrice.mul(li.quantity || 1);
      subtotal = subtotal.add(lineTotal);
      orderItems.push({
        productId: li.productId,
        variantId: li.variantId,
        quantity: li.quantity || 1,
        startDate: new Date(li.startDate),
        endDate: new Date(li.endDate),
        unitPrice,
        lineTotal,
      });
    }

    const taxAmount = subtotal.mul(0.18);
    const totalAmount = subtotal.add(taxAmount);

    const order = await prisma.rentalOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        vendorId,
        customerId,
        status: 'QUOTATION',
        subtotal,
        taxAmount,
        totalAmount,
        notes,
        items: { create: orderItems },
      },
      include: { items: true, vendor: true, customer: true },
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.patch('/:id/status', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['QUOTATION', 'RENTAL_ORDER', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.rentalOrder.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role === 'VENDOR' ? { vendorId: req.user.vendor.id } : {}),
      },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updateData = {};
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
      for (const item of order.items) {
        await prisma.reservation.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            startDate: item.startDate,
            endDate: item.endDate,
            status: 'active',
          },
        });
      }
    }
    if (status === 'PICKED_UP') {
      await prisma.pickup.create({
        data: { orderId: order.id, pickedAt: new Date() },
      });
    }
    if (status === 'RETURNED') {
      await prisma.return.create({
        data: { orderId: order.id, returnedAt: new Date(), lateFee: 0, damageFee: 0 },
      });
      await prisma.reservation.updateMany({
        where: { orderId: order.id },
        data: { status: 'released' },
      });
    }

    const updated = await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { status, ...updateData },
      include: { items: true, vendor: true, customer: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.post('/:id/pickup', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const order = await prisma.rentalOrder.findFirst({
      where: {
        id: req.params.id,
        status: 'CONFIRMED',
        ...(req.user.role === 'VENDOR' ? { vendorId: req.user.vendor.id } : {}),
      },
    });
    if (!order) return res.status(400).json({ error: 'Order must be confirmed before pickup' });

    await prisma.pickup.create({ data: { orderId: order.id, pickedAt: new Date() } });
    await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { status: 'PICKED_UP' },
    });

    res.json({ message: 'Pickup confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.post('/:id/return', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const { lateFee = 0, damageFee = 0 } = req.body;
    const order = await prisma.rentalOrder.findFirst({
      where: {
        id: req.params.id,
        status: 'PICKED_UP',
        ...(req.user.role === 'VENDOR' ? { vendorId: req.user.vendor.id } : {}),
      },
      include: { items: true },
    });
    if (!order) return res.status(400).json({ error: 'Order must be picked up before return' });

    await prisma.return.create({
      data: {
        orderId: order.id,
        returnedAt: new Date(),
        lateFee: parseFloat(lateFee) || 0,
        damageFee: parseFloat(damageFee) || 0,
      },
    });
    await prisma.reservation.updateMany({
      where: { orderId: order.id },
      data: { status: 'released' },
    });
    await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED' },
    });

    res.json({ message: 'Return confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
