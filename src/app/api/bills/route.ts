import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { getNextSequence } from '@/models/Counter';
import { numberToWords } from '@/utils/numberToWords';
import { getSession } from '@/lib/auth';
import { computeUnitLabels } from '@/utils/unitLabels';

type RawItem = {
  item: string;
  origin: string;
  unitQtyLabel?: string;
  totalQtyLabel?: string;
  unitPrice: number;
  quantity?: number;
  unitType?: string;
  unitSize?: number;
  unit?: string;
  compoundSize?: number;
  sizeUnit?: string;
  container?: string;
  // Legacy
  unitQty?: number;
  totalQty?: number;
  totalUnit?: string;
};

function processItems(items: RawItem[]) {
  return items.map((item) => {
    const qty = Number(item.quantity ?? item.totalQty) || 0;
    const price = Number(item.unitPrice) || 0;

    const labels =
      item.unitQtyLabel
        ? { unitQtyLabel: item.unitQtyLabel, totalQtyLabel: item.totalQtyLabel || '' }
        : computeUnitLabels({
            unitType: item.unitType || 'simple',
            unitSize: item.unitSize ?? item.unitQty ?? 1,
            unit: item.unit || 'PCS',
            compoundSize: item.compoundSize ?? 1,
            sizeUnit: item.sizeUnit || 'ml',
            container: item.container || 'Bottle',
            quantity: qty,
          });

    return {
      item: item.item,
      origin: item.origin,
      unitQtyLabel: labels.unitQtyLabel,
      totalQtyLabel: labels.totalQtyLabel,
      unitPrice: price,
      quantity: qty,
      totalPrice: qty * price,
      unitType: item.unitType || 'simple',
      unitSize: Number(item.unitSize ?? item.unitQty) || 1,
      unit: item.unit || 'PCS',
      compoundSize: Number(item.compoundSize) || 1,
      sizeUnit: item.sizeUnit || 'ml',
      container: item.container || 'Bottle',
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const { customerName, companyName, address, phone, items, deliveryCharge, date } = body;

    if (!customerName || !companyName || !address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const billNo = await getNextSequence('billNo');
    const chNo = String(billNo - 10000).padStart(4, '0');
    const processedItems = processItems(items);
    const subtotal = processedItems.reduce((s, i) => s + i.totalPrice, 0);
    const charge = Number(deliveryCharge) || 0;
    const grandTotal = subtotal + charge;

    const bill = await Bill.create({
      billNo,
      chNo,
      date: date || new Date().toLocaleDateString('en-GB'),
      customerName,
      companyName,
      address,
      phone: phone || '',
      items: processedItems,
      deliveryCharge: charge,
      subtotal,
      grandTotal,
      amountInWords: numberToWords(grandTotal),
    });

    return NextResponse.json({ success: true, data: bill.toObject() }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bills error:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (search) {
      const billNoSearch = parseInt(search);
      query.$or = [
        ...(!isNaN(billNoSearch) ? [{ billNo: billNoSearch }] : []),
        { customerName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('billNo chNo customerName companyName items grandTotal createdAt date')
      .lean();

    return NextResponse.json({
      success: true,
      data: bills.map((b) => ({
        _id: b._id,
        billNo: b.billNo,
        chNo: b.chNo,
        customerName: b.customerName,
        companyName: b.companyName,
        totalItems: (b.items as unknown[]).length,
        grandTotal: b.grandTotal,
        date: b.date,
        createdAt: b.createdAt,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/bills error:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}
