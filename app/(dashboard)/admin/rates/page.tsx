'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Percent,
  Plus,
  ArrowLeft,
  Bell,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

interface SavingsRate {
  id: string;
  accountType: string;
  rate: number;
  minBalance: number;
  effectiveDate: string;
}

export default function AdminRatesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState({
    accountType: 'SAVINGS' as 'CHECKING' | 'SAVINGS' | 'INVESTMENT',
    rate: 0,
    minBalance: 0,
    effectiveDate: new Date().toISOString().split('T')[0],  // Default to today
  });

  // Redirect non-admin users
  if (user && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { data: rates, isLoading } = useQuery({
    queryKey: ['savingsRates'],
    queryFn: () => adminApi.getSavingsRates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newRate) => adminApi.createSavingsRate({
      ...data,
      rate: data.rate / 100,  // Convert percentage to decimal (e.g., 3.5% -> 0.035)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsRates'] });
      toast.success('Savings rate updated! All affected account holders will be notified.');
      setIsCreateDialogOpen(false);
      setNewRate({
        accountType: 'SAVINGS',
        rate: 0,
        minBalance: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update savings rate');
    },
  });

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'SAVINGS':
        return <Badge className="bg-green-100 text-green-800">Savings</Badge>;
      case 'CHECKING':
        return <Badge className="bg-blue-100 text-blue-800">Checking</Badge>;
      case 'INVESTMENT':
        return <Badge className="bg-purple-100 text-purple-800">Investment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Savings Rates Management</h1>
          <p className="text-gray-500">Update interest rates for different account types</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Update Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Savings Rate</DialogTitle>
              <DialogDescription>
                Set a new interest rate. All account holders of this type will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  value={newRate.accountType}
                  onValueChange={(value: 'CHECKING' | 'SAVINGS' | 'INVESTMENT') =>
                    setNewRate({ ...newRate, accountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="CHECKING">Checking</SelectItem>
                    <SelectItem value="INVESTMENT">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Interest Rate (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  placeholder="2.5"
                  value={newRate.rate || ''}
                  onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500">Enter as percentage (e.g., 2.5 for 2.5%)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minBalance">Minimum Balance (€)</Label>
                <Input
                  id="minBalance"
                  type="number"
                  step="100"
                  placeholder="1000"
                  value={newRate.minBalance || ''}
                  onChange={(e) => setNewRate({ ...newRate, minBalance: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500">Minimum balance required to earn this rate</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={newRate.effectiveDate}
                  onChange={(e) => setNewRate({ ...newRate, effectiveDate: e.target.value })}
                />
                <p className="text-xs text-gray-500">Date when the new rate takes effect</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <Bell className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">
                All customers with {newRate.accountType.toLowerCase()} accounts will receive a notification
                about this rate change.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newRate)}
                disabled={!newRate.rate}
              >
                Update Rate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['SAVINGS', 'CHECKING', 'INVESTMENT'].map((type) => {
          const latestRate = rates?.find((r: SavingsRate) => r.accountType === type);
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {type.charAt(0) + type.slice(1).toLowerCase()} Rate
                </CardTitle>
                <Percent className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {latestRate ? `${(latestRate.rate * 100).toFixed(2)}%` : '0.00%'}
                </div>
                {latestRate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Min. balance: {formatCurrency(latestRate.minBalance, 'EUR')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rates History */}
      <Card>
        <CardHeader>
          <CardTitle>Rate History</CardTitle>
          <CardDescription>Last 10 rate changes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading rates...</div>
          ) : rates && rates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Min. Balance</TableHead>
                  <TableHead>Effective Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate: SavingsRate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{getAccountTypeBadge(rate.accountType)}</TableCell>
                    <TableCell className="font-bold">{(rate.rate * 100).toFixed(2)}%</TableCell>
                    <TableCell>{formatCurrency(rate.minBalance, 'EUR')}</TableCell>
                    <TableCell>{formatDate(rate.effectiveDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">No rate history found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
