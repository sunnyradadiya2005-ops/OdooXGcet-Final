import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getOrdersReportData,
  getRevenueReportData,
  getProductsReportData,
  getCustomersReportData,
  getVendorsReportData,
  convertToCSV,
} from '../services/report.service.js';
import { generateReportPDF } from '../utils/report-pdf.js';

export const exportRoutes = Router();

exportRoutes.use(authenticate);

// Export orders report
exportRoutes.get('/orders', async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    const vendorId = req.user.role === 'VENDOR' ? req.user.vendor?.id : null;

    const data = await getOrdersReportData({ startDate, endDate, vendorId });

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders_report.csv');
      res.send(csv);
    } else if (format === 'pdf') {
      const doc = generateReportPDF('Orders Report', data);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=orders_report.pdf');
      res.send(pdfBuffer);
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export revenue report
exportRoutes.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    const vendorId = req.user.role === 'VENDOR' ? req.user.vendor?.id : null;

    const data = await getRevenueReportData({ startDate, endDate, vendorId });

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue_report.csv');
      res.send(csv);
    } else if (format === 'pdf') {
      const doc = generateReportPDF('Revenue Report', data);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue_report.pdf');
      res.send(pdfBuffer);
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export products report
exportRoutes.get('/products', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const vendorId = req.user.role === 'VENDOR' ? req.user.vendor?.id : null;

    const data = await getProductsReportData({ vendorId });

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products_report.csv');
      res.send(csv);
    } else if (format === 'pdf') {
      const doc = generateReportPDF('Products Performance Report', data);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=products_report.pdf');
      res.send(pdfBuffer);
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export customers report (admin only)
exportRoutes.get('/customers', requireRole('ADMIN'), async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const data = await getCustomersReportData();

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=customers_report.csv');
      res.send(csv);
    } else if (format === 'pdf') {
      const doc = generateReportPDF('Customers Report', data);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=customers_report.pdf');
      res.send(pdfBuffer);
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export vendors report (admin only)
exportRoutes.get('/vendors', requireRole('ADMIN'), async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const data = await getVendorsReportData();

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vendors_report.csv');
      res.send(csv);
    } else if (format === 'pdf') {
      const doc = generateReportPDF('Vendors Report', data);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=vendors_report.pdf');
      res.send(pdfBuffer);
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
