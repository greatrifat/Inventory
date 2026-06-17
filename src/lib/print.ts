import { Bill } from '@/types';

function companyHeader(): string {
  const logoUrl = `${window.location.origin}/logo.png`;
  return `
    <div style="text-align:center;padding-bottom:10px;border-bottom:2.5px solid #000;margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px;">
        <img src="${logoUrl}" style="height:52px;width:auto;" alt="Newton Scientific Co." />
        <strong style="font-size:22px;font-weight:900;font-family:Arial,sans-serif;letter-spacing:0.5px;color:#000;">NEWTON SCIENTIFIC CO.</strong>
      </div>
      <p style="margin:2px 0;font-size:10.5px;font-weight:bold;color:#000;">Importer &amp; Supplier of All Kinds of Scientific and Textile Lab Instruments</p>
      <p style="margin:2px 0;font-size:10.5px;color:#000;">Laboratory Chemicals, Pharmaceutical Raw Materials, etc.</p>
      <p style="margin:4px 0;font-size:12px;font-weight:900;color:#000;">32/1. Hatkhola road, Suveccha Plaza Tikatuli, Dhaka-1203</p>
      <p style="margin:2px 0;font-size:10px;color:#000;">Phone: +88 01815-491313, +88 01766426553 &nbsp;&nbsp; Email: newtonscientificco@gmail.com</p>
      <p style="margin:2px 0;font-size:10px;color:#000;">VAT No.- 000322409-0307, TIN No.- 211754216587</p>
    </div>
  `;
}

const BASE_CSS = `
  @page { margin: 12mm 14mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; }
  table { border-collapse: collapse; width: 100%; }
  th { border: 1px solid #000; padding: 4px 5px; font-size: 10px; text-align: center; background: #fff; }
  td { border: 1px solid #000; padding: 3px 5px; font-size: 10.5px; }
`;

function openPrint(title: string, body: string): void {
  const win = window.open('', '_blank', 'width=900,height=720');
  if (!win) {
    alert('Please allow pop-ups to print the document.');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
${body}
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 800);
  };
<\/script>
</body></html>`);
  win.document.close();
}

export function printBill(bill: Bill): void {
  const itemRows = bill.items
    .map(
      (item, i) => `
    <tr>
      <td style="text-align:center;">${String(i + 1).padStart(2, '0')}</td>
      <td>${item.item}</td>
      <td style="text-align:center;">${item.origin}</td>
      <td style="text-align:center;">${item.unitQty} ${item.unit || 'PCS'}</td>
      <td style="text-align:right;">${Number(item.unitPrice).toFixed(2)}</td>
      <td style="text-align:center;">${item.totalQty} ${item.totalUnit || 'PCS'}</td>
      <td style="text-align:right;">${Number(item.totalPrice).toFixed(2)}</td>
    </tr>`
    )
    .join('');

  const body = `
    ${companyHeader()}

    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #aaa;margin-bottom:8px;">
      <span>Ref:</span>
      <span>Date: ${bill.date}</span>
    </div>

    <div style="text-align:center;margin:10px 0;">
      <span style="font-size:14px;font-weight:bold;text-decoration:underline;letter-spacing:2px;">BILL</span>
    </div>

    <div style="margin-bottom:12px;line-height:1.6;">
      <p>Bill No: ${bill.billNo}</p>
      <p>Ch No: ${bill.chNo}</p>
      <p style="margin-top:6px;font-weight:600;">${bill.companyName}</p>
      <p>${bill.address}</p>
      ${bill.phone ? `<p>Phone: ${bill.phone}</p>` : ''}
    </div>

    <table style="margin-bottom:0;">
      <thead>
        <tr>
          <th style="width:28px;">SL</th>
          <th>Item</th>
          <th style="width:65px;">Origin</th>
          <th style="width:55px;">Unit<br>QTY</th>
          <th style="width:68px;">Unit Price</th>
          <th style="width:55px;">Total<br>QTY</th>
          <th style="width:68px;">Total Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td colspan="6" style="text-align:right;font-weight:bold;border:1px solid #000;padding:3px 5px;">Delivery Charge:</td>
          <td style="text-align:right;">${Number(bill.deliveryCharge).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="6" style="text-align:right;font-weight:bold;">Total Amount:</td>
          <td style="text-align:right;font-weight:bold;">${Number(bill.grandTotal).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:12px;font-weight:bold;font-size:11px;">
      In Word: ${bill.amountInWords}. = ${Number(bill.grandTotal).toLocaleString()}/-
    </div>

    <div style="margin-top:48px;display:flex;justify-content:flex-end;">
      <div style="text-align:center;">
        <div style="width:160px;border-top:1px solid #000;padding-top:4px;font-size:10px;">Authorized Signature</div>
      </div>
    </div>
  `;

  openPrint(`Bill #${bill.billNo} — Newton Scientific Co.`, body);
}

export function printChallan(bill: Bill): void {
  const itemRows = bill.items
    .map(
      (item, i) => `
    <tr>
      <td style="text-align:center;">${String(i + 1).padStart(2, '0')}</td>
      <td>${item.item}</td>
      <td style="text-align:center;">${item.origin}</td>
      <td style="text-align:center;">${item.totalQty} ${item.totalUnit || 'PCS'}</td>
    </tr>`
    )
    .join('');

  const body = `
    ${companyHeader()}

    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #aaa;margin-bottom:8px;">
      <span>Ref:</span>
      <span>Date: ${bill.date}</span>
    </div>

    <div style="text-align:center;margin:10px 0;">
      <span style="font-size:14px;font-weight:bold;text-decoration:underline;letter-spacing:2px;">CHALLAN</span>
    </div>

    <div style="margin-bottom:12px;line-height:1.6;">
      <p>Ch No: ${bill.chNo}</p>
      <p style="margin-top:6px;font-weight:600;">${bill.companyName}</p>
      <p>${bill.address}</p>
      ${bill.phone ? `<p>${bill.phone}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:28px;">SL</th>
          <th>Item</th>
          <th style="width:80px;">Origin</th>
          <th style="width:80px;">Total QTY</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  `;

  openPrint(`Challan #${bill.chNo} — Newton Scientific Co.`, body);
}
