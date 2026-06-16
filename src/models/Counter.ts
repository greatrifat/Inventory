import mongoose, { Schema, Model } from 'mongoose';

interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number },
});

const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

const BILL_START = 10001;

export async function getNextSequence(name: string): Promise<number> {
  // Aggregation pipeline update: atomic, handles first-time creation correctly.
  // If seq is missing or below BILL_START (e.g. corrupted), resets to BILL_START.
  // Otherwise increments normally.
  const counter = await Counter.findByIdAndUpdate(
    name,
    [
      {
        $set: {
          seq: {
            $cond: {
              if: { $gte: [{ $ifNull: ['$seq', 0] }, BILL_START] },
              then: { $add: ['$seq', 1] },
              else: BILL_START,
            },
          },
        },
      },
    ],
    { new: true, upsert: true }
  );
  return counter!.seq;
}

export default Counter;
