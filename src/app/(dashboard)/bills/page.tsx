'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface BillListItem {
  _id: string;
  billNo: number;
  chNo: string;
  customerName: string;
  companyName: string;
  totalItems: number;
  grandTotal: number;
  date: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function BillHistoryPage() {
  const router = useRouter();
  const [bills, setBills] = useState<BillListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/bills?${params}`);
      const data = await res.json();
      if (data.success) {
        setBills(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchBills, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchBills, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bills/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Bill deleted successfully');
        setDeleteConfirmOpen(false);
        fetchBills();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bill History</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination ? `${pagination.total} bill${pagination.total !== 1 ? 's' : ''} total` : 'All generated bills'}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-base font-semibold">All Bills</CardTitle>
            <div className="sm:ml-auto relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by bill no or name..."
                value={search}
                onChange={handleSearch}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Bill No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Company</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">Items</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">Grand Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-5 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{search ? 'No bills match your search.' : 'No bills found. Create your first bill!'}</p>
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-blue-600">#{bill.billNo}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{bill.date}</td>
                      <td className="px-4 py-3 text-gray-800 max-w-[140px] truncate">{bill.customerName}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{bill.companyName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">
                          {bill.totalItems}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                        ৳ {bill.grandTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/bills/${bill._id}`)}
                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/bills/${bill._id}/edit`)}
                            className="h-8 w-8 text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDeleteId(bill._id); setDeleteConfirmOpen(true); }}
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  className="gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The bill will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
