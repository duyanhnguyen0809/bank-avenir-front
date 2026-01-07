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
import { Plus, DollarSign, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { LoanStatus, LoanRequestStatus } from '@/lib/types';

export default function LoansPage() {
  const { user } = useAuthStore();

  // Fetch granted loans
  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: () => loansApi.getUserLoans(user!.id),
    enabled: !!user?.id,
  });

  // Fetch loan requests
  const { data: loanRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['loanRequests'],
    queryFn: () => loansApi.getMyLoanRequests(),
    enabled: !!user?.id,
  });

  const isLoading = loansLoading || requestsLoading;

  const getStatusBadge = (status: LoanStatus | LoanRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
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
  const pendingRequests = loanRequests?.filter(r => r.status === 'PENDING' || r.status === 'ASSIGNED').length || 0;
  const totalRequests = loanRequests?.length || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Loans</h1>
          <p className="text-sm md:text-base text-gray-500">Manage your loans and apply for new ones</p>
        </div>
        <Link href="/loans/apply">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Apply for Loan
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <span className="text-xs md:text-sm text-gray-500">Total Debt</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(totalDebt, 'EUR')}</div>
            <p className="text-xs text-gray-500">{activeLoans.length} active loan(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <span className="text-xs md:text-sm text-gray-500">Monthly</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(monthlyPayments, 'EUR')}</div>
            <p className="text-xs text-gray-500">Due monthly</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              <span className="text-xs md:text-sm text-gray-500">Active</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{activeLoans.length}</div>
            <p className="text-xs text-gray-500">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              <span className="text-xs md:text-sm text-gray-500">Pending</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-gray-500">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Requests Table */}
      {totalRequests > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Loan Requests
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Your loan applications and their status</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Request ID</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Duration</TableHead>
                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Purpose</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanRequests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-xs">
                        {request.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatCurrency(Number(request.requestedAmount), 'EUR')}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {request.termMonths} months
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-50 truncate">
                        {request.purpose}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right text-gray-500 hidden lg:table-cell">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Loans Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Active Loans
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Your granted and active loans</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading loans...</div>
          ) : loans && loans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Loan ID</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Interest Rate</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Duration</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden sm:table-cell">Monthly</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap hidden lg:table-cell">Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono text-xs">
                        {loan.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatCurrency(loan.amount, 'EUR')}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {(loan.interestRate * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {loan.durationMonths} months
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell whitespace-nowrap">
                        {formatCurrency(loan.monthlyPayment, 'EUR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(loan.status)}</TableCell>
                      <TableCell className="text-right text-gray-500 hidden lg:table-cell">
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
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No active loans</p>
              <p className="text-sm mt-1">Your approved loans will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
