import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBillItem {
  item: string;
  origin: string;
  unitQtyLabel: string;
  totalQtyLabel: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  unitType: string;
  unitSize: number;
  unit: string;
  compoundSize: number;
  sizeUnit: string;
  container: string;
}

export interface IBill extends Document {
  billNo: number;
  chNo: string;
  date: string;
  customerName: string;
  companyName: string;
  address: string;
  phone: string;
  items: IBillItem[];
  deliveryCharge: number;
  subtotal: number;
  grandTotal: number;
  amountInWords: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema = new Schema<IBillItem>({
  item: { type: String, required: true },
  origin: { type: String, required: true },
  unitQtyLabel: { type: String, default: '' },
  totalQtyLabel: { type: String, default: '' },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  unitType: { type: String, default: 'simple' },
  unitSize: { type: Number, default: 1 },
  unit: { type: String, default: 'PCS' },
  compoundSize: { type: Number, default: 1 },
  sizeUnit: { type: String, default: 'ml' },
  container: { type: String, default: 'Bottle' },
});

const BillSchema = new Schema<IBill>(
  {
    billNo: { type: Number, required: true, unique: true },
    chNo: { type: String, required: true },
    date: { type: String, required: true },
    customerName: { type: String, required: true },
    companyName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, default: '' },
    items: { type: [BillItemSchema], required: true },
    deliveryCharge: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, required: true },
  },
  { timestamps: true }
);

BillSchema.index({ billNo: -1 });
BillSchema.index({ customerName: 'text', companyName: 'text' });

// In development, delete the cached model so schema changes take effect on hot reload
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as Record<string, unknown>).Bill;
}

const Bill: Model<IBill> = mongoose.model<IBill>('Bill', BillSchema);

export default Bill;
