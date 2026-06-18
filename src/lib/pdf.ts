import { Bill } from '@/types';
import { legacyUnitQtyDisplay, legacyTotalQtyDisplay } from '@/utils/unitLabels';

async function loadImageAsDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateInvoicePDF(bill: Bill): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const margin = 14;

  // ── Header (two-column layout) ───────────────────────────────────────────────
  const headerTop = 10;
  const headerH = 52;
  const leftColW = 86;
  const divX1 = margin + leftColW;       // 100
  const rightColX = divX1 + 10;         // 110

  // Top border line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(margin, headerTop - 2, pageWidth - margin, headerTop - 2);

  // Logo (flush left, minimal left offset)
  try {
    const logoData = await loadImageAsDataURL(`${window.location.origin}/logo.png`);
    const logoW = 65;
    const logoH = 32;
    const logoX = margin + 1;
    doc.addImage(logoData, 'PNG', logoX, headerTop + 1, logoW, logoH);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('NEWTON SCIENTIFIC CO.', margin + leftColW / 2, headerTop + 18, { align: 'center' });
  }

  // Description below logo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const descCx = margin + leftColW / 2;
  doc.text('We Supply a Wide Range of Scientific & Textile Laboratory Instruments,', descCx, headerTop + 38, { align: 'center' });
  doc.text('Apparatus, Chemicals, Glassware and Laboratory Accessories.', descCx, headerTop + 43, { align: 'center' });

  // Diagonal separator (two thin lines)
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(divX1, headerTop - 2, divX1 + 4, headerTop + headerH + 2);
  doc.line(divX1 + 4, headerTop - 2, divX1 + 8, headerTop + headerH + 2);

  // Right column — contact info
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let ry = headerTop + 7;
  doc.text('Address: 32/1. Hatkhola road, Suveccha Plaza Tikatuli,', rightColX, ry);
  ry += 5;
  doc.text('Dhaka-1203(Opposite of Ovishar Cinema Hall)', rightColX, ry);
  ry += 8;
  doc.text('Phone: +88 01815-491313, +88 01766426553', rightColX, ry);
  ry += 5;
  doc.text('Email: newtonscientificco@gmail.com', rightColX, ry);
  ry += 5;
  doc.text('Website: newtonscientificbd.com', rightColX, ry);
  ry += 8;
  doc.text('VAT No.- 000322409-0307', rightColX, ry);
  ry += 5;
  doc.text('TIN No.- 211754216587', rightColX, ry);

  // Header bottom separator line
  let y = headerTop + headerH + 2;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Ref + Date row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Ref:', margin, y);

  const dateStr = bill.date || new Date().toLocaleDateString('en-GB');
  doc.text(`Date: ${dateStr}`, pageWidth - margin, y, { align: 'right' });
  y += 3;

  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── BILL title ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const billLabel = 'BILL';
  const billW = doc.getTextWidth(billLabel);
  const billX = pageWidth / 2;
  doc.text(billLabel, billX, y, { align: 'center' });
  doc.setLineWidth(0.4);
  doc.line(billX - billW / 2, y + 1.2, billX + billW / 2, y + 1.2);
  y += 9;

  // Bill No / Ch No
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Bill No: ${bill.billNo}`, margin, y);
  y += 5.5;
  doc.text(`Ch No: ${bill.chNo}`, margin, y);
  y += 8;

  // Customer info
  doc.setFontSize(9.5);
  doc.text(bill.companyName, margin, y);
  y += 5.5;
  doc.text(bill.address, margin, y);
  y += 5.5;
  if (bill.phone) {
    doc.text(`Phone: ${bill.phone}`, margin, y);
    y += 5.5;
  }
  y += 2;

  // ── Items Table ──────────────────────────────────────────────────────────────
  const tableBody = bill.items.map((item, i) => [
    String(i + 1).padStart(2, '0'),
    item.item,
    item.origin,
    legacyUnitQtyDisplay(item),
    Number(item.unitPrice).toFixed(2),
    legacyTotalQtyDisplay(item),
    Number(item.totalPrice).toFixed(2),
  ]);

  // Append Delivery Charge + Total Amount rows
  tableBody.push([
    { content: 'Delivery Charge:', colSpan: 6, styles: { halign: 'right' as const, fontStyle: 'bold' as const } } as unknown as string,
    Number(bill.deliveryCharge).toFixed(2),
  ]);
  tableBody.push([
    { content: 'Total Amount:', colSpan: 6, styles: { halign: 'right' as const, fontStyle: 'bold' as const } } as unknown as string,
    { content: Number(bill.grandTotal).toFixed(2), styles: { fontStyle: 'bold' as const } } as unknown as string,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['SL', 'Item', 'Origin', 'Unit\nQTY', 'Unit Price', 'Total\nQTY', 'Total Price']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 8.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 52 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 24 },
    },
    margin: { left: margin, right: margin },
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Amount in Words ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const inWordText = `In Word: ${bill.amountInWords}. = ${Number(bill.grandTotal).toLocaleString()}/-`;
  doc.text(inWordText, margin, y);
  y += 30;

  // ── Authorized Signature ─────────────────────────────────────────────────────
  const sigX = pageWidth - margin - 48;
  doc.setLineWidth(0.4);
  doc.line(sigX, y, pageWidth - margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Authorized Signature', sigX, y);

  doc.save(`bill-${bill.billNo}.pdf`);
}
