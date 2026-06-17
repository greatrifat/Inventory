import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { getSession } from '@/lib/auth';
import { numberToWords } from '@/utils/numberToWords';
import mongoose from 'mongoose';

type RawItem = {
  item: string;
  origin: string;
  unit: string;
  unitQty: number;
  unitPrice: number;
  totalQty: number;
  totalUnit: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });

    const bill = await Bill.findById(id).lean();
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    console.error('GET /api/bills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });

    const body = await request.json();
    const { customerName, companyName, address, phone, items, deliveryCharge, date } = body;

    if (!customerName || !companyName || !address || !items?.length)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const processedItems = (items as RawItem[]).map((item) => ({
      ...item,
      totalQty: Number(item.totalQty) || 0,
      totalUnit: item.totalUnit || item.unit || 'PCS',
      totalPrice: (Number(item.totalQty) || 0) * (Number(item.unitPrice) || 0),
    }));

    const subtotal = processedItems.reduce((s, i) => s + i.totalPrice, 0);
    const charge = Number(deliveryCharge) || 0;
    const grandTotal = subtotal + charge;

    const bill = await Bill.findByIdAndUpdate(
      id,
      {
        customerName,
        companyName,
        address,
        phone: phone || '',
        date: date || new Date().toLocaleDateString('en-GB'),
        items: processedItems,
        deliveryCharge: charge,
        subtotal,
        grandTotal,
        amountInWords: numberToWords(grandTotal),
      },
      { new: true }
    );

    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: bill.toObject() });
  } catch (error) {
    console.error('PUT /api/bills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });

    const bill = await Bill.findByIdAndDelete(id);
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/bills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
