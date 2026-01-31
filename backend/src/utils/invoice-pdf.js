import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateInvoicePDF(invoice) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(13, 148, 136); // Teal
    doc.text('INVOICE', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('KirayaKart - Rental Management System', 20, 28);

    // Vendor Info
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('From:', 20, 45);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.vendor?.companyName || 'N/A', 20, 51);
    doc.text(`GST: ${invoice.vendor?.gstNumber || 'N/A'}`, 20, 57);

    // Billing Address
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, 70);
    doc.setFont(undefined, 'normal');
    const billing = invoice.billingAddress;
    if (billing && typeof billing === 'object') {
        doc.text(billing.name || `${invoice.customer?.firstName} ${invoice.customer?.lastName}`, 20, 76);
        doc.text(billing.line1 || '', 20, 82);
        doc.text(`${billing.city || ''} ${billing.zip || ''}`, 20, 88);
        doc.text(billing.country || '', 20, 94);
    } else {
        doc.text(`${invoice.customer?.firstName} ${invoice.customer?.lastName}`, 20, 76);
        doc.text(invoice.customer?.email || '', 20, 82);
    }

    // Shipping Address
    doc.setFont(undefined, 'bold');
    doc.text('Ship To:', 80, 70);
    doc.setFont(undefined, 'normal');
    const shipping = invoice.shippingAddress;
    if (shipping && typeof shipping === 'object') {
        doc.text(shipping.name || '', 80, 76);
        doc.text(shipping.line1 || '', 80, 82);
        doc.text(`${shipping.city || ''} ${shipping.zip || ''}`, 80, 88);
        doc.text(shipping.country || '', 80, 94);
    }

    // Invoice Details (Right side)
    doc.setFont(undefined, 'bold');
    doc.text('Invoice #:', 130, 45);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.invoiceNumber, 160, 45);

    doc.setFont(undefined, 'bold');
    doc.text('Date:', 130, 51);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(invoice.createdAt).toLocaleDateString(), 160, 51);

    doc.setFont(undefined, 'bold');
    doc.text('Order #:', 130, 57);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.order?.orderNumber || 'N/A', 160, 57);

    doc.setFont(undefined, 'bold');
    doc.text('Status:', 130, 63);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.status.replace('_', ' '), 160, 63);

    // Line Items Table
    const tableData = (invoice.order?.items || []).map(item => [
        item.product?.name || 'N/A',
        item.quantity.toString(),
        `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`,
        `₹${Number(item.lineTotal).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 110,
        head: [['Product', 'Qty', 'Rental Period', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] },
        styles: { fontSize: 9 },
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const rightX = 130;

    doc.setFontSize(10);
    doc.text('Subtotal:', rightX, finalY);
    doc.text(`₹${Number(invoice.subtotal).toFixed(2)}`, 180, finalY, { align: 'right' });

    doc.text('Tax (18%):', rightX, finalY + 6);
    doc.text(`₹${Number(invoice.taxAmount).toFixed(2)}`, 180, finalY + 6, { align: 'right' });

    if (Number(invoice.discountAmount) > 0) {
        doc.text('Discount:', rightX, finalY + 12);
        doc.text(`-₹${Number(invoice.discountAmount).toFixed(2)}`, 180, finalY + 12, { align: 'right' });
    }

    if (Number(invoice.securityDeposit) > 0) {
        doc.text('Security Deposit:', rightX, finalY + 18);
        doc.text(`₹${Number(invoice.securityDeposit).toFixed(2)}`, 180, finalY + 18, { align: 'right' });
    }

    if (Number(invoice.lateFee) > 0) {
        doc.setTextColor(220, 38, 38); // Red
        doc.text('Late Fee:', rightX, finalY + 24);
        doc.text(`₹${Number(invoice.lateFee).toFixed(2)}`, 180, finalY + 24, { align: 'right' });
        doc.setTextColor(0, 0, 0);
    }

    // Total
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    const totalY = finalY + (Number(invoice.lateFee) > 0 ? 32 : 26);
    doc.text('Total:', rightX, totalY);
    doc.text(`₹${Number(invoice.totalAmount).toFixed(2)}`, 180, totalY, { align: 'right' });

    // Paid Amount
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94); // Green
    doc.text('Paid:', rightX, totalY + 8);
    doc.text(`₹${Number(invoice.amountPaid).toFixed(2)}`, 180, totalY + 8, { align: 'right' });

    // Balance Due
    const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    if (remaining > 0) {
        doc.setTextColor(245, 158, 11); // Amber
        doc.setFont(undefined, 'bold');
        doc.text('Balance Due:', rightX, totalY + 14);
        doc.text(`₹${remaining.toFixed(2)}`, 180, totalY + 14, { align: 'right' });
    }

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    doc.text('KirayaKart - Your Trusted Rental Partner', 105, 285, { align: 'center' });

    return doc;
}
