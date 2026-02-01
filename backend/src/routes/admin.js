import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const adminRoutes = Router();

adminRoutes.use(authenticate);
adminRoutes.use(requireRole('ADMIN'));

// Get all vendors with stats
adminRoutes.get('/vendors', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            products: true,
            rentalOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products (across all vendors)
adminRoutes.get('/products', async (req, res) => {
  try {
    const { search, vendorId } = req.query;
    
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (vendorId) {
      where.vendorId = vendorId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (customers)
adminRoutes.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    
    const where = {};
    if (role) {
      where.role = role;
    } else {
      where.role = 'CUSTOMER'; // Default to customers
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            rentalOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (across all vendors)
adminRoutes.get('/orders', async (req, res) => {
  try {
    const { status, vendorId } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    if (vendorId) {
      where.vendorId = vendorId;
    }

    const orders = await prisma.rentalOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default adminRoutes;
