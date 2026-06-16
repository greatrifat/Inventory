export interface InvoiceItem {
  item: string;
  origin: string;
  unit: string;
  unitQty: number;
  unitPrice: number;
  totalQty: number;
  totalPrice: number;
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
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
