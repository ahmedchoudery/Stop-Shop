import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  const brandRed = '#F63049';
  const brandYellow = '#FACC15';

  // --- Header ---
  doc.setFillColor(31, 41, 55); // Dark Gray / Black
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('STOP & SHOP', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PREMIUM CLOTHING & FOOTWEAR', 20, 32);

  // --- Invoice Info ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 140, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: ${order.orderID}`, 140, 70);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 75);
  doc.text(`Status: ${order.status.toUpperCase()}`, 140, 80);

  // --- Customer Info ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customer.name, 20, 68);
  doc.text(order.customer.address, 20, 73);
  doc.text(`${order.customer.city}, Gujarat`, 20, 78);
  doc.text(order.customer.zip, 20, 83);
  doc.text(order.customer.email, 20, 88);

  // --- Table of Items ---
  const tableColumn = ["Product ID", "Description", "Qty", "Price", "Total"];
  const tableRows = order.items.map(item => [
    item.id,
    item.name,
    item.quantity || 1,
    `$${item.price.toFixed(2)}`,
    `$${(item.price * (item.quantity || 1)).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 100,
    head: [tableColumn],
    body: tableRows,
    headStyles: { 
      fillColor: [246, 48, 73], // Brand Red
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 20, right: 20 },
  });

  // --- Totals ---
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRAND TOTAL: $${order.total.toFixed(2)}`, 140, finalY);

  // --- Footer ---
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for shopping at Stop & Shop Gujrat!', 105, 280, null, null, 'center');
  doc.text('This is a computer-generated invoice and requires no signature.', 105, 285, null, null, 'center');

  // --- Save ---
  doc.save(`Invoice_${order.orderID}.pdf`);
};
