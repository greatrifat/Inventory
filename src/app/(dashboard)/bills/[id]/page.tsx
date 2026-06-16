'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Download, Printer, Loader2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { generateInvoicePDF } from '@/lib/pdf';
import { Bill } from '@/types';
import { Separator } from '@/components/ui/separator';

export default function ViewBillPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bills/${id}`);
        const data = await res.json();
        if (data.success) {
          setBill(data.data);
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
  }, [id, router]);

  const handleDownload = async () => {
    if (!bill) return;
    setDownloading(true);
    try {
      await generateInvoicePDF(bill);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Preview — matches the actual Newton Scientific bill layout */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none" id="bill-preview">
        <div className="p-8 print:p-6">
          {/* Company Header */}
          <div className="text-center space-y-1 pb-4 border-b-2 border-gray-800">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-lg">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                NEWTON SCIENTIFIC CO.
              </h1>
            </div>
            <p className="text-xs text-gray-600">
              Importer &amp; Supplier of All Kinds of Scientific and Textile Lab Instruments
            </p>
            <p className="text-xs text-gray-600">
              Laboratory Chemicals, Pharmaceutical Raw Materials, etc.
            </p>
            <p className="text-sm font-bold text-gray-800">
              32/1. Hatkhola road, Suveccha Plaza Tikatuli, Dhaka-1203
            </p>
            <p className="text-xs text-gray-600">
              Phone: +88 01815-491313, +88 01766426553 &nbsp;|&nbsp; Email: newtonscientificco@gmail.com
            </p>
            <p className="text-xs text-gray-600">
              VAT No.- 000322409-0307, TIN No.- 211754216587
            </p>
          </div>

          {/* Ref + Date */}
          <div className="flex justify-between items-center mt-3 pb-2 border-b border-gray-300 text-sm">
            <span className="text-gray-600">Ref:</span>
            <span className="text-gray-700 font-medium">Date: {bill.date}</span>
          </div>

          {/* BILL title */}
          <div className="text-center my-5">
            <span className="text-base font-bold underline underline-offset-4 tracking-widest">BILL</span>
          </div>

          {/* Bill No + Ch No + Customer */}
          <div className="mb-5 space-y-0.5 text-sm">
            <p><span className="font-semibold">Bill No:</span> {bill.billNo}</p>
            <p><span className="font-semibold">Ch No:</span> {bill.chNo}</p>
            <div className="mt-2">
              <p className="font-medium text-gray-800">{bill.companyName}</p>
              <p className="text-gray-600">{bill.address}</p>
              {bill.phone && <p className="text-gray-600">Phone: {bill.phone}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-800 overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold bg-white w-8">SL</th>
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold bg-white">Item</th>
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold bg-white w-20">Origin</th>
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold bg-white w-16">Unit QTY</th>
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold bg-white w-20">Unit Price</th>
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold bg-white w-16">Total QTY</th>
                  <th className="px-2 py-2 text-center font-bold bg-white w-20">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-2 py-1.5 text-center text-gray-600">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="border-r border-gray-300 px-2 py-1.5">{item.item}</td>
                    <td className="border-r border-gray-300 px-2 py-1.5 text-center">{item.origin}</td>
                    <td className="border-r border-gray-300 px-2 py-1.5 text-center">{item.unitQty} {item.unit}</td>
                    <td className="border-r border-gray-300 px-2 py-1.5 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                    <td className="border-r border-gray-300 px-2 py-1.5 text-center">{item.totalQty} {item.unit}</td>
                    <td className="px-2 py-1.5 text-right">{Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Delivery Charge */}
                <tr className="border-b border-gray-300">
                  <td colSpan={6} className="border-r border-gray-300 px-2 py-1.5 text-right font-semibold">
                    Delivery Charge:
                  </td>
                  <td className="px-2 py-1.5 text-right">{Number(bill.deliveryCharge).toFixed(2)}</td>
                </tr>
                {/* Total Amount */}
                <tr>
                  <td colSpan={6} className="border-r border-gray-300 px-2 py-1.5 text-right font-bold">
                    Total Amount:
                  </td>
                  <td className="px-2 py-1.5 text-right font-bold">{Number(bill.grandTotal).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="mt-5 text-sm font-bold text-gray-800">
            In Word: {bill.amountInWords}. = {Number(bill.grandTotal).toLocaleString()}/-
          </div>

          {/* Authorized Signature */}
          <div className="mt-12 flex justify-end">
            <div className="text-center">
              <Separator className="mb-1 w-36" />
              <p className="text-xs text-gray-600">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
