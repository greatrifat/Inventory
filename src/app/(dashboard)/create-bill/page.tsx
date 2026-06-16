'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { numberToWords } from '@/utils/numberToWords';
import { generateInvoicePDF } from '@/lib/pdf';
import { Bill } from '@/types';

const itemSchema = z.object({
  item: z.string().min(1, 'Item name is required'),
  origin: z.string().min(1, 'Origin is required'),
  unit: z.string().min(1, 'Unit is required'),
  unitQty: z.coerce.number().min(1, 'Qty must be ≥ 1'),
  unitPrice: z.coerce.number().min(0, 'Price must be ≥ 0'),
  totalQty: z.coerce.number(),
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

const UNITS = ['PCS', 'Box', 'Set', 'Roll', 'Meter', 'Kg', 'Liter', 'Pair', 'Dozen'];

const defaultItem = { item: '', origin: '', unit: 'PCS', unitQty: 1, unitPrice: 0, totalQty: 1, totalPrice: 0 };

export default function CreateBillPage() {
  const [nextBillNo, setNextBillNo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toLocaleDateString('en-GB');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      customerName: '',
      companyName: '',
      address: '',
      phone: '',
      items: [{ ...defaultItem }],
      deliveryCharge: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchItems = useWatch({ control, name: 'items' });
  const watchDelivery = useWatch({ control, name: 'deliveryCharge' });

  // Auto-calculate totals
  useEffect(() => {
    watchItems?.forEach((item, index) => {
      const qty = Number(item.unitQty) || 0;
      const price = Number(item.unitPrice) || 0;
      setValue(`items.${index}.totalQty`, qty);
      setValue(`items.${index}.totalPrice`, qty * price);
    });
  }, [watchItems, setValue]);

  const subtotal = watchItems?.reduce((sum, item) => sum + (Number(item.unitQty) || 0) * (Number(item.unitPrice) || 0), 0) ?? 0;
  const deliveryCharge = Number(watchDelivery) || 0;
  const grandTotal = subtotal + deliveryCharge;
  const amountInWords = numberToWords(grandTotal);

  const fetchNextBillNo = useCallback(async () => {
    try {
      const res = await fetch('/api/next-bill-no');
      const data = await res.json();
      if (data.success) setNextBillNo(data.nextBillNo);
    } catch {
      setNextBillNo(10001);
    }
  }, []);

  useEffect(() => {
    fetchNextBillNo();
  }, [fetchNextBillNo]);

  const onSubmit = async (formData: BillFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: today,
          deliveryCharge: formData.deliveryCharge ?? 0,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to create bill');
        return;
      }

      toast.success(`Bill #${result.data.billNo} created successfully!`);

      const billData: Bill = {
        ...result.data,
        _id: result.data._id?.toString(),
        createdAt: result.data.createdAt,
      };

      await generateInvoicePDF(billData);
      toast.success('PDF downloaded!');

      // Reset and refresh bill number
      setNextBillNo(null);
      fetchNextBillNo();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Bill</h1>
        <p className="text-sm text-gray-500 mt-1">Generate a new invoice for Newton Scientific Co.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Bill Meta */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Bill Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Bill No</Label>
                <Input
                  value={nextBillNo ?? 'Loading...'}
                  readOnly
                  className="bg-gray-50 font-semibold text-gray-700 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Ch No</Label>
                <Input
                  value={nextBillNo ? String(nextBillNo - 10000).padStart(4, '0') : '—'}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-gray-500">Date</Label>
                <Input value={today} readOnly className="bg-gray-50 text-gray-700 cursor-not-allowed" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Customer Name <span className="text-red-500">*</span></Label>
                <Input
                  id="customerName"
                  placeholder="e.g. Mr. John Doe"
                  {...register('customerName')}
                  className={errors.customerName ? 'border-red-400' : ''}
                />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Classic Wet & Dry Processing"
                  {...register('companyName')}
                  className={errors.companyName ? 'border-red-400' : ''}
                />
                {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                <Input
                  id="address"
                  placeholder="e.g. Gazipur City"
                  {...register('address')}
                  className={errors.address ? 'border-red-400' : ''}
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +88 01XXXXXXXXX"
                  {...register('phone')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Invoice Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...defaultItem })}
              className="gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <PlusCircle className="w-4 h-4" />
              Add Row
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-8">SL</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 min-w-[180px]">Item</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 min-w-[100px]">Origin</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-20">Unit</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600 w-24">Unit Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600 w-28">Unit Price</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600 w-24">Total Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600 w-28">Total Price</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field, index) => {
                    const qty = Number(watchItems?.[index]?.unitQty) || 0;
                    const price = Number(watchItems?.[index]?.unitPrice) || 0;
                    const totalPrice = qty * price;

                    return (
                      <tr key={field.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-gray-400 text-xs">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            placeholder="Item description"
                            {...register(`items.${index}.item`)}
                            className={`h-8 text-sm ${errors.items?.[index]?.item ? 'border-red-400' : ''}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            placeholder="e.g. China"
                            {...register(`items.${index}.origin`)}
                            className={`h-8 text-sm ${errors.items?.[index]?.origin ? 'border-red-400' : ''}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            {...register(`items.${index}.unit`)}
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            {...register(`items.${index}.unitQty`)}
                            className="h-8 text-sm text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register(`items.${index}.unitPrice`)}
                            className="h-8 text-sm text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-600">
                          {qty}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-gray-800">
                          {totalPrice.toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length === 1}
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-xs text-red-500 px-4 py-2">{errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Delivery Charge + Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Charge */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Delivery Charge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryCharge">Amount (৳)</Label>
                <Input
                  id="deliveryCharge"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register('deliveryCharge')}
                  className="text-right font-medium"
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals Summary */}
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
              <div className="mt-2 p-3 bg-white rounded-lg border text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-700">In Word: </span>
                {amountInWords}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-4">
          <Button
            type="submit"
            disabled={isSubmitting || !nextBillNo}
            className="gap-2 px-8 h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Generate Bill & Download PDF
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
