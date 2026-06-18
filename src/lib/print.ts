import { Bill } from '@/types';
import { legacyUnitQtyDisplay, legacyTotalQtyDisplay } from '@/utils/unitLabels';

function companyHeader(): string {
  const logoUrl = `${window.location.origin}/logo.png`;
  return `
    <div style="display:flex;align-items:stretch;border-top:1px solid #999;border-bottom:1px solid #999;margin-bottom:10px;min-height:140px;">
      <div style="flex:0 0 46%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 10px 10px 2px;">
        <img src="${logoUrl}" style="height:100px;width:auto;" alt="Newton Scientific Co." />
        <p style="margin:6px 0 0;font-size:10px;text-align:center;color:#222;line-height:1.5;font-weight:500;">
          We Supply a Wide Range of Scientific &amp; Textile<br>
          Laboratory Instruments, Apparatus, Chemicals,<br>
          Glassware and Laboratory Accessories.
        </p>
      </div>
      <div style="position:relative;flex:0 0 28px;overflow:visible;">
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;" preserveAspectRatio="none" viewBox="0 0 28 140">
          <line x1="8" y1="0" x2="18" y2="140" stroke="#999" stroke-width="1"/>
          <line x1="15" y1="0" x2="25" y2="140" stroke="#999" stroke-width="1"/>
        </svg>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:10px 8px 10px 14px;">
        <p style="margin:0 0 3px;font-size:11px;color:#111;font-weight:500;">Address: 32/1. Hatkhola road, Suveccha Plaza Tikatuli,</p>
        <p style="margin:0 0 9px;font-size:11px;color:#111;font-weight:500;">Dhaka-1203(Opposite of Ovishar Cinema Hall)</p>
        <p style="margin:0 0 3px;font-size:11px;color:#111;font-weight:500;">Phone: +88 01815-491313, +88 01766426553</p>
        <p style="margin:0 0 3px;font-size:11px;color:#111;font-weight:500;">Email: <span style="color:#1a5fb4;">newtonscientificco@gmail.com</span></p>
        <p style="margin:0 0 9px;font-size:11px;color:#111;font-weight:500;">Website: <span style="color:#1a5fb4;">newtonscientificbd.com</span></p>
        <p style="margin:0 0 3px;font-size:11px;color:#111;font-weight:500;">VAT No.- 000322409-0307</p>
        <p style="margin:0;font-size:11px;color:#111;font-weight:500;">TIN No.- 211754216587</p>
      </div>
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
      <td style="text-align:center;">${legacyUnitQtyDisplay(item)}</td>
      <td style="text-align:right;">${Number(item.unitPrice).toFixed(2)}</td>
      <td style="text-align:center;">${legacyTotalQtyDisplay(item)}</td>
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
      <td style="text-align:center;">${legacyTotalQtyDisplay(item)}</td>
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
