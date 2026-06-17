'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Loader2, FileText, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { numberToWords } from '@/utils/numberToWords';
import { printBill, printChallan } from '@/lib/print';
import { Bill } from '@/types';
import { computeUnitLabels } from '@/utils/unitLabels';

const SIMPLE_UNITS = ['PCS', 'Pair', 'Box', 'Set', 'Roll', 'Meter', 'Kg', 'L', 'Gram', 'Dozen', 'Feet', 'Yard'];
const SIZE_UNITS = ['ml', 'g', 'L', 'Kg', 'mg', 'oz'];
const CONTAINERS = ['Bottle', 'Jar', 'Pack', 'Can', 'Bag', 'Carton', 'Drum'];

const itemSchema = z.object({
  item: z.string().min(1, 'Required'),
  origin: z.string().min(1, 'Required'),
  unitType: z.enum(['simple', 'compound']).default('simple'),
  unitSize: z.coerce.number().min(0).default(1),
  unit: z.string().default('PCS'),
  compoundSize: z.coerce.number().min(0).default(1),
  sizeUnit: z.string().default('ml'),
  container: z.string().default('Bottle'),
  quantity: z.coerce.number().min(0).default(1),
  unitPrice: z.coerce.number().min(0).default(0),
  totalPrice: z.coerce.number().default(0),
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
type ItemFormData = z.infer<typeof itemSchema>;

const defaultItem: ItemFormData = {
  item: '', origin: '',
  unitType: 'simple', unitSize: 1, unit: 'PCS',
  compoundSize: 1, sizeUnit: 'ml', container: 'Bottle',
  quantity: 1, unitPrice: 0, totalPrice: 0,
};

const SELECT_CLS =
  'h-7 rounded-md border border-input bg-background px-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring';

export default function CreateBillPage() {
  const [nextBillNo, setNextBillNo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedBill, setSavedBill] = useState<Bill | null>(null);
  const today = new Date().toLocaleDateString('en-GB');

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<BillFormData>({
      resolver: zodResolver(billSchema),
      defaultValues: {
        customerName: '', companyName: '', address: '', phone: '',
        items: [{ ...defaultItem }], deliveryCharge: 0,
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = useWatch({ control, name: 'items' });
  const watchDelivery = useWatch({ control, name: 'deliveryCharge' });

  useEffect(() => {
    watchItems?.forEach((item, index) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      setValue(`items.${index}.totalPrice`, qty * price);
    });
  }, [watchItems, setValue]);

  const subtotal = watchItems?.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0
  ) ?? 0;
  const deliveryCharge = Number(watchDelivery) || 0;
  const grandTotal = subtotal + deliveryCharge;

  const fetchNextBillNo = useCallback(async () => {
    try {
      const res = await fetch('/api/next-bill-no');
      const data = await res.json();
      if (data.success) setNextBillNo(data.nextBillNo);
    } catch { setNextBillNo(10001); }
  }, []);

  useEffect(() => { fetchNextBillNo(); }, [fetchNextBillNo]);

  const onSubmit = async (formData: BillFormData) => {
    setIsSubmitting(true);
    try {
      const items = formData.items.map((item) => {
        const labels = computeUnitLabels(item);
        return {
          item: item.item,
          origin: item.origin,
          unitQtyLabel: labels.unitQtyLabel,
          totalQtyLabel: labels.totalQtyLabel,
          unitType: item.unitType,
          unitSize: Number(item.unitSize),
          unit: item.unit,
          compoundSize: Number(item.compoundSize),
          sizeUnit: item.sizeUnit,
          container: item.container,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.quantity) * Number(item.unitPrice),
        };
      });

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          companyName: formData.companyName,
          address: formData.address,
          phone: formData.phone,
          deliveryCharge: formData.deliveryCharge,
          items,
          date: today,
        }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || 'Failed to create bill'); return; }
      toast.success(`Bill #${result.data.billNo} created!`);
      setSavedBill(result.data as Bill);
    } catch { toast.error('Something went wrong'); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateAnother = () => {
    setSavedBill(null);
    reset({
      customerName: '', companyName: '', address: '', phone: '',
      items: [{ ...defaultItem }], deliveryCharge: 0,
    });
    setNextBillNo(null);
    fetchNextBillNo();
  };

  // ── Success / Print screen ────────────────────────────────────────────────
  if (savedBill) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill Generated</h1>
          <p className="text-sm text-gray-500 mt-1">Choose what to print</p>
        </div>

        <Card className="shadow-sm border-green-200 bg-green-50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-800 text-base">
                  Bill #{savedBill.billNo} · Ch No {savedBill.chNo}
                </p>
                <p className="text-xs text-green-600">{savedBill.companyName} · {savedBill.date}</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-1.5 text-sm">
              {savedBill.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600 truncate max-w-[60%]">{item.item}</span>
                  <span className="font-medium text-gray-800">৳ {Number(item.totalPrice).toLocaleString()}</span>
                </div>
              ))}
              {savedBill.deliveryCharge > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Charge</span>
                  <span>৳ {Number(savedBill.deliveryCharge).toLocaleString()}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount</span>
                <span className="text-green-700">৳ {Number(savedBill.grandTotal).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-1">{savedBill.amountInWords}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => printBill(savedBill)}
            className="h-16 flex-col gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700">
            <Printer className="w-5 h-5" /> Print Bill
          </Button>
          <Button onClick={() => printChallan(savedBill)} variant="outline"
            className="h-16 flex-col gap-1.5 text-sm font-semibold border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50">
            <Printer className="w-5 h-5" /> Print Challan
          </Button>
        </div>

        <Button variant="ghost" onClick={handleCreateAnother} className="w-full gap-2 text-gray-500">
          <RotateCcw className="w-4 h-4" /> Create Another Bill
        </Button>
      </div>
    );
  }

  // ── Bill Form ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
                <Input value={nextBillNo ?? 'Loading...'} readOnly className="bg-gray-50 font-semibold cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Ch No</Label>
                <Input value={nextBillNo ? String(nextBillNo - 10000).padStart(4, '0') : '—'} readOnly className="bg-gray-50 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-gray-500">Date</Label>
                <Input value={today} readOnly className="bg-gray-50 cursor-not-allowed" />
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
                <Input id="customerName" placeholder="e.g. Mr. John Doe" {...register('customerName')}
                  className={errors.customerName ? 'border-red-400' : ''} />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                <Input id="companyName" placeholder="e.g. IFL Factory LTD" {...register('companyName')}
                  className={errors.companyName ? 'border-red-400' : ''} />
                {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                <Input id="address" placeholder="e.g. 121, Tak Kathora, Gazipur" {...register('address')}
                  className={errors.address ? 'border-red-400' : ''} />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+88 01XXXXXXXXX" {...register('phone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Invoice Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...defaultItem })}
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
                    <th className="px-2 py-2.5 text-center font-semibold text-gray-600 min-w-[200px]">Unit Setup</th>
                    <th className="px-2 py-2.5 text-right font-semibold text-gray-600 w-16">Qty</th>
                    <th className="px-2 py-2.5 text-right font-semibold text-gray-600 w-24">Unit Price</th>
                    <th className="px-2 py-2.5 text-center font-semibold text-gray-600 w-28">Unit QTY</th>
                    <th className="px-2 py-2.5 text-center font-semibold text-gray-600 w-32">Total QTY</th>
                    <th className="px-2 py-2.5 text-right font-semibold text-gray-600 w-24">Total Price</th>
                    <th className="px-2 py-2.5 w-9"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field, index) => {
                    const item = watchItems?.[index];
                    const unitType = item?.unitType ?? 'simple';
                    const labels = computeUnitLabels(item ?? defaultItem);
                    const totalPrice = (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0);

                    return (
                      <tr key={field.id} className="hover:bg-gray-50/50">
                        <td className="px-2 py-2 text-gray-400 text-xs">{String(index + 1).padStart(2, '0')}</td>

                        {/* Item */}
                        <td className="px-1.5 py-2">
                          <Input placeholder="Item description" {...register(`items.${index}.item`)}
                            className={`h-8 text-sm ${errors.items?.[index]?.item ? 'border-red-400' : ''}`} />
                        </td>

                        {/* Origin */}
                        <td className="px-1.5 py-2">
                          <Input placeholder="e.g. China" {...register(`items.${index}.origin`)}
                            className={`h-8 text-sm ${errors.items?.[index]?.origin ? 'border-red-400' : ''}`} />
                        </td>

                        {/* Unit Setup */}
                        <td className="px-1.5 py-2">
                          <div className="space-y-1.5">
                            {/* Toggle */}
                            <div className="flex rounded border border-gray-300 overflow-hidden w-fit">
                              <button
                                type="button"
                                onClick={() => setValue(`items.${index}.unitType`, 'simple', { shouldDirty: true })}
                                className={`text-[10px] font-medium px-2.5 py-0.5 transition-colors ${
                                  unitType !== 'compound'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                Simple
                              </button>
                              <button
                                type="button"
                                onClick={() => setValue(`items.${index}.unitType`, 'compound', { shouldDirty: true })}
                                className={`text-[10px] font-medium px-2.5 py-0.5 border-l border-gray-300 transition-colors ${
                                  unitType === 'compound'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                Compound
                              </button>
                            </div>

                            {/* Simple: [size] [unit▾] */}
                            {unitType !== 'compound' ? (
                              <div className="flex gap-1">
                                <Input
                                  type="number" min="0" step="any"
                                  {...register(`items.${index}.unitSize`)}
                                  className="h-7 w-14 text-sm text-right px-1"
                                />
                                <select
                                  value={item?.unit ?? 'PCS'}
                                  onChange={(e) => setValue(`items.${index}.unit`, e.target.value, { shouldDirty: true })}
                                  className={`${SELECT_CLS} flex-1 min-w-[60px]`}
                                >
                                  {SIMPLE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                            ) : (
                              /* Compound: [size] [sizeUnit▾] [container▾] */
                              <div className="flex gap-1">
                                <Input
                                  type="number" min="0" step="any"
                                  {...register(`items.${index}.compoundSize`)}
                                  className="h-7 w-14 text-sm text-right px-1"
                                />
                                <select
                                  value={item?.sizeUnit ?? 'ml'}
                                  onChange={(e) => setValue(`items.${index}.sizeUnit`, e.target.value, { shouldDirty: true })}
                                  className={`${SELECT_CLS} w-12`}
                                >
                                  {SIZE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <select
                                  value={item?.container ?? 'Bottle'}
                                  onChange={(e) => setValue(`items.${index}.container`, e.target.value, { shouldDirty: true })}
                                  className={`${SELECT_CLS} flex-1 min-w-[55px]`}
                                >
                                  {CONTAINERS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="px-1.5 py-2">
                          <Input type="number" min="0" step="any"
                            {...register(`items.${index}.quantity`)}
                            className="h-8 text-sm text-right" />
                        </td>

                        {/* Unit Price */}
                        <td className="px-1.5 py-2">
                          <Input type="number" min="0" step="0.01"
                            {...register(`items.${index}.unitPrice`)}
                            className="h-8 text-sm text-right" />
                        </td>

                        {/* Unit QTY (auto) */}
                        <td className="px-2 py-2 text-center">
                          <span className="text-xs bg-gray-100 text-gray-700 font-medium rounded px-1.5 py-0.5 whitespace-nowrap">
                            {labels.unitQtyLabel || '—'}
                          </span>
                        </td>

                        {/* Total QTY (auto) */}
                        <td className="px-2 py-2 text-center">
                          <span className="text-xs bg-blue-50 text-blue-700 font-medium rounded px-1.5 py-0.5 whitespace-nowrap">
                            {labels.totalQtyLabel || '—'}
                          </span>
                        </td>

                        {/* Total Price (auto) */}
                        <td className="px-2 py-2 text-right text-sm font-medium text-gray-800 tabular-nums">
                          {totalPrice.toFixed(2)}
                        </td>

                        {/* Delete */}
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
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-xs text-red-500 px-4 py-2">{errors.items.message}</p>
            )}
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
                <Input id="deliveryCharge" type="number" min="0" step="0.01" placeholder="0.00"
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
              <div className="mt-2 p-3 bg-white rounded-lg border text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-700">In Word: </span>
                {numberToWords(grandTotal)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pb-4">
          <Button type="submit" disabled={isSubmitting || !nextBillNo} className="gap-2 px-8 h-11">
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              : <><FileText className="w-4 h-4" /> Generate Bill</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
