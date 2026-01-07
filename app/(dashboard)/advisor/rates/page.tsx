'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Percent,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface SavingsRate {
  id: string;
  accountType: string;
  rate: number;
  minBalance: number;
  effectiveDate: string;
}

export default function AdvisorRatesPage() {
  const { user } = useAuthStore();

  // Redirect non-manager users
  if (user && user.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  const { data: rates, isLoading } = useQuery({
    queryKey: ['savingsRates'],
    queryFn: () => adminApi.getSavingsRates(),
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
      <div>
        <Link href="/advisor">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">View Savings Rates</h1>
        <p className="text-gray-500">Current interest rates for different account types</p>
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
                  <>
                    <p className="text-xs text-gray-500 mt-1">
                      Min. balance: {formatCurrency(latestRate.minBalance, 'EUR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Effective: {formatDate(latestRate.effectiveDate)}
                    </p>
                  </>
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
          <CardDescription>Historical savings rates (read-only)</CardDescription>
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

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Savings rates are managed by administrators. Contact your admin
            if you need to request a rate change.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
