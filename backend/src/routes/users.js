import { Router } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const userRoutes = Router();

userRoutes.use(authenticate);

userRoutes.get('/customers', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, email: true, firstName: true, lastName: true },
      orderBy: { firstName: 'asc' },
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRoutes.get('/me', async (req, res) => {
  try {
    const { user } = req;

    // 1. Get createdAt
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { createdAt: true }
    });

    // 2. Get counts separately (safer than nested select)
    const ordersCount = await prisma.rentalOrder.count({
      where: { customerId: user.id }
    });

    const wishlistCount = await prisma.wishlistItem.count({
      where: { userId: user.id }
    });

    const activeRentalsCount = await prisma.rentalOrder.count({
      where: {
        customerId: user.id,
        status: { in: ['RENTAL_ORDER', 'CONFIRMED', 'PICKED_UP'] }
      }
    });

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      referralCode: user.referralCode,
      walletBalance: user.walletBalance,
      vendor: user.vendor ? { id: user.vendor.id, companyName: user.vendor.companyName } : null,
      createdAt: dbUser?.createdAt,
      ordersCount,
      activeRentalsCount,
      wishlistCount,
    });
  } catch (err) {
    console.error('Error in /me:', err);
    res.status(500).json({ error: err.message });
  }
});

userRoutes.get('/addresses', requireRole('CUSTOMER'), async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
    });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRoutes.post(
  '/addresses',
  requireRole('CUSTOMER'),
  [
    body('line1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('zip').trim().notEmpty(),
    body('country').optional().trim(),
    body('label').optional().trim(),
    body('isDefault').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const { line1, line2, city, state, zip, country = 'India', label, isDefault } = req.body;
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user.id },
          data: { isDefault: false },
        });
      }
      const address = await prisma.address.create({
        data: {
          userId: req.user.id,
          line1,
          line2: line2 || null,
          city,
          state: state || null,
          zip,
          country,
          label: label || null,
          isDefault: !!isDefault,
        },
      });
      res.status(201).json(address);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

userRoutes.patch('/addresses/:id', requireRole('CUSTOMER'), async (req, res) => {
  try {
    const addr = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!addr) return res.status(404).json({ error: 'Address not found' });
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }
    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRoutes.delete('/addresses/:id', requireRole('CUSTOMER'), async (req, res) => {
  try {
    const addr = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!addr) return res.status(404).json({ error: 'Address not found' });
    await prisma.address.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
