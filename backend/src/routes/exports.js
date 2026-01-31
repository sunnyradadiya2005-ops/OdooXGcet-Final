import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
    generateRevenueReportPDF,
    generateRevenueCSV,
    generateMostRentedCSV,
    generateVendorEarningsCSV,
} from '../utils/export.js';

export const exportRoutes = Router();

exportRoutes.use(authenticate);
exportRoutes.use(requireRole('VENDOR', 'ADMIN'));

// Export revenue report as PDF
exportRoutes.get('/revenue/pdf', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const where = {
            paidAt: { gte: start, lte: end },
            status: 'COMPLETED',
        };

        if (req.user.role === 'VENDOR' && req.user.vendor) {
            where.invoice = { vendorId: req.user.vendor.id };
        }

        const payments = await prisma.payment.findMany({
            where,
            include: { invoice: true },
        });

        const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

        const byDate = {};
        payments.forEach((p) => {
            const d = p.paidAt.toISOString().split('T')[0];
            byDate[d] = (byDate[d] || 0) + Number(p.amount);
        });

        const chartData = Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, amount]) => ({ date, amount }));

        const doc = generateRevenueReportPDF(
            { totalRevenue, chartData },
            startDate,
            endDate
        );

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Export revenue report as CSV
exportRoutes.get('/revenue/csv', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const where = {
            paidAt: { gte: start, lte: end },
            status: 'COMPLETED',
        };

        if (req.user.role === 'VENDOR' && req.user.vendor) {
            where.invoice = { vendorId: req.user.vendor.id };
        }

        const payments = await prisma.payment.findMany({
            where,
            include: { invoice: true },
        });

        const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

        const byDate = {};
        payments.forEach((p) => {
            const d = p.paidAt.toISOString().split('T')[0];
            byDate[d] = (byDate[d] || 0) + Number(p.amount);
        });

        const chartData = Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, amount]) => ({ date, amount }));

        const csv = generateRevenueCSV({ totalRevenue, chartData });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export most rented products as CSV
exportRoutes.get('/most-rented/csv', async (req, res) => {
    try {
        const { startDate, endDate, limit = 100 } = req.query;
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();

        const where = {
            order: {
                status: { in: ['CONFIRMED', 'PICKED_UP', 'RETURNED'] },
                ...(req.user.role === 'VENDOR' && req.user.vendor ? { vendorId: req.user.vendor.id } : {}),
            },
            startDate: { lte: end },
            endDate: { gte: start },
        };

        const items = await prisma.orderItem.groupBy({
            by: ['productId'],
            where,
            _sum: { quantity: true },
            _count: true,
            orderBy: { _sum: { quantity: 'desc' } },
            take: parseInt(limit, 10),
        });

        const productIds = items.map((i) => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });
        const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

        const result = items.map((i) => ({
            product: productMap[i.productId],
            totalQuantity: i._sum.quantity || 0,
            rentalCount: i._count,
        }));

        const csv = generateMostRentedCSV(result);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=most-rented-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export vendor earnings as CSV (admin only)
exportRoutes.get('/vendor-earnings/csv', requireRole('ADMIN'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();

        const payments = await prisma.payment.findMany({
            where: {
                status: 'COMPLETED',
                paidAt: { gte: start, lte: end },
            },
            include: { invoice: { include: { vendor: true } } },
        });

        const byVendor = {};
        payments.forEach((p) => {
            const vid = p.invoice.vendorId;
            const vname = p.invoice.vendor.companyName;
            if (!byVendor[vid]) byVendor[vid] = { vendorId: vid, vendorName: vname, total: 0 };
            byVendor[vid].total += Number(p.amount);
        });

        const result = Object.values(byVendor).sort((a, b) => b.total - a.total);
        const csv = generateVendorEarningsCSV(result);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=vendor-earnings-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
