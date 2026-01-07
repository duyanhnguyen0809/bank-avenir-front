'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, CreditCard, TrendingUp, ArrowUpCircle, ArrowDownCircle, Copy, Check, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface AccountDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    toIban: '',
    amount: '',
    description: '',
  });

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountsApi.getAccount(id),
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: (data: { fromAccountId: string; toIban: string; amount: number; description?: string }) =>
      accountsApi.transfer(data),
    onSuccess: (response) => {
      toast.success('Transfer successful!', {
        description: response.message || `Transfer ID: ${response.transferId}`,
      });
      setTransferDialogOpen(false);
      setTransferForm({ toIban: '', amount: '', description: '' });
      // Refresh account data (which includes operations)
      queryClient.invalidateQueries({ queryKey: ['account', id] });
    },
    onError: (error: Error) => {
      toast.error('Transfer failed', {
        description: error.message || 'Please check your details and try again.',
      });
    },
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferForm.amount);

    if (!transferForm.toIban.trim()) {
      toast.error('Please enter a recipient IBAN');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (account && amount > account.balance) {
      toast.error('Insufficient balance');
      return;
    }

    transferMutation.mutate({
      fromAccountId: id,
      toIban: transferForm.toIban.trim(),
      amount,
      description: transferForm.description.trim() || undefined,
    });
  };

  // Operations come from the account data (GET /accounts/:id returns operations)
  const operations = account?.operations || [];
  const operationsLoading = accountLoading;

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

  // Determine if operation is credit (money in) or debit (money out)
  const isCredit = (operation: { type: string; amount: number; senderIban?: string; recipientIban?: string }) => {
    const type = operation.type.toUpperCase();
    // Deposits are always credits
    if (type === 'DEPOSIT' || type.includes('CREDIT')) {
      return true;
    }
    // Withdrawals are always debits
    if (type === 'WITHDRAWAL' || type.includes('DEBIT')) {
      return false;
    }
    // For transfers:
    // - senderIban present = incoming transfer (someone sent money to this account) = credit
    // - recipientIban present = outgoing transfer (this account sent money) = debit
    if (type === 'TRANSFER') {
      // If senderIban is set, we received money from that IBAN (credit)
      if (operation.senderIban) {
        return true;
      }
      // If recipientIban is set, we sent money to that IBAN (debit)
      if (operation.recipientIban) {
        return false;
      }
      // Fallback to amount sign
      return operation.amount > 0;
    }
    // Default: check amount sign
    return operation.amount > 0;
  };

  const getOperationIcon = (operation: { type: string; amount: number; senderIban?: string; recipientIban?: string }) => {
    if (isCredit(operation)) {
      return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
    }
    return <ArrowUpCircle className="h-5 w-5 text-red-600" />;
  };

  const getOperationColor = (operation: { type: string; amount: number; senderIban?: string; recipientIban?: string }) => {
    if (isCredit(operation)) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  const getAmountPrefix = (operation: { type: string; amount: number; senderIban?: string; recipientIban?: string }) => {
    return isCredit(operation) ? '+' : '-';
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
      <Card className={`bg-linear-to-br ${getAccountColor(account.accountType)} text-white`}>
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
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
          <ArrowDownCircle className="h-6 w-6" />
          <span>Deposit</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
          <ArrowUpCircle className="h-6 w-6" />
          <span>Withdraw</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => setTransferDialogOpen(true)}
        >
          <Send className="h-6 w-6" />
          <span>Transfer</span>
        </Button>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
            <DialogDescription>
              Send money to another account. Available balance: {formatCurrency(account.balance, account.currency)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="toIban">Recipient IBAN</Label>
                <Input
                  id="toIban"
                  placeholder="e.g., FR76 1234 5678 9012 3456 7890 123"
                  value={transferForm.toIban}
                  onChange={(e) => setTransferForm({ ...transferForm, toIban: e.target.value })}
                  disabled={transferMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ({account.currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={account.balance}
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  disabled={transferMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Rent payment"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  disabled={transferMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferDialogOpen(false)}
                disabled={transferMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={transferMutation.isPending}>
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Transfer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                          {getOperationIcon(operation)}
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
                      <TableCell className={`text-right font-medium ${getOperationColor(operation)}`}>
                        {getAmountPrefix(operation)}
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
