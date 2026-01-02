'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { ArrowLeft, Calendar, DollarSign, Percent, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { LoanStatus } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

interface LoanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { id } = use(params);

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loansApi.getLoan(id),
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['loanSchedule', id],
    queryFn: () => loansApi.getSchedule(id),
    enabled: !!loan && (loan.status === 'ACTIVE' || loan.status === 'APPROVED'),
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

  // Calculate progress
  const paidInstallments = schedule?.filter(s => s.isPaid).length || 0;
  const totalInstallments = schedule?.length || loan?.durationMonths || 0;
  const progressPercent = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;

  // Calculate totals
  const totalPaid = schedule?.filter(s => s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0) || 0;
  const totalRemaining = schedule?.filter(s => !s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0) || 0;

  if (loanLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading loan details...</div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loan not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/loans">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Loans
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Loan Details</h1>
            <p className="text-gray-500 font-mono">{loan.id}</p>
          </div>
          {getStatusBadge(loan.status)}
        </div>
      </div>

      {/* Loan Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Loan Amount</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(loan.amount, 'EUR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Interest Rate</span>
            </div>
            <div className="text-2xl font-bold">{(loan.interestRate * 100).toFixed(2)}%</div>
            <p className="text-xs text-gray-500">Annual</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Duration</span>
            </div>
            <div className="text-2xl font-bold">{loan.durationMonths} months</div>
            <p className="text-xs text-gray-500">{(loan.durationMonths / 12).toFixed(1)} years</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-blue-600">Monthly Payment</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(loan.monthlyPayment, 'EUR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      {loan.status === 'ACTIVE' && (
        <Card>
          <CardHeader>
            <CardTitle>Repayment Progress</CardTitle>
            <CardDescription>
              {paidInstallments} of {totalInstallments} installments paid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercent} className="h-3" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(totalPaid, 'EUR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-lg font-semibold text-orange-600">
                  {formatCurrency(totalRemaining, 'EUR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amortization Schedule */}
      {(loan.status === 'ACTIVE' || loan.status === 'APPROVED') && (
        <Card>
          <CardHeader>
            <CardTitle>Amortization Schedule</CardTitle>
            <CardDescription>Payment breakdown for each installment</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <div className="text-center py-8 text-gray-500">Loading schedule...</div>
            ) : schedule && schedule.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Insurance</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((item) => (
                      <TableRow key={item.id} className={item.isPaid ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">{item.installmentNumber}</TableCell>
                        <TableCell>
                          {new Date(item.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.principalAmount, 'EUR')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.interestAmount, 'EUR')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.insuranceAmount, 'EUR')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalAmount, 'EUR')}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isPaid ? (
                            <Badge className="bg-green-100 text-green-800 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No schedule available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loan Info */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="font-medium">{new Date(loan.createdAt).toLocaleDateString()}</dd>
            </div>
            {loan.approvalDate && (
              <div>
                <dt className="text-sm text-gray-500">Approved</dt>
                <dd className="font-medium">{new Date(loan.approvalDate).toLocaleDateString()}</dd>
              </div>
            )}
            {loan.disbursementDate && (
              <div>
                <dt className="text-sm text-gray-500">Disbursed</dt>
                <dd className="font-medium">{new Date(loan.disbursementDate).toLocaleDateString()}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">Insurance Rate</dt>
              <dd className="font-medium">{(loan.insuranceRate * 100).toFixed(2)}%</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
