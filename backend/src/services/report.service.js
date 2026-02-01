import prisma from '../lib/prisma.js';

/**
 * Report Service
 * Generates exportable reports in various formats
 */

// Get orders report data
export async function getOrdersReportData(filters = {}) {
  const { startDate, endDate, vendorId, status } = filters;
  
  const where = {};
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }
  if (vendorId) {
    where.vendorId = vendorId;
  }
  if (status) {
    where.status = status;
  }

  const orders = await prisma.rentalOrder.findMany({
    where,
    include: {
      vendor: { select: { companyName: true } },
      customer: { select: { firstName: true, lastName: true, email: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map(order => ({
    orderNumber: order.orderNumber,
    date: order.createdAt.toISOString().split('T')[0],
    vendor: order.vendor.companyName,
    customer: `${order.customer.firstName} ${order.customer.lastName}`,
    customerEmail: order.customer.email,
    status: order.status,
    subtotal: Number(order.subtotal),
    tax: Number(order.taxAmount),
    securityDeposit: Number(order.securityDeposit),
    total: Number(order.totalAmount),
    itemCount: order.items.length,
  }));
}

// Get revenue report data
export async function getRevenueReportData(filters = {}) {
  const { startDate, endDate, vendorId } = filters;
  
  const where = {
    status: { in: ['PAID', 'PARTIALLY_PAID'] },
  };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }
  if (vendorId) {
    where.vendorId = vendorId;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      vendor: { select: { companyName: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invoices.map(inv => ({
    invoiceNumber: inv.invoiceNumber,
    orderNumber: inv.order?.orderNumber || 'N/A',
    date: inv.createdAt.toISOString().split('T')[0],
    vendor: inv.vendor.companyName,
    subtotal: Number(inv.subtotal),
    tax: Number(inv.taxAmount),
    securityDeposit: Number(inv.securityDeposit),
    lateFee: Number(inv.lateFee),
    total: Number(inv.totalAmount),
    amountPaid: Number(inv.amountPaid),
    balance: Number(inv.totalAmount) - Number(inv.amountPaid),
    status: inv.status,
  }));
}

// Get products report data
export async function getProductsReportData(filters = {}) {
  const { vendorId } = filters;
  
  const where = {};
  if (vendorId) {
    where.vendorId = vendorId;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      vendor: { select: { companyName: true } },
      category: { select: { name: true } },
      _count: { select: { orderItems: true } },
    },
  });

  return products.map(p => ({
    name: p.name,
    vendor: p.vendor.companyName,
    category: p.category?.name || 'Uncategorized',
    brand: p.brand || 'N/A',
    basePrice: Number(p.basePrice),
    depositAmount: Number(p.depositAmount),
    stockQty: p.stockQty,
    timesRented: p._count.orderItems,
    isActive: p.isActive ? 'Yes' : 'No',
  }));
}

// Get customers report data (admin only)
export async function getCustomersReportData() {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      _count: { select: { rentalOrders: true } },
      rentalOrders: {
        where: { status: { not: 'CANCELLED' } },
        select: { totalAmount: true },
      },
    },
  });

  return customers.map(c => ({
    name: `${c.firstName} ${c.lastName}`,
    email: c.email,
    joinedDate: c.createdAt.toISOString().split('T')[0],
    totalOrders: c._count.rentalOrders,
    totalSpent: c.rentalOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
  }));
}

// Get vendors report data (admin only)
export async function getVendorsReportData() {
  const vendors = await prisma.vendor.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { products: true, rentalOrders: true } },
      rentalOrders: {
        where: { status: { not: 'CANCELLED' } },
        select: { totalAmount: true },
      },
    },
  });

  return vendors.map(v => ({
    companyName: v.companyName,
    ownerName: `${v.user.firstName} ${v.user.lastName}`,
    email: v.user.email,
    gstNumber: v.gstNumber,
    phone: v.phone || 'N/A',
    city: v.city || 'N/A',
    totalProducts: v._count.products,
    totalOrders: v._count.rentalOrders,
    totalRevenue: v.rentalOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
  }));
}

// Convert data to CSV format
export function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
