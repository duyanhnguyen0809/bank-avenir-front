'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { accountsApi } from '@/lib/api/accounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const openAccountSchema = z.object({
  accountType: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT']),
  initialDeposit: z.number().min(100, 'Minimum deposit is €100'),
  name: z.string().min(3, 'Account name must be at least 3 characters').optional(),
  currency: z.string(),
});

type OpenAccountFormData = z.infer<typeof openAccountSchema>;

export default function OpenAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<OpenAccountFormData>({
    resolver: zodResolver(openAccountSchema),
    defaultValues: {
      currency: 'EUR',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: OpenAccountFormData) =>
      accountsApi.openAccount({
        ...data,
        userId: user!.id,
      }),
    onSuccess: (newAccount) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account opened successfully!');
      router.push(`/accounts/${newAccount.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to open account');
    },
  });

  const onSubmit = (data: OpenAccountFormData) => {
    mutation.mutate(data);
  };

  const accountTypes = [
    {
      type: 'CHECKING',
      name: 'Checking Account',
      description: 'For daily transactions and payments',
      icon: CreditCard,
      color: 'from-blue-500 to-blue-600',
      features: ['No fees', 'Debit card', 'Online banking', 'Direct deposits'],
    },
    {
      type: 'SAVINGS',
      name: 'Savings Account',
      description: 'Earn interest on your savings',
      icon: Wallet,
      color: 'from-green-500 to-green-600',
      features: ['Competitive rates', 'Interest earnings', 'Limited withdrawals', 'FDIC insured'],
    },
    {
      type: 'INVESTMENT',
      name: 'Investment Account',
      description: 'Trade securities and build wealth',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      features: ['Stock trading', 'Portfolio management', 'Real-time quotes', 'Low commissions'],
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/accounts">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Accounts
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Open New Account</h1>
        <p className="text-gray-500">Choose an account type and provide details</p>
      </div>

      {/* Account Type Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Select Account Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accountTypes.map((accountType) => {
            const Icon = accountType.icon;
            const isSelected = selectedType === accountType.type;

            return (
              <Card
                key={accountType.type}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedType(accountType.type);
                  setValue('accountType', accountType.type as any);
                }}
              >
                <CardHeader className={`bg-linear-to-br ${accountType.color} text-white`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-6 w-6" />
                    <CardTitle className="text-white">{accountType.name}</CardTitle>
                  </div>
                  <CardDescription className="text-white/90">
                    {accountType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2 text-sm">
                    {accountType.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {errors.accountType && (
          <p className="text-sm text-red-500 mt-2">{errors.accountType.message}</p>
        )}
      </div>

      {/* Account Details Form */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Provide information for your new account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Checking Account"
                  {...register('name')}
                  disabled={mutation.isPending}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Give your account a memorable name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialDeposit">Initial Deposit (€)</Label>
                <Input
                  id="initialDeposit"
                  type="number"
                  step="0.01"
                  min="100"
                  placeholder="1000.00"
                  {...register('initialDeposit', { valueAsNumber: true })}
                  disabled={mutation.isPending}
                />
                {errors.initialDeposit && (
                  <p className="text-sm text-red-500">{errors.initialDeposit.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum deposit: €100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  defaultValue="EUR"
                  onValueChange={(value) => setValue('currency', value)}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(mutation.error as any)?.response?.data?.message ||
                      'Failed to open account. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={mutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1"
                >
                  {mutation.isPending ? 'Opening Account...' : 'Open Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Your account will be activated immediately after opening</p>
          <p>• You will receive a unique IBAN for your account</p>
          <p>• Funds will be available for use right away</p>
          <p>• You can close or modify your account settings anytime</p>
          <p>• All accounts are FDIC insured up to €250,000</p>
        </CardContent>
      </Card>
    </div>
  );
}
