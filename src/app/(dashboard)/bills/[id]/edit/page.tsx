'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Loader2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { numberToWords } from '@/utils/numberToWords';
import { Bill } from '@/types';

const UNITS = ['PCS', 'Pcs', 'Box', 'Set', 'Roll', 'Meter', 'Kg', 'Liter', 'Pair', 'Dozen'];

const itemSchema = z.object({
  item: z.string().min(1, 'Required'),
  origin: z.string().min(1, 'Required'),
  unit: z.string().min(1, 'Required'),
  unitQty: z.coerce.number().min(0, 'Required'),
  unitPrice: z.coerce.number().min(0, 'Required'),
  totalQty: z.coerce.number().min(0, 'Required'),
  totalUnit: z.string().min(1, 'Required'),
  totalPrice: z.coerce.number(),
});

const billSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().optional().default(''),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  deliveryCharge: z.coerce.number().min(0).default(0),
});

type BillFormData = z.infer<typeof billSchema>;

export default function EditBillPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<BillFormData>({ resolver: zodResolver(billSchema) });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = useWatch({ control, name: 'items' });
  const watchDelivery = useWatch({ control, name: 'deliveryCharge' });

  // Load bill data
  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bills/${id}`);
        const data = await res.json();
        if (data.success) {
          const b: Bill = data.data;
          setBill(b);
          reset({
            customerName: b.customerName,
            companyName: b.companyName,
            address: b.address,
            phone: b.phone || '',
            items: b.items.map((item) => ({
              item: item.item,
              origin: item.origin,
              unit: item.unit || 'PCS',
              unitQty: item.unitQty,
              unitPrice: item.unitPrice,
              totalQty: item.totalQty,
              totalUnit: item.totalUnit || 'PCS',
              totalPrice: item.totalPrice,
            })),
            deliveryCharge: b.deliveryCharge,
          });
        } else {
          toast.error('Bill not found');
          router.push('/bills');
        }
      } catch {
        toast.error('Failed to load bill');
        router.push('/bills');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id, router, reset]);

  // Auto-calculate Total Price = Unit Price × Total QTY
  useEffect(() => {
    watchItems?.forEach((item, index) => {
      const tQty = Number(item.totalQty) || 0;
      const price = Number(item.unitPrice) || 0;
      setValue(`items.${index}.totalPrice`, tQty * price);
    });
  }, [watchItems, setValue]);

  const subtotal = watchItems?.reduce((sum, item) =>
    sum + (Number(item.totalQty) || 0) * (Number(item.unitPrice) || 0), 0) ?? 0;
  const deliveryCharge = Number(watchDelivery) || 0;
  const grandTotal = subtotal + deliveryCharge;

  const onSubmit = async (formData: BillFormData) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, date: bill?.date }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || 'Failed to update bill'); return; }
      toast.success('Bill updated successfully!');
      router.push(`/bills/${id}`);
    } catch { toast.error('Something went wrong'); }
    finally { setIsSaving(false); }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Bill #{bill?.billNo}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ch No: {bill?.chNo} · {bill?.date}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Customer Name <span className="text-red-500">*</span></Label>
                <Input id="customerName" {...register('customerName')}
                  className={errors.customerName ? 'border-red-400' : ''} />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                <Input id="companyName" {...register('companyName')}
                  className={errors.companyName ? 'border-red-400' : ''} />
                {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                <Input id="address" {...register('address')}
                  className={errors.address ? 'border-red-400' : ''} />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Invoice Items</CardTitle>
            <Button type="button" variant="outline" size="sm"
              onClick={() => append({ item: '', origin: '', unit: 'Kg', unitQty: 1, unitPrice: 0, totalQty: 1, totalUnit: 'PCS', totalPrice: 0 })}
              className="gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50">
              <PlusCircle className="w-4 h-4" /> Add Row
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y">
                  <tr>
                    <th className="px-2 py-2.5 text-left font-semibold text-gray-600 w-7">SL</th>
                    <th className="px-2 py-2.5 text-left font-semibold text-gray-600 min-w-[150px]">Item</th>
                    <th className="px-2 py-2.5 text-left font-semibold text-gray-600 min-w-[80px]">Origin</th>
                    <th className="px-2 py-2.5 text-center font-semibold text-gray-600 w-[72px]">Unit</th>
                    <th className="px-2 py-2.5 text-right font-semibold text-gray-600 w-20">Unit QTY</th>
                    <th className="px-2 py-2.5 text-right font-semibold text-gray-600 w-24">Unit Price</th>
                    <th className="px-2 py-2.5 text-right font-semibold text-gray-600 w-20">Total QTY</th>
                    <th className="px-2 py-2.5 text-center font-semibold text-gray-600 w-[72px]">Total Unit</th>
                    <th className="px-2 py-2.5 text-right font-semibold text-gray-600 w-24">Total Price</th>
                    <th className="px-2 py-2.5 w-9"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field, index) => {
                    const tQty = Number(watchItems?.[index]?.totalQty) || 0;
                    const price = Number(watchItems?.[index]?.unitPrice) || 0;
                    return (
                      <tr key={field.id} className="hover:bg-gray-50/50">
                        <td className="px-2 py-2 text-gray-400 text-xs">{String(index + 1).padStart(2, '0')}</td>
                        <td className="px-1.5 py-2">
                          <Input {...register(`items.${index}.item`)}
                            className={`h-8 text-sm ${errors.items?.[index]?.item ? 'border-red-400' : ''}`} />
                        </td>
                        <td className="px-1.5 py-2">
                          <Input {...register(`items.${index}.origin`)}
                            className={`h-8 text-sm ${errors.items?.[index]?.origin ? 'border-red-400' : ''}`} />
                        </td>
                        <td className="px-1.5 py-2">
                          <select
                            value={watchItems?.[index]?.unit ?? 'PCS'}
                            onChange={(e) => setValue(`items.${index}.unit`, e.target.value, { shouldDirty: true })}
                            className="h-8 w-full rounded-md border border-input bg-background px-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="px-1.5 py-2">
                          <Input type="number" min="0" step="any" {...register(`items.${index}.unitQty`)}
                            className="h-8 text-sm text-right" />
                        </td>
                        <td className="px-1.5 py-2">
                          <Input type="number" min="0" step="0.01" {...register(`items.${index}.unitPrice`)}
                            className="h-8 text-sm text-right" />
                        </td>
                        <td className="px-1.5 py-2">
                          <Input type="number" min="0" step="any" {...register(`items.${index}.totalQty`)}
                            className="h-8 text-sm text-right" />
                        </td>
                        <td className="px-1.5 py-2">
                          <select
                            value={watchItems?.[index]?.totalUnit ?? 'PCS'}
                            onChange={(e) => setValue(`items.${index}.totalUnit`, e.target.value, { shouldDirty: true })}
                            className="h-8 w-full rounded-md border border-input bg-background px-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right text-sm font-medium text-gray-800 tabular-nums">
                          {(tQty * price).toFixed(2)}
                        </td>
                        <td className="px-1.5 py-2">
                          <Button type="button" variant="ghost" size="icon"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length === 1}
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Delivery + Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Delivery Charge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryCharge">Amount (৳)</Label>
                <Input id="deliveryCharge" type="number" min="0" step="0.01"
                  {...register('deliveryCharge')} className="text-right font-medium" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">৳ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Charge</span>
                <span className="font-medium">৳ {deliveryCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Grand Total</span>
                <span className="text-blue-600">৳ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-700">In Word: </span>
                {numberToWords(grandTotal)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="gap-2 px-8 h-11">
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
