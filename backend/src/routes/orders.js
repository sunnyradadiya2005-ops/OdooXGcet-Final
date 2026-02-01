import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateOrderNumber } from '../utils/generators.js';
import { sendPickupConfirmation, sendLateReturnAlert, sendOrderUpdateEmail } from '../utils/email.js';
import { generateInvoicePDF } from '../utils/invoice-pdf.js';
import { getSettingValue } from '../utils/settings.js';

export const orderRoutes = Router();

// Helper function to check product availability
async function checkAvailability(productId, startDate, endDate, requestedQty) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQty: true, name: true },
  });

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      productId,
      status: 'active',
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } },
      ],
    },
  });

  const booked = reservations.reduce((sum, r) => sum + r.quantity, 0);
  const available = Math.max(0, product.stockQty - booked);

  if (available < requestedQty) {
    throw new Error(
      `Product "${product.name}" only has ${available} available for the requested dates (${requestedQty} requested)`
    );
  }

  return { available, product };
}

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

    // Hide unpaid RENTAL_ORDERs for customers (drafts)
    if (role === 'CUSTOMER' && !status) {
      where.OR = [
        { status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED'] } },
        {
          status: 'RENTAL_ORDER',
          invoices: {
            some: { status: { in: ['PAID', 'PARTIALLY_PAID'] } }
          }
        }
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
    const { deliveryMethod, deliveryAddress, billingAddress, couponCode } = req.body;

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
      // Check availability for all items before creating order
      for (const ci of items) {
        await checkAvailability(ci.productId, ci.startDate, ci.endDate, ci.quantity);
      }

      let subtotal = new Decimal(0);
      let securityDeposit = new Decimal(0);
      const orderItems = [];

      for (const ci of items) {
        const days = Math.ceil((new Date(ci.endDate) - new Date(ci.startDate)) / (1000 * 60 * 60 * 24)) || 1;
        const unitPrice = new Decimal(ci.product.basePrice).mul(days);
        const lineTotal = unitPrice.mul(ci.quantity);
        subtotal = subtotal.add(lineTotal);
        
        // Calculate security deposit per product
        const productDeposit = new Decimal(ci.product.depositAmount || 0).mul(ci.quantity);
        securityDeposit = securityDeposit.add(productDeposit);
        
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

      const totalAmount = subtotal.add(taxAmount).sub(discountAmount).add(securityDeposit);

      const order = await prisma.rentalOrder.create({
        data: {
          orderNumber: generateOrderNumber(),
          vendorId,
          customerId: req.user.id,
          status: 'RENTAL_ORDER',
          subtotal,
          taxAmount,
          discountAmount,
          securityDeposit,
          totalAmount,
          deliveryMethod: deliveryMethod || 'standard',
          deliveryAddress: deliveryAddress || null,
          billingAddress: billingAddress || null,
          items: { create: orderItems },
        },
        include: { items: true, vendor: true, customer: true },
      });

      /* 
      // Don't delete cart items yet - wait for payment success
      await prisma.cartItem.deleteMany({
        where: {
          userId: req.user.id,
          productId: { in: items.map((i) => i.productId) },
        },
      });
      */

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
    let securityDeposit = new Decimal(0);
    const orderItems = [];

    // Check availability for all items before creating order
    for (const li of items) {
      await checkAvailability(li.productId, li.startDate, li.endDate, li.quantity || 1);
    }

    for (const li of items) {
      const product = await prisma.product.findUnique({ where: { id: li.productId } });
      if (!product) return res.status(404).json({ error: `Product ${li.productId} not found` });
      const unitPrice = new Decimal(li.unitPrice || product.basePrice);
      const lineTotal = unitPrice.mul(li.quantity || 1);
      subtotal = subtotal.add(lineTotal);
      
      // Calculate security deposit per product
      const productDeposit = new Decimal(product.depositAmount || 0).mul(li.quantity || 1);
      securityDeposit = securityDeposit.add(productDeposit);
      
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

    const taxRate = await getSettingValue('tax_rate', 0.18);
    const taxAmount = subtotal.mul(taxRate);
    
    const totalAmount = subtotal.add(taxAmount).add(securityDeposit);

    const order = await prisma.rentalOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        vendorId,
        customerId,
        status: 'QUOTATION',
        subtotal,
        taxAmount,
        securityDeposit,
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

    // Validate status transitions
    const validTransitions = {
      QUOTATION: ['RENTAL_ORDER', 'CANCELLED'],
      RENTAL_ORDER: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: ['RETURNED', 'CANCELLED'],
      RETURNED: [], // Terminal state
      CANCELLED: [], // Terminal state
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${order.status} to ${status}. Valid transitions: ${validTransitions[order.status]?.join(', ') || 'none'}`,
      });
    }

    const updateData = {};
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
      
      // Critical check available stock for all items BEFORE creating reservations
      // This prevents double-booking (e.g., date 2-3 vs 1-4 overlap)
      for (const item of order.items) {
        try {
          await checkAvailability(item.productId, item.startDate, item.endDate, item.quantity);
        } catch (err) {
          return res.status(400).json({ error: `Cannot confirm order: ${err.message}` });
        }
      }

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
      const vendor = await prisma.vendor.findUnique({ where: { id: order.vendorId } });
      const now = new Date();
      let lateFee = 0;

      // Calculate Late Fee if enabled by vendor
      if (vendor && vendor.enableLateFee) {
        // Find the latest end date from items (assuming all items returned together for now)
        // Or strictly check if return date > order end date?
        // Let's use the latest item end date as the "due date"
        const maxEndDate = order.items.reduce((max, item) => (item.endDate > max ? item.endDate : max), new Date(0));
        
        if (now > maxEndDate) {
          const diffMs = now - maxEndDate;
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
          if (diffHours > 0) {
            lateFee = diffHours * Number(vendor.lateFeeAmount);
          }
        }
      }

      await prisma.return.create({
        data: { 
          orderId: order.id, 
          returnedAt: now, 
          lateFee: lateFee, 
          damageFee: 0 
        },
      });
      await prisma.reservation.updateMany({
        where: { orderId: order.id },
        data: { status: 'released' },
      });
    }

    const updated = await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { status, ...updateData },
      include: { 
        items: { include: { product: true } }, 
        vendor: true, 
        customer: true,
        invoices: true // Include invoices to generate PDF
      },
    });

    // Send email notification with invoice
    try {
      if (['CONFIRMED', 'RETURNED', 'CANCELLED'].includes(status) && updated.invoices.length > 0) {
        // Generate PDF
        const doc = generateInvoicePDF({
          ...updated.invoices[0],
          vendor: updated.vendor,
          customer: updated.customer,
          order: updated
        });
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Send Email
        await sendOrderUpdateEmail(updated, updated.customer, updated.vendor, pdfBuffer);
      }
    } catch (emailErr) {
      console.error('Failed to send order update email:', emailErr);
    }

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
      include: {
        customer: true,
        vendor: true,
        items: { include: { product: { select: { name: true } } } },
        pickups: true,
      },
    });
    if (!order) return res.status(400).json({ error: 'Order must be confirmed before pickup' });
    if (order.pickups.length > 0) return res.status(400).json({ error: 'Order already picked up' });

    const pickup = await prisma.pickup.create({
      data: {
        orderId: order.id,
        pickedAt: new Date(),
        notes: req.body.notes || null,
      },
    });
    await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { status: 'PICKED_UP' },
    });

    // Send pickup confirmation email with invoice
    try {
      // Fetch full order details for invoice generation
      const fullOrder = await prisma.rentalOrder.findUnique({
        where: { id: order.id },
        include: { 
          items: { include: { product: true } }, 
          vendor: true, 
          customer: true, 
          invoices: true 
        }
      });

      if (fullOrder && fullOrder.invoices.length > 0) {
        const doc = generateInvoicePDF({
          ...fullOrder.invoices[0],
          vendor: fullOrder.vendor,
          customer: fullOrder.customer,
          order: fullOrder
        });
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        
        await sendOrderUpdateEmail({ ...fullOrder, status: 'PICKED_UP' }, fullOrder.customer, fullOrder.vendor, pdfBuffer);
      } else {
        // Fallback to simple confirmation if no invoice found (shouldn't happen)
        await sendPickupConfirmation(order, order.customer, order.vendor);
      }
    } catch (emailErr) {
      console.error('Failed to send pickup email:', emailErr);
    }

    res.json({ message: 'Pickup confirmed', pickup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

orderRoutes.post('/:id/return', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const order = await prisma.rentalOrder.findFirst({
      where: {
        id: req.params.id,
        status: 'PICKED_UP',
        ...(req.user.role === 'VENDOR' ? { vendorId: req.user.vendor.id } : {}),
      },
      include: {
        customer: true,
        vendor: true,
        items: { include: { product: { select: { name: true } } } },
        returns: true,
        invoices: true,
      },
    });
    if (!order) return res.status(400).json({ error: 'Order must be picked up before return' });
    if (order.returns.length > 0) return res.status(400).json({ error: 'Order already returned' });

    const returnedAt = new Date();
    // Use the latest end date among all items for calculating delay
    const latestEndDate = order.items.length > 0 ? new Date(order.items[order.items.length - 1].endDate) : returnedAt;

    // Calculate delay and late fee
    let totalLateFee = 0;
    let delayDays = 0;

    if (order.status === 'PICKED_UP') {
      delayDays = Math.max(0, Math.ceil((returnedAt.getTime() - latestEndDate.getTime()) / (1000 * 60 * 60 * 24)));
      const LATE_FEE_PER_DAY = await getSettingValue('late_fee_per_day', parseFloat(process.env.LATE_FEE_PER_DAY || '100'));
      const autoLateFee = delayDays > 0 ? delayDays * LATE_FEE_PER_DAY : 0;
      const manualLateFee = parseFloat(req.body.lateFee || 0);
      totalLateFee = Math.max(autoLateFee, manualLateFee);
    }
    const damageFee = parseFloat(req.body.damageFee || 0);

    const returnRecord = await prisma.return.create({
      data: {
        orderId: order.id,
        returnedAt,
        lateFee: new Decimal(totalLateFee),
        damageFee: new Decimal(damageFee),
        notes: req.body.notes || null,
      },
    });

    // Release reservations (restore stock)
    await prisma.reservation.updateMany({
      where: { orderId: order.id },
      data: { status: 'released' },
    });

    await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED' },
    });

    // Update invoice with late fee and finalize amount
    if (order.invoices.length > 0) {
      const invoice = order.invoices[0];
      const additionalFees = new Decimal(totalLateFee).plus(damageFee);
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          lateFee: new Decimal(invoice.lateFee).plus(totalLateFee),
          // Final total should be (Paid - Deposited) + Fees
          // Or strictly: Earnings = Subtotal + Tax + Fees
          // Refund = SecurityDeposit - Fees. If Fees > Deposit, customer pays difference.
          // We adjust the Total Amount to reflect what the vendor *keeps*.
          totalAmount: new Decimal(invoice.subtotal).plus(invoice.taxAmount).plus(additionalFees).sub(invoice.discountAmount),
          status: 'PAID', // Ensure detailed status updates if needed
        },
      });
    }

    // Finalize Order Total to reflect Revenue (Subtotal + Tax + Fees - Discount)
    // This "cuts" the deposit from the total, so revenue stats are accurate.
    const finalTotal = new Decimal(order.subtotal)
      .plus(order.taxAmount)
      .sub(order.discountAmount)
      .plus(totalLateFee)
      .plus(damageFee);

    const updatedReturnOrder = await prisma.rentalOrder.update({
      where: { id: req.params.id },
      data: { 
        status: 'RETURNED',
        totalAmount: finalTotal, // Update total to be the actual revenue (excluding refunded deposit)
      },
      include: { 
        items: { include: { product: true } }, 
        vendor: true, 
        customer: true,
        invoices: true 
      }
    });

    // Send email notification with invoices
    try {
      if (updatedReturnOrder.invoices.length > 0) {
        // Generate PDF
        const doc = generateInvoicePDF({
          ...updatedReturnOrder.invoices[0],
          vendor: updatedReturnOrder.vendor,
          customer: updatedReturnOrder.customer,
          order: updatedReturnOrder
        });
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Send Email
        await sendOrderUpdateEmail(updatedReturnOrder, updatedReturnOrder.customer, updatedReturnOrder.vendor, pdfBuffer);
      }
    } catch (emailErr) {
      console.error('Failed to send order update email:', emailErr);
    }

    // Send late return alert if overdue
    if (totalLateFee > 0) {
      try {
        await sendLateReturnAlert(order, order.customer, order.vendor, delayDays, totalLateFee); // Fix delayHours -> delayDays variable name
      } catch (emailErr) {
        console.error('Failed to send late return alert:', emailErr);
      }
    }

    // Calculate refund amount for response
    const securityDeposit = Number(order.securityDeposit);
    const totalFees = totalLateFee + damageFee;
    const refundAmount = Math.max(0, securityDeposit - totalFees);

    res.json({
      message: 'Return confirmed',
      return: {
        ...returnRecord,
        lateFee: Number(returnRecord.lateFee),
        damageFee: Number(returnRecord.damageFee),
      },
      delayDays,
      lateFeeApplied: totalLateFee,
      refundAmount: refundAmount,
      revenueRealized: Number(finalTotal),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
