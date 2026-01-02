'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { loansApi } from '@/lib/api/loans';
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
import { Plus, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { LoanStatus } from '@/lib/types';

export default function LoansPage() {
  const { user } = useAuthStore();

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: () => loansApi.getUserLoans(user!.id),
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'DEFAULTED':
        return <Badge className="bg-red-100 text-red-800">Defaulted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Calculate totals
  const activeLoans = loans?.filter(l => l.status === 'ACTIVE') || [];
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.amount, 0);
  const monthlyPayments = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const pendingLoans = loans?.filter(l => l.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loans</h1>
          <p className="text-gray-500">Manage your loans and apply for new ones</p>
        </div>
        <Link href="/loans/apply">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Apply for Loan
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Total Debt</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalDebt, 'EUR')}</div>
            <p className="text-xs text-gray-500">{activeLoans.length} active loan(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Monthly Payments</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(monthlyPayments, 'EUR')}</div>
            <p className="text-xs text-gray-500">Due monthly</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-500">Active Loans</span>
            </div>
            <div className="text-2xl font-bold">{activeLoans.length}</div>
            <p className="text-xs text-gray-500">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-500">Pending Applications</span>
            </div>
            <div className="text-2xl font-bold">{pendingLoans}</div>
            <p className="text-xs text-gray-500">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Loans</CardTitle>
          <CardDescription>View all your loan applications and active loans</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading loans...</div>
          ) : loans && loans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Interest Rate</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Monthly Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-mono text-xs">
                      {loan.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(loan.amount, 'EUR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {(loan.interestRate * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {loan.durationMonths} months
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.monthlyPayment, 'EUR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell className="text-right text-gray-500">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No loans yet</p>
              <p className="text-sm mt-1">Apply for your first loan to get started</p>
              <Link href="/loans/apply">
                <Button className="mt-4">Apply for Loan</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
