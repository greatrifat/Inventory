const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) {
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + ones[n % 10] : '');
  }
  return (
    ones[Math.floor(n / 100)] +
    ' Hundred' +
    (n % 100 !== 0 ? ' ' + convertChunk(n % 100) : '')
  );
}

export function numberToWords(amount: number): string {
  if (amount === 0) return 'Zero Taka Only';

  const intAmount = Math.floor(amount);
  const parts: string[] = [];

  if (intAmount >= 10000000) {
    const crore = Math.floor(intAmount / 10000000);
    parts.push(convertChunk(crore) + ' Crore');
  }
  if (intAmount >= 100000) {
    const lakh = Math.floor((intAmount % 10000000) / 100000);
    if (lakh > 0) parts.push(convertChunk(lakh) + ' Lakh');
  }
  if (intAmount >= 1000) {
    const thousand = Math.floor((intAmount % 100000) / 1000);
    if (thousand > 0) parts.push(convertChunk(thousand) + ' Thousand');
  }
  const remainder = intAmount % 1000;
  if (remainder > 0) parts.push(convertChunk(remainder));

  return parts.join(' ') + ' Taka Only';
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
