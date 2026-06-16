import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { getSession } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });
    }

    const bill = await Bill.findById(id).lean();
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    console.error('GET /api/bills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });
    }

    const bill = await Bill.findByIdAndDelete(id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/bills/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
