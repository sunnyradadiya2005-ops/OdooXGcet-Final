import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getPlatformOverview,
  getRevenueTrend,
  getTopProducts,
  getVendorPerformance,
  getOrderStatusDistribution,
  getVendorOverview,
  getTopCustomers,
} from '../services/analytics.service.js';

export const analyticsRoutes = Router();

analyticsRoutes.use(authenticate);

// ============ ADMIN ANALYTICS ============

// Get overall platform statistics
analyticsRoutes.get('/overview', requireRole('ADMIN'), async (req, res) => {
  try {
    const overview = await getPlatformOverview();
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get revenue trend
analyticsRoutes.get('/revenue', async (req, res) => {
  try {
    const { period = 'month', limit = 12 } = req.query;
    const vendorId = req.user.role === 'VENDOR' ? req.user.vendor?.id : null;
    
    const trend = await getRevenueTrend(vendorId, period, parseInt(limit));
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get top performing products
analyticsRoutes.get('/products/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const vendorId = req.user.role === 'VENDOR' ? req.user.vendor?.id : null;
    
    const products = await getTopProducts(vendorId, parseInt(limit));
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vendor performance (admin only)
analyticsRoutes.get('/vendors', requireRole('ADMIN'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const vendors = await getVendorPerformance(parseInt(limit));
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order status distribution
analyticsRoutes.get('/orders/status', async (req, res) => {
  try {
    const vendorId = req.user.role === 'VENDOR' ? req.user.vendor?.id : null;
    const distribution = await getOrderStatusDistribution(vendorId);
    res.json(distribution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get top customers (admin only)
analyticsRoutes.get('/customers/top', requireRole('ADMIN'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const customers = await getTopCustomers(parseInt(limit));
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ VENDOR ANALYTICS ============

// Get vendor-specific overview
analyticsRoutes.get('/vendor/overview', requireRole('VENDOR'), async (req, res) => {
  try {
    if (!req.user.vendor?.id) {
      return res.status(400).json({ error: 'Vendor profile required' });
    }
    
    const overview = await getVendorOverview(req.user.vendor.id);
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vendor revenue trend
analyticsRoutes.get('/vendor/revenue', requireRole('VENDOR'), async (req, res) => {
  try {
    if (!req.user.vendor?.id) {
      return res.status(400).json({ error: 'Vendor profile required' });
    }
    
    const { period = 'month', limit = 12 } = req.query;
    const trend = await getRevenueTrend(req.user.vendor.id, period, parseInt(limit));
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vendor product performance
analyticsRoutes.get('/vendor/products', requireRole('VENDOR'), async (req, res) => {
  try {
    if (!req.user.vendor?.id) {
      return res.status(400).json({ error: 'Vendor profile required' });
    }
    
    const { limit = 10 } = req.query;
    const products = await getTopProducts(req.user.vendor.id, parseInt(limit));
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
