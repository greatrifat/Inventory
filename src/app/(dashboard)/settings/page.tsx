'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, FlaskConical, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const COMPANY_INFO = [
  { icon: Building2, label: 'Company Name', value: 'Newton Scientific Co.' },
  { icon: MapPin, label: 'Address', value: '32/1. Hatkhola road, Suveccha Plaza Tikatuli, Dhaka-1203' },
  { icon: Phone, label: 'Phone', value: '+88 01815-491313, +88 01766426553' },
  { icon: Mail, label: 'Email', value: 'newtonscientificco@gmail.com' },
  { icon: Building2, label: 'VAT No.', value: '000322409-0307' },
  { icon: Building2, label: 'TIN No.', value: '211754216587' },
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      if (data.currentPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        // Just simulate — in a real app, verify server-side
        toast.info('Password change would be handled server-side. Update your .env.local file.');
      } else {
        toast.success('Password update requested. Update ADMIN_PASSWORD in .env.local');
      }
      reset();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your billing system settings</p>
      </div>

      {/* Company Information */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <FlaskConical className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Company Information</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Fixed details used on all generated invoices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {COMPANY_INFO.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-sm text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Admin Account */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Admin Account</CardTitle>
          <CardDescription className="text-xs">
            Credentials are stored in <code className="bg-gray-100 px-1 rounded">.env.local</code> on the server.
            To change your password, update the <code className="bg-gray-100 px-1 rounded">ADMIN_PASSWORD</code> value and restart the server.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                {...register('currentPassword')}
                className={errors.currentPassword ? 'border-red-400' : ''}
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="At least 6 characters"
                {...register('newPassword')}
                className={errors.newPassword ? 'border-red-400' : ''}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-500">{errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-400' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="shadow-sm bg-gray-50">
        <CardContent className="pt-5 pb-5 space-y-2 text-xs text-gray-500">
          <p>🔧 <strong>Stack:</strong> Next.js 15 · TypeScript · MongoDB · TailwindCSS · Shadcn UI</p>
          <p>📦 <strong>PDF:</strong> jsPDF + jsPDF-AutoTable</p>
          <p>🔐 <strong>Auth:</strong> JWT via jose · httpOnly cookies · 24h expiry</p>
          <p>📄 <strong>Bill numbering:</strong> Auto-increment starting from 10001</p>
        </CardContent>
      </Card>
    </div>
  );
}
