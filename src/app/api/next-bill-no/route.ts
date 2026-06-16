import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Counter from '@/models/Counter';
import { getSession } from '@/lib/auth';

const BILL_START = 10001;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const counter = await Counter.findById('billNo');

    let nextBillNo: number;
    if (!counter || !counter.seq || counter.seq < BILL_START) {
      nextBillNo = BILL_START;
    } else {
      nextBillNo = counter.seq + 1;
    }

    return NextResponse.json({ success: true, nextBillNo });
  } catch (error) {
    console.error('GET /api/next-bill-no error:', error);
    return NextResponse.json({ error: 'Failed to get next bill number' }, { status: 500 });
  }
}
