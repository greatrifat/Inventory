import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBillItem {
  item: string;
  origin: string;
  unit: string;
  unitQty: number;
  unitPrice: number;
  totalQty: number;
  totalUnit: string;
  totalPrice: number;
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
  unit: { type: String, default: 'PCS' },
  unitQty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalQty: { type: Number, required: true },
  totalUnit: { type: String, default: 'PCS' },
  totalPrice: { type: Number, required: true },
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

const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;
