import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Counter from '@/models/Counter';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Peek at the next bill number without incrementing
    const counter = await Counter.findById('billNo');
    const nextBillNo = counter ? counter.seq + 1 : 10001;

    return NextResponse.json({ success: true, nextBillNo });
  } catch (error) {
    console.error('GET /api/next-bill-no error:', error);
    return NextResponse.json({ error: 'Failed to get next bill number' }, { status: 500 });
  }
}
