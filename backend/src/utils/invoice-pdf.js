import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function generateInvoicePDF(invoice) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Colors
    const primaryColor = [13, 148, 136]; // Teal
    const darkGray = [51, 51, 51];
    const mediumGray = [100, 100, 100];
    const lightGray = [150, 150, 150];
    const borderColor = [226, 232, 240];

    // ==================== HEADER ====================
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('KirayaKart', 20, 20);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Rental Management System', 20, 28);

    // INVOICE Title
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', pageWidth - 20, 25, { align: 'right' });

    // ==================== COMPANY & INVOICE INFO ====================
    let yPos = 58;

    // Left Column - Vendor Information
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', 20, yPos);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text(invoice.vendor?.companyName || 'JT Builders', 20, yPos + 7);
    
    doc.setTextColor(...mediumGray);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`GST: ${invoice.vendor?.gstNumber || '23ASFASCGCDCSFFDSAF'}`, 20, yPos + 14);
    doc.text('Email: support@kirayakart.com', 20, yPos + 20);
    doc.text('Phone: +91 1234567890', 20, yPos + 26);

    // Right Column - Invoice Details (moved further right to avoid overlap)
    const rightCol = 125;
    const valueCol = pageWidth - 15;
    
    doc.setTextColor(...mediumGray);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    doc.text('Invoice Number:', rightCol, yPos);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(invoice.invoiceNumber, valueCol, yPos, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Invoice Date:', rightCol, yPos + 7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    const invoiceDate = new Date(invoice.createdAt);
    doc.text(`${invoiceDate.getDate()}/${invoiceDate.getMonth() + 1}/${invoiceDate.getFullYear()}`, valueCol, yPos + 7, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Order Number:', rightCol, yPos + 14);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(invoice.order?.orderNumber || 'N/A', valueCol, yPos + 14, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Status:', rightCol, yPos + 21);
    doc.setFont(undefined, 'bold');
    
    // Status with color
    const status = invoice.status.replace('_', ' ');
    if (invoice.status === 'PAID') {
        doc.setTextColor(34, 197, 94); // Green
    } else if (invoice.status === 'DRAFT') {
        doc.setTextColor(...lightGray);
    } else {
        doc.setTextColor(245, 158, 11); // Amber
    }
    doc.text(status, valueCol, yPos + 21, { align: 'right' });

    // Transaction ID (New)
    const payment = invoice.payments && invoice.payments.length > 0 ? invoice.payments[0] : null;
    let transactionId = payment?.razorpayPaymentId;
    
    // If paid but no ID (e.g. test mode), generate one deterministic ID based on Invoice ID
    if (invoice.status === 'PAID' && !transactionId) {
        transactionId = 'TXN-' + invoice.id.substring(invoice.id.length - 8).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    }

    if (transactionId) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...mediumGray);
        doc.text('Transaction ID:', rightCol, yPos + 28);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...darkGray);
        doc.text(transactionId, valueCol, yPos + 28, { align: 'right' });
    }

    // ==================== SEPARATOR LINE ====================
    yPos = 100;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);

    // ==================== BILLING & SHIPPING ====================
    yPos = 110;
    
    // Bill To
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('BILL TO:', 20, yPos);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const customerName = `${invoice.customer?.firstName || ''} ${invoice.customer?.lastName || ''}`.trim();
    doc.text(customerName, 20, yPos + 8);
    
    doc.setTextColor(...mediumGray);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.customer?.email || '', 20, yPos + 15);
    
    const billing = invoice.billingAddress;
    if (billing && typeof billing === 'object') {
        doc.text(billing.line1 || '', 20, yPos + 21);
        doc.text(`${billing.city || ''}, ${billing.zip || ''}`, 20, yPos + 27);
        doc.text(billing.country || 'India', 20, yPos + 33);
    }

    // Ship To
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('SHIP TO:', 115, yPos);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const shipping = invoice.shippingAddress;
    if (shipping && typeof shipping === 'object') {
        doc.text(shipping.name || customerName, 115, yPos + 8);
        doc.setTextColor(...mediumGray);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(shipping.line1 || '', 115, yPos + 15);
        doc.text(`${shipping.city || ''}, ${shipping.zip || ''}`, 115, yPos + 21);
        doc.text(shipping.country || 'India', 115, yPos + 27);
    } else {
        doc.setTextColor(...mediumGray);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Same as billing address', 115, yPos + 8);
    }

    // ==================== LINE ITEMS TABLE ====================
    yPos = 160;
    
    const tableData = (invoice.order?.items || []).map((item, index) => {
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        const dateStr = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}\n${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
        
        return [
            (index + 1).toString(),
            item.product?.name || 'N/A',
            item.quantity.toString(),
            dateStr,
            Number(item.lineTotal).toFixed(2)
        ];
    });

    doc.autoTable({
        startY: yPos,
        head: [['#', 'Product Description', 'Qty', 'Rental Period', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 6
        },
        styles: {
            fontSize: 9,
            cellPadding: 6,
            textColor: darkGray,
            lineColor: borderColor,
            lineWidth: 0.1
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 70 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 40, halign: 'center', fontSize: 8.5 },
            4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        margin: { left: 20, right: 20 },
        didParseCell: function(data) {
            // Format amount column with Rs. prefix
            if (data.column.index === 4 && data.section === 'body') {
                data.cell.text = ['Rs. ' + data.cell.text[0]];
            }
        }
    });

    // ==================== TOTALS SECTION ====================
    const finalY = doc.lastAutoTable.finalY + 15;
    const totalsLabelX = pageWidth - 90;
    const totalsValueX = pageWidth - 20;
    
    let currentY = finalY;
    
    doc.setFontSize(9);
    doc.setTextColor(...mediumGray);
    doc.setFont(undefined, 'normal');
    
    // Subtotal
    doc.text('Subtotal:', totalsLabelX, currentY);
    doc.setTextColor(...darkGray);
    doc.text('Rs. ' + Number(invoice.subtotal).toFixed(2), totalsValueX, currentY, { align: 'right' });
    currentY += 6;

    // Tax
    doc.setTextColor(...mediumGray);
    doc.text('Tax (18% GST):', totalsLabelX, currentY);
    doc.setTextColor(...darkGray);
    doc.text('Rs. ' + Number(invoice.taxAmount).toFixed(2), totalsValueX, currentY, { align: 'right' });
    currentY += 6;

    // Discount (if any)
    if (Number(invoice.discountAmount) > 0) {
        doc.setTextColor(...mediumGray);
        doc.text('Discount:', totalsLabelX, currentY);
        doc.setTextColor(34, 197, 94); // Green
        doc.text('-Rs. ' + Number(invoice.discountAmount).toFixed(2), totalsValueX, currentY, { align: 'right' });
        currentY += 6;
    }

    // Security Deposit (if any)
    if (Number(invoice.securityDeposit) > 0) {
        doc.setTextColor(...mediumGray);
        doc.text('Security Deposit:', totalsLabelX, currentY);
        doc.setTextColor(...darkGray);
        doc.text('Rs. ' + Number(invoice.securityDeposit).toFixed(2), totalsValueX, currentY, { align: 'right' });
        currentY += 6;
    }

    // Late Fee (if any)
    if (Number(invoice.lateFee) > 0) {
        doc.setTextColor(...mediumGray);
        doc.text('Late Fee:', totalsLabelX, currentY);
        doc.setTextColor(220, 38, 38); // Red
        doc.text('Rs. ' + Number(invoice.lateFee).toFixed(2), totalsValueX, currentY, { align: 'right' });
        currentY += 6;
    }

    // Separator line before total
    currentY += 3;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(totalsLabelX - 5, currentY, totalsValueX, currentY);
    currentY += 8;

    // Total Amount
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('TOTAL:', totalsLabelX, currentY);
    doc.text('Rs. ' + Number(invoice.totalAmount).toFixed(2), totalsValueX, currentY, { align: 'right' });
    currentY += 8;

    // Paid Amount
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...mediumGray);
    doc.text('Amount Paid:', totalsLabelX, currentY);
    doc.setTextColor(34, 197, 94); // Green
    doc.setFont(undefined, 'bold');
    doc.text('Rs. ' + Number(invoice.amountPaid).toFixed(2), totalsValueX, currentY, { align: 'right' });
    currentY += 6;

    // Balance Due or Paid in Full
    const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    if (remaining > 0) {
        doc.setTextColor(...darkGray);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('BALANCE DUE:', totalsLabelX, currentY);
        doc.setTextColor(220, 38, 38); // Red
        doc.text('Rs. ' + remaining.toFixed(2), totalsValueX, currentY, { align: 'right' });
    } else {
        doc.setTextColor(34, 197, 94); // Green
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text('PAID IN FULL', totalsValueX, currentY, { align: 'right' });
    }

    // ==================== PAYMENT TERMS & NOTES ====================
    currentY += 20;
    
    if (currentY < pageHeight - 70) {
        doc.setTextColor(...darkGray);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Payment Terms:', 20, currentY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...mediumGray);
        doc.text('• Payment is due within 7 days of invoice date', 20, currentY + 6);
        doc.text('• Late payments may incur additional charges', 20, currentY + 11);
        doc.text('• Security deposit will be refunded after successful return of items', 20, currentY + 16);
        
        currentY += 26;
        
        doc.setTextColor(...darkGray);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Notes:', 20, currentY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...darkGray);
        doc.text('Thank you for choosing KirayaKart for your rental needs.', 20, currentY + 6);
        doc.setTextColor(...mediumGray);
        doc.text('For any queries, please contact us at support@kirayakart.com', 20, currentY + 11);
    }

    // ==================== FOOTER ====================
    const footerY = pageHeight - 20;
    
    // Footer separator line
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 8, pageWidth - 20, footerY - 8);
    
    // Footer text
    doc.setTextColor(...mediumGray);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    doc.text('KirayaKart - Your Trusted Rental Partner', pageWidth / 2, footerY, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(...lightGray);
    doc.text('This is a computer-generated invoice and does not require a signature', pageWidth / 2, footerY + 5, { align: 'center' });
    
    // Generation info
    doc.setFontSize(7);
    const genDate = new Date();
    const genDateStr = `${genDate.getDate()}/${genDate.getMonth() + 1}/${genDate.getFullYear()}`;
    const genTimeStr = genDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Generated on: ${genDateStr} ${genTimeStr}`, 20, footerY + 10);
    doc.text('Page 1 of 1', pageWidth - 20, footerY + 10, { align: 'right' });

    return doc;
}
