'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, TrendingUp, ArrowUpCircle, ArrowDownCircle, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface AccountDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountsApi.getAccount(id),
  });

  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['operations', id],
    queryFn: () => accountsApi.getAccountOperations(id),
    enabled: !!id,
  });

  const copyIban = () => {
    if (account?.iban) {
      navigator.clipboard.writeText(account.iban);
      setCopied(true);
      toast.success('IBAN copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (accountLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Account not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'CHECKING':
        return 'from-blue-500 to-blue-600';
      case 'SAVINGS':
        return 'from-green-500 to-green-600';
      case 'INVESTMENT':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getOperationIcon = (type: string) => {
    if (type.includes('CREDIT') || type === 'DEPOSIT') {
      return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
    }
    return <ArrowUpCircle className="h-5 w-5 text-red-600" />;
  };

  const getOperationColor = (type: string) => {
    if (type.includes('CREDIT') || type === 'DEPOSIT') {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/accounts">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Accounts
          </Button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{account.name || 'Account Details'}</h1>
            <p className="text-gray-500">View your account information and transactions</p>
          </div>
          <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-sm">
            {account.status}
          </Badge>
        </div>
      </div>

      {/* Account Info Card */}
      <Card className={`bg-gradient-to-br ${getAccountColor(account.accountType)} text-white`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                {account.accountType === 'INVESTMENT' ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <CreditCard className="h-6 w-6" />
                )}
                {account.accountType} Account
              </CardTitle>
              <CardDescription className="text-white/90">
                {account.name || 'Main Account'}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              {account.currency}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm opacity-90">Current Balance</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(account.balance, account.currency)}</p>
          </div>

          <Separator className="bg-white/20" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90">IBAN</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-sm">{account.iban}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                  onClick={copyIban}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm opacity-90">Account ID</p>
              <p className="font-mono text-sm mt-1">{account.id.slice(0, 8)}...</p>
            </div>

            <div>
              <p className="text-sm opacity-90">Opened On</p>
              <p className="text-sm mt-1">{formatDateTime(account.createdAt)}</p>
            </div>

            <div>
              <p className="text-sm opacity-90">Type</p>
              <p className="text-sm mt-1">{account.accountType}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
          <ArrowDownCircle className="h-6 w-6" />
          <span>Deposit</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
          <ArrowUpCircle className="h-6 w-6" />
          <span>Withdraw</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
          <CreditCard className="h-6 w-6" />
          <span>Transfer</span>
        </Button>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All transactions for this account</CardDescription>
        </CardHeader>
        <CardContent>
          {operationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded"></div>
              ))}
            </div>
          ) : operations && operations.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getOperationIcon(operation.type)}
                          <Badge variant="outline">{operation.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{operation.description || 'No description'}</p>
                          {operation.senderIban && (
                            <p className="text-xs text-gray-500">From: {operation.senderIban}</p>
                          )}
                          {operation.recipientIban && (
                            <p className="text-xs text-gray-500">To: {operation.recipientIban}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(operation.createdAt)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getOperationColor(operation.type)}`}>
                        {operation.type.includes('CREDIT') || operation.type === 'DEPOSIT' ? '+' : '-'}
                        {formatCurrency(Math.abs(operation.amount), account.currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(operation.balanceAfter, account.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your transaction history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
