import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function generateReportPDF(title, data) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFillColor(13, 148, 136); // Teal
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('KirayaKart', 20, 20);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Report Generation', 20, 30);

    // Title
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, 20, 60);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 68);

    if (!data || data.length === 0) {
        doc.text('No data available for this report.', 20, 80);
        return doc;
    }

    // Dynamic Columns from Data Keys
    const headers = Object.keys(data[0]).map(key => 
        key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase()) // CamelCase to Title Case
    );
    
    const rows = data.map(row => Object.values(row).map(val => String(val)));

    doc.autoTable({
        startY: 80,
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: {
            fillColor: [13, 148, 136],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 8,
            cellPadding: 4,
            overflow: 'linebreak',
        },
        columnStyles: {
            // autosize
        },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('KirayaKart Internal Report - Confidential', pageWidth / 2, pageHeight - 10, { align: 'center' });

    return doc;
}
