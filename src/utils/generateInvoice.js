/**
 * @fileoverview PDF Invoice Generator
 * Applies: javascript-pro (async/await, error handling), javascript-mastery (optional chaining),
 *          typescript-expert (JSDoc typed)
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND_RED = [186, 31, 61];   // #ba1f3d
const BRAND_DARK = [17, 24, 39];   // gray-900
const BRAND_LIGHT = [249, 250, 251]; // gray-50

/**
 * Generate and download a PDF invoice for an order.
 *
 * @param {Object} order - The order object from MongoDB
 * @param {string} order.orderID - Order reference number
 * @param {Object} order.customer - Customer details
 * @param {Array}  order.items - Order items
 * @param {number} order.total - Order total
 * @param {string} order.status - Current order status
 * @param {string} order.paymentMethod - Payment method used
 * @param {string} order.createdAt - ISO date string
 * @returns {void}
 */
export const generateInvoice = (order) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;

    // ── Brand Header ─────────────────────────────────────────────

    // Red accent bar
    doc.setFillColor(...BRAND_RED);
    doc.rect(0, 0, pageW, 3, 'F');

    // Logo / Brand Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...BRAND_RED);
    doc.text('STOP & SHOP', margin, 25);

    // Tagline
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('PREMIUM CLOTHING · PAKISTAN EDITION', margin, 31);

    // Invoice label (right side)
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 230, 230);
    doc.text('INVOICE', pageW - margin, 30, { align: 'right' });

    // ── Order Reference Box ───────────────────────────────────────

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(pageW - 80, 35, 60, 30, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    doc.text('ORDER REFERENCE', pageW - 75, 43);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_RED);
    doc.text(order.orderID ?? order._id?.toString().slice(-8).toUpperCase(), pageW - 75, 51);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    const issueDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString();
    doc.text(`Issued: ${issueDate}`, pageW - 75, 59);

    // ── Divider ───────────────────────────────────────────────────

    doc.setDrawColor(...BRAND_RED);
    doc.setLineWidth(0.5);
    doc.line(margin, 70, pageW - margin, 70);

    // ── Customer & Company Info ───────────────────────────────────

    // From (company)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    doc.text('FROM', margin, 80);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_DARK);
    doc.text('Stop & Shop', margin, 87);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    [
      'Zaib Market, Near Glorious Mall',
      'Gujrat, Punjab, Pakistan',
      'concierge@stop-shop.pk',
    ].forEach((line, i) => {
      doc.text(line, margin, 93 + i * 5);
    });

    // Bill To (customer)
    const billX = pageW / 2;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    doc.text('BILL TO', billX, 80);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_DARK);
    doc.text(order.customer?.name ?? 'N/A', billX, 87);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const billLines = [
      order.customer?.email ?? '',
      order.customer?.address ?? '',
      `${order.customer?.city ?? ''} ${order.customer?.zip ?? ''}`.trim(),
    ].filter(Boolean);

    billLines.forEach((line, i) => {
      doc.text(line, billX, 93 + i * 5);
    });

    // ── Items Table ───────────────────────────────────────────────

    const tableY = 120;
    const items = order.items ?? [];

    autoTable(doc, {
      startY: tableY,
      head: [['SKU / ID', 'Description', 'Size', 'Qty', 'Unit Price', 'Total']],
      body: items.map(item => [
        item.id ?? '—',
        item.name ?? 'Unknown',
        item.selectedSize || '—',
        item.quantity ?? 1,
        `Rs. ${(item.price ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
        `Rs. ${((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
      ]),
      headStyles: {
        fillColor: BRAND_DARK,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: BRAND_DARK,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold', textColor: BRAND_RED },
        1: { cellWidth: 60 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // ── Totals Box ────────────────────────────────────────────────

    const boxX = pageW - margin - 65;
    doc.setFillColor(...BRAND_RED);
    doc.roundedRect(boxX, finalY, 65, 22, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL PAYABLE', boxX + 5, finalY + 8);

    doc.setFontSize(14);
    doc.text(
      `Rs. ${(order.total ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
      boxX + 5,
      finalY + 17
    );

    // Payment method
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Payment: ${order.paymentMethod ?? 'N/A'} · Status: ${order.status ?? 'Pending'}`,
      margin,
      finalY + 14
    );

    // ── Footer ────────────────────────────────────────────────────

    doc.setFillColor(...BRAND_RED);
    doc.rect(0, pageH - 15, pageW, 15, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Thank you for shopping with Stop & Shop · This is a computer-generated invoice.', pageW / 2, pageH - 7, { align: 'center' });

    // ── Download ──────────────────────────────────────────────────

    const filename = `invoice-${order.orderID ?? 'order'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

  } catch (err) {
    console.error('[Invoice] Failed to generate PDF:', err);
    alert('Failed to generate invoice PDF. Please try again.');
  }
};
