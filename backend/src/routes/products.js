import { Router } from 'express';
import { query } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const productRoutes = Router();

productRoutes.get(
  '/',
  [
    query('search').optional().trim(),
    query('brand').optional().trim(),
    query('color').optional().trim(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('category').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    try {
      const { search, brand, color, minPrice, maxPrice, category, page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * limit;

      const where = { isActive: true };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (brand) where.brand = { contains: brand, mode: 'insensitive' };
      if (color) {
        where.attributes = {
          some: { name: 'Color', value: { contains: color, mode: 'insensitive' } },
        };
      }
      if (minPrice != null) where.basePrice = { ...where.basePrice, gte: parseFloat(minPrice) };
      if (maxPrice != null) where.basePrice = { ...where.basePrice, lte: parseFloat(maxPrice) };
      if (category) {
        const cat = await prisma.productCategory.findUnique({ where: { slug: category } });
        if (cat) where.categoryId = cat.id;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            vendor: { select: { id: true, companyName: true } },
            category: { select: { name: true, slug: true } },
            rentalPeriods: true,
            attributes: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        products: products.map((p) => ({
          ...p,
          basePrice: Number(p.basePrice),
          hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

productRoutes.get('/brands', async (req, res) => {
  try {
    const brands = await prisma.product.findMany({
      where: { isActive: true, brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
    });
    res.json(brands.map((b) => b.brand).filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productRoutes.get('/colors', async (req, res) => {
  try {
    const attrs = await prisma.productAttribute.findMany({
      where: { name: 'Color' },
      select: { value: true },
      distinct: ['value'],
    });
    res.json([...new Set(attrs.map((a) => a.value))].sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productRoutes.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, isActive: true },
      include: {
        vendor: { select: { id: true, companyName: true, gstNumber: true } },
        category: { select: { name: true, slug: true } },
        rentalPeriods: { orderBy: { days: 'asc' } },
        attributes: true,
        variants: true,
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({
      ...product,
      basePrice: Number(product.basePrice),
      hourlyRate: product.hourlyRate ? Number(product.hourlyRate) : null,
      rentalPeriods: product.rentalPeriods.map((r) => ({
        ...r,
        multiplier: Number(r.multiplier),
      })),
      variants: product.variants.map((v) => ({
        ...v,
        priceMod: Number(v.priceMod),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productRoutes.get('/:id/availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const reservations = await prisma.reservation.findMany({
      where: {
        productId: req.params.id,
        status: 'active',
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { stockQty: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const booked = reservations.reduce((s, r) => s + r.quantity, 0);
    const available = Math.max(0, product.stockQty - booked);
    res.json({ available, booked, total: product.stockQty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productRoutes.use(authenticate);
productRoutes.use(requireRole('VENDOR', 'ADMIN'));

productRoutes.post('/', async (req, res) => {
  try {
    const vendorId = req.user.role === 'ADMIN' ? req.body.vendorId : req.user.vendor?.id;
    if (!vendorId) return res.status(400).json({ error: 'Vendor profile required' });
    const { name, description, brand, basePrice, hourlyRate, categoryId, stockQty, images } =
      req.body;
    const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        vendorId,
        categoryId: categoryId || null,
        name,
        slug,
        description: description || null,
        brand: brand || null,
        basePrice: parseFloat(basePrice) || 0,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        stockQty: parseInt(stockQty, 10) || 1,
        images: Array.isArray(images) ? images : [],
      },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productRoutes.patch('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (req.user.role !== 'ADMIN' && product.vendorId !== req.user.vendor?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const data = {};
    ['name', 'description', 'brand', 'basePrice', 'hourlyRate', 'stockQty', 'images', 'isActive'].forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });
    if (data.basePrice != null) data.basePrice = parseFloat(data.basePrice);
    if (data.hourlyRate != null) data.hourlyRate = parseFloat(data.hourlyRate);
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
