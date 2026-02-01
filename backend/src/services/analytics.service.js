import prisma from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Analytics Service
 * Provides data aggregation and analytics for dashboards and reports
 */

// Get overall platform statistics (Admin)
export async function getPlatformOverview() {
  const [
    totalRevenue,
    totalOrders,
    activeVendors,
    activeCustomers,
    totalProducts,
    pendingReturns,
  ] = await Promise.all([
    // Total revenue from all paid/partially paid invoices
    prisma.invoice.aggregate({
      where: {
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
      },
      _sum: { amountPaid: true },
    }),
    
    // Total orders (excluding cancelled)
    prisma.rentalOrder.count({
      where: { status: { not: 'CANCELLED' } },
    }),
    
    // Active vendors (have at least one product)
    prisma.vendor.count({
      where: { products: { some: {} } },
    }),
    
    // Active customers (have at least one order)
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        rentalOrders: { some: {} },
      },
    }),
    
    // Total products listed
    prisma.product.count({
      where: { isActive: true },
    }),
    
    // Pending returns (picked up but not returned)
    prisma.rentalOrder.count({
      where: { status: 'PICKED_UP' },
    }),
  ]);

  return {
    totalRevenue: Number(totalRevenue._sum.amountPaid || 0),
    totalOrders,
    activeVendors,
    activeCustomers,
    totalProducts,
    pendingReturns,
  };
}

// Get revenue trend data (Admin or Vendor)
export async function getRevenueTrend(vendorId = null, period = 'month', limit = 12) {
  const where = {
    status: { in: ['PAID', 'PARTIALLY_PAID'] },
  };
  
  if (vendorId) {
    where.vendorId = vendorId;
  }

  // Get invoices with creation date
  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      createdAt: true,
      amountPaid: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by period
  const grouped = {};
  invoices.forEach(inv => {
    let key;
    const date = new Date(inv.createdAt);
    
    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!grouped[key]) {
      grouped[key] = { period: key, revenue: 0, count: 0 };
    }
    grouped[key].revenue += Number(inv.amountPaid);
    grouped[key].count += 1;
  });

  return Object.values(grouped)
    .sort((a, b) => b.period.localeCompare(a.period))
    .slice(0, limit)
    .reverse();
}

// Get top performing products
export async function getTopProducts(vendorId = null, limit = 10) {
  const where = {};
  if (vendorId) {
    where.vendorId = vendorId;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      _count: {
        select: { orderItems: true },
      },
      orderItems: {
        select: {
          lineTotal: true,
        },
      },
    },
  });

  const productStats = products.map(p => ({
    id: p.id,
    name: p.name,
    rentalCount: p._count.orderItems,
    totalRevenue: p.orderItems.reduce((sum, item) => sum + Number(item.lineTotal), 0),
  }))
  .sort((a, b) => b.rentalCount - a.rentalCount)
  .slice(0, limit);

  return productStats;
}

// Get vendor performance (Admin only)
export async function getVendorPerformance(limit = 10) {
  const vendors = await prisma.vendor.findMany({
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
      rentalOrders: {
        where: { status: { not: 'CANCELLED' } },
        select: {
          totalAmount: true,
        },
      },
      _count: {
        select: { rentalOrders: true },
      },
    },
  });

  const vendorStats = vendors.map(v => ({
    id: v.id,
    companyName: v.companyName,
    ownerName: `${v.user.firstName} ${v.user.lastName}`,
    orderCount: v._count.rentalOrders,
    totalRevenue: v.rentalOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    avgOrderValue: v.rentalOrders.length > 0
      ? v.rentalOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0) / v.rentalOrders.length
      : 0,
  }))
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, limit);

  return vendorStats;
}

// Get order status distribution
export async function getOrderStatusDistribution(vendorId = null) {
  const where = {};
  if (vendorId) {
    where.vendorId = vendorId;
  }

  const statusCounts = await prisma.rentalOrder.groupBy({
    by: ['status'],
    where,
    _count: true,
  });

  return statusCounts.map(s => ({
    status: s.status,
    count: s._count,
  }));
}

// Get vendor-specific overview
export async function getVendorOverview(vendorId) {
  const [
    totalRevenue,
    totalOrders,
    activeRentals,
    pendingReturns,
    totalProducts,
  ] = await Promise.all([
    // Total revenue (Sum of finalized order totals for non-cancelled orders)
    prisma.rentalOrder.aggregate({
      where: {
        vendorId,
        status: { not: 'CANCELLED' },
      },
      _sum: { totalAmount: true },
    }),
    
    // Total orders
    prisma.rentalOrder.count({
      where: {
        vendorId,
        status: { not: 'CANCELLED' },
      },
    }),
    
    // Active rentals (picked up)
    prisma.rentalOrder.count({
      where: {
        vendorId,
        status: 'PICKED_UP',
      },
    }),
    
    // Pending returns
    prisma.rentalOrder.count({
      where: {
        vendorId,
        status: 'PICKED_UP',
      },
    }),
    
    // Total products
    prisma.product.count({
      where: {
        vendorId,
        isActive: true,
      },
    }),
  ]);

  // Calculate average order value
  const orders = await prisma.rentalOrder.findMany({
    where: {
      vendorId,
      status: { not: 'CANCELLED' },
    },
    select: { totalAmount: true },
  });

  const avgOrderValue = orders.length > 0
    ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length
    : 0;

  return {
    totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
    totalOrders,
    activeRentals,
    pendingReturns,
    totalProducts,
    avgOrderValue,
  };
}

// Get top customers (Admin only)
export async function getTopCustomers(limit = 10) {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      rentalOrders: {
        where: { status: { not: 'CANCELLED' } },
        select: { totalAmount: true },
      },
      _count: {
        select: { rentalOrders: true },
      },
    },
  });

  const customerStats = customers
    .map(c => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      orderCount: c._count.rentalOrders,
      totalSpent: c.rentalOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    }))
    .filter(c => c.orderCount > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);

  return customerStats;
}
