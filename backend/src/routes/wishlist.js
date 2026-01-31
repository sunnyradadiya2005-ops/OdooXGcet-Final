import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const wishlistRoutes = Router();

wishlistRoutes.use(authenticate);
wishlistRoutes.use(requireRole('CUSTOMER'));

wishlistRoutes.get('/', async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { vendor: { select: { companyName: true } } },
        },
      },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

wishlistRoutes.post('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existing = await prisma.wishlistItem.findFirst({
      where: { userId: req.user.id, productId },
    });
    if (existing) return res.json(existing);

    const item = await prisma.wishlistItem.create({
      data: { userId: req.user.id, productId },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

wishlistRoutes.delete('/:productId', async (req, res) => {
  try {
    const item = await prisma.wishlistItem.findFirst({
      where: { userId: req.user.id, productId: req.params.productId },
    });
    if (!item) return res.status(404).json({ error: 'Not in wishlist' });
    await prisma.wishlistItem.delete({ where: { id: item.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
