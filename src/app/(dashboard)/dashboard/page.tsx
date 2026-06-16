'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, FilePlus2, TrendingUp, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalBills: number;
  totalRevenue: number;
  todayBills: number;
  recentBills: Array<{
    _id: string;
    billNo: number;
    companyName: string;
    grandTotal: number;
    date: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/bills?limit=5&page=1');
        const data = await res.json();
        if (data.success) {
          const totalRevenue = data.data.reduce(
            (sum: number, b: { grandTotal: number }) => sum + b.grandTotal, 0
          );
          const today = new Date().toLocaleDateString('en-GB');
          const todayBills = data.data.filter(
            (b: { date: string }) => b.date === today
          ).length;
          setStats({
            totalBills: data.pagination.total,
            totalRevenue,
            todayBills,
            recentBills: data.data.slice(0, 5),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Bills',
      value: stats?.totalBills ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Total Revenue',
      value: stats?.totalRevenue ?? 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      format: (v: number) => `৳ ${v.toLocaleString()}`,
    },
    {
      title: "Today's Bills",
      value: stats?.todayBills ?? 0,
      icon: Receipt,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      format: (v: number) => v.toLocaleString(),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome to Newton Scientific Co. Billing System
          </p>
        </div>
        <Link href="/create-bill">
          <Button className="gap-2">
            <FilePlus2 className="w-4 h-4" />
            Create Bill
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map(({ title, value, icon: Icon, color, bg, format }) => (
          <Card key={title} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{title}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-24 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mt-1">{format(value)}</p>
                  )}
                </div>
                <div className={`${bg} ${color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bills */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Bills</CardTitle>
          <Link href="/bills">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stats?.recentBills.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No bills created yet.</p>
              <Link href="/create-bill">
                <Button variant="outline" size="sm" className="mt-3">
                  Create your first bill
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {stats?.recentBills.map((bill) => (
                <div key={bill._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bill.companyName}</p>
                    <p className="text-xs text-gray-400">Bill #{bill.billNo} · {bill.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    ৳ {bill.grandTotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
