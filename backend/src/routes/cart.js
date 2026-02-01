import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const cartRoutes = Router();
cartRoutes.use(authenticate);
// cartRoutes.use(requireRole('CUSTOMER'));

cartRoutes.get('/', async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { vendor: { select: { id: true, companyName: true } } },
        },
      },
    });
    const withPrices = items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        basePrice: Number(item.product.basePrice),
        hourlyRate: item.product.hourlyRate ? Number(item.product.hourlyRate) : null,
      },
    }));
    res.json(withPrices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

cartRoutes.post(
  '/',
  [
    body('productId').notEmpty().withMessage('ProductId is required'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date'),
    body('quantity').optional().isInt({ min: 1 }).toInt(),
    body('variantId').optional(),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Cart Validation Error:', errors.array());
      return res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
    }

    try {
      console.log('Cart POST Body:', req.body);
      const { productId, startDate, endDate, quantity = 1, variantId } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        console.error('Cart Error: End date <= Start date');
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (!product.isActive) {
        console.error('Cart Error: Product inactive');
        return res.status(400).json({ error: 'Product not available' });
      }

      const existing = await prisma.cartItem.findFirst({
        where: {
          userId: req.user.id,
          productId,
          variantId: variantId || null,
          startDate: start,
          endDate: end,
        },
      });
      if (existing) {
        const updated = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
        return res.json(updated);
      }

      const item = await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          productId,
          variantId: variantId || null,
          quantity,
          startDate: start,
          endDate: end,
        },
      });
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

cartRoutes.patch('/:id', [param('id').isString()], async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    if (quantity != null && (quantity < 1 || !Number.isInteger(quantity))) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    const updated = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: quantity != null ? { quantity } : {},
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

cartRoutes.delete('/:id', async (req, res) => {
  try {
    const item = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

cartRoutes.delete('/', async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
