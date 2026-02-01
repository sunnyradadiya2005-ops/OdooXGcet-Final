import { Router } from 'express';
import { query } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

export const productRoutes = Router();

productRoutes.get(
  '/',
  optionalAuth,
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
      
      console.log('GET /products User:', req.user ? `${req.user.role} (${req.user.firstName})` : 'Guest');

      // Vendors and admins see all products, customers see only active products
      const where = {};
      
      // Only filter by isActive if user is not a vendor/admin
      if (!req.user || (req.user.role !== 'VENDOR' && req.user.role !== 'ADMIN')) {
        where.isActive = true;
      }

      // If vendor is logged in, filter to show only their products
      if (req.user?.role === 'VENDOR' && req.user.vendor?.id) {
        where.vendorId = req.user.vendor.id;
      }

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
            reservations: {
              where: {
                status: 'active',
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
              select: { quantity: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        products: products.map((p) => {
          const booked = p.reservations.reduce((sum, r) => sum + r.quantity, 0);
          return {
            ...p,
            basePrice: Number(p.basePrice),
            hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
            depositAmount: Number(p.depositAmount),
            availableQty: Math.max(0, p.stockQty - booked),
            reservations: undefined, // Remove reservations from response to keep it clean
          };
        }),
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

productRoutes.get('/:id', optionalAuth, async (req, res) => {
  try {
    const where = { id: req.params.id };
    
    // Only filter by isActive if user is not a vendor/admin
    if (!req.user || (req.user.role !== 'VENDOR' && req.user.role !== 'ADMIN')) {
      where.isActive = true;
    }
    
    const product = await prisma.product.findFirst({
      where,
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
      depositAmount: Number(product.depositAmount),
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
productRoutes.use(requireRole('VENDOR')); // Only vendors can manage products

// Image upload route
productRoutes.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Return the relative path to the uploaded image
    const imagePath = `/uploads/products/${req.file.filename}`;
    res.json({ imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productRoutes.post('/', async (req, res) => {
  try {
    // Only vendors can create products
    const vendorId = req.user.vendor?.id;
    if (!vendorId) return res.status(400).json({ error: 'Vendor profile required' });
    const { name, description, brand, basePrice, hourlyRate, depositAmount, categoryId, stockQty, images } =
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
        depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
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
    
    // Only the product owner (vendor) can edit
    if (product.vendorId !== req.user.vendor?.id) {
      return res.status(403).json({ error: 'You can only edit your own products' });
    }
    const data = {};
    ['name', 'description', 'brand', 'basePrice', 'hourlyRate', 'depositAmount', 'stockQty', 'images', 'isActive'].forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });
    if (data.basePrice != null) data.basePrice = parseFloat(data.basePrice);
    if (data.hourlyRate != null) data.hourlyRate = parseFloat(data.hourlyRate);
    if (data.depositAmount != null) data.depositAmount = parseFloat(data.depositAmount);
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productRoutes.delete('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    // Only the product owner (vendor) can delete
    if (product.vendorId !== req.user.vendor?.id) {
      return res.status(403).json({ error: 'You can only delete your own products' });
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    // Handle foreign key constraint errors (e.g., if product is in orders)
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete product: It is associated with existing orders or cart items.' });
    }
    res.status(500).json({ error: err.message });
  }
});
