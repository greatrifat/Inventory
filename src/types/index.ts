export interface InvoiceItem {
  item: string;
  origin: string;
  // Display strings (printed on bill)
  unitQtyLabel: string;
  totalQtyLabel: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  // Form reconstruction fields (for edit page)
  unitType?: string;
  unitSize?: number;
  unit?: string;
  compoundSize?: number;
  sizeUnit?: string;
  container?: string;
  // Legacy fields (backward compat with old bills)
  unitQty?: number;
  totalQty?: number;
  totalUnit?: string;
}

export interface Bill {
  _id?: string;
  billNo: number;
  chNo: string;
  date: string;
  customerName: string;
  companyName: string;
  address: string;
  phone: string;
  items: InvoiceItem[];
  deliveryCharge: number;
  subtotal: number;
  grandTotal: number;
  amountInWords: string;
  createdAt?: string | Date;
}

export interface BillListItem {
  _id: string;
  billNo: number;
  chNo: string;
  customerName: string;
  companyName: string;
  totalItems: number;
  grandTotal: number;
  date: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
