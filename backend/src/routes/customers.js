import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const customerRoutes = Router();

customerRoutes.use(authenticate);
customerRoutes.use(requireRole('VENDOR'));

// Get customers for the logged-in vendor
customerRoutes.get('/', async (req, res) => {
  try {
    const vendorId = req.user.vendor?.id;
    console.log('🔍 Customer API called by vendor:', vendorId);
    console.log('👤 User:', req.user.email, 'Role:', req.user.role);
    
    if (!vendorId) {
      console.log('❌ No vendor ID found');
      return res.status(400).json({ error: 'Vendor profile required' });
    }

    // Get unique customers who have ordered from this vendor
    const orders = await prisma.rentalOrder.findMany({
      where: { vendorId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📦 Found ${orders.length} orders for vendor ${vendorId}`);

    // Extract unique customers with order stats
    const customerMap = new Map();
    
    orders.forEach((order) => {
      const customerId = order.customer.id;
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          ...order.customer,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.totalOrders += 1;
      customer.totalSpent += parseFloat(order.totalAmount) || 0;
      
      if (!customer.lastOrderDate || new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt;
      }
    });

    const customers = Array.from(customerMap.values());
    console.log(`👥 Returning ${customers.length} unique customers`);
    
    res.json(customers);
  } catch (err) {
    console.error('❌ Error fetching customers:', err);
    res.status(500).json({ error: err.message });
  }
});

export default customerRoutes;
