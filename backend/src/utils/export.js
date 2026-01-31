import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate Revenue Report PDF
 */
export function generateRevenueReportPDF(data, startDate, endDate) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(13, 148, 136);
    doc.text('Revenue Report', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, 20, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 34);

    // Summary
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Revenue: ₹${data.totalRevenue.toFixed(2)}`, 20, 48);

    // Chart Data Table
    if (data.chartData && data.chartData.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Daily Breakdown:', 20, 60);

        const tableData = data.chartData.map(d => [
            d.date,
            `₹${d.amount.toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 65,
            head: [['Date', 'Revenue']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [13, 148, 136] },
            styles: { fontSize: 9 },
        });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('KirayaKart - Rental Management System', 105, 285, { align: 'center' });

    return doc;
}

/**
 * Generate CSV from array of objects
 */
export function generateCSV(data, headers) {
    if (!data || data.length === 0) {
        return 'No data available';
    }

    // Use provided headers or extract from first object
    const cols = headers || Object.keys(data[0]);

    // Header row
    const rows = [cols.join(',')];

    // Data rows
    data.forEach(row => {
        const values = cols.map(col => {
            let val = row[col];

            // Handle nested objects
            if (typeof val === 'object' && val !== null) {
                val = JSON.stringify(val).replace(/"/g, '""');
            }

            // Escape commas and quotes
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                val = `"${val.replace(/"/g, '""')}"`;
            }

            return val ?? '';
        });
        rows.push(values.join(','));
    });

    return rows.join('\n');
}

/**
 * Generate Revenue CSV
 */
export function generateRevenueCSV(data) {
    const csvData = data.chartData.map(d => ({
        Date: d.date,
        Revenue: d.amount.toFixed(2),
    }));

    // Add summary row
    csvData.push({
        Date: 'TOTAL',
        Revenue: data.totalRevenue.toFixed(2),
    });

    return generateCSV(csvData, ['Date', 'Revenue']);
}

/**
 * Generate Most Rented Products CSV
 */
export function generateMostRentedCSV(data) {
    const csvData = data.map(item => ({
        Product: item.product?.name || 'Unknown',
        'Total Quantity': item.totalQuantity || 0,
        'Rental Count': item.rentalCount || 0,
    }));

    return generateCSV(csvData, ['Product', 'Total Quantity', 'Rental Count']);
}

/**
 * Generate Vendor Earnings CSV
 */
export function generateVendorEarningsCSV(data) {
    const csvData = data.map(v => ({
        Vendor: v.vendorName,
        'Total Earnings': v.total.toFixed(2),
    }));

    // Add total row
    const total = data.reduce((sum, v) => sum + v.total, 0);
    csvData.push({
        Vendor: 'TOTAL',
        'Total Earnings': total.toFixed(2),
    });

    return generateCSV(csvData, ['Vendor', 'Total Earnings']);
}
