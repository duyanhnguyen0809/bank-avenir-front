'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { accountsApi } from '@/lib/api/accounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function AccountsPage() {
  const { user } = useAuthStore();

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => accountsApi.getUserAccounts(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Accounts</h1>
            <p className="text-gray-500">Manage your bank accounts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-gray-200"></CardHeader>
              <CardContent className="h-24 bg-gray-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Accounts</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error loading accounts: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
  const accountsByType = {
    CHECKING: accounts?.filter(a => a.accountType === 'CHECKING') || [],
    SAVINGS: accounts?.filter(a => a.accountType === 'SAVINGS') || [],
    INVESTMENT: accounts?.filter(a => a.accountType === 'INVESTMENT') || [],
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CHECKING':
        return <CreditCard className="h-6 w-6" />;
      case 'SAVINGS':
        return <Wallet className="h-6 w-6" />;
      case 'INVESTMENT':
        return <TrendingUp className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Accounts</h1>
          <p className="text-gray-500">Manage your bank accounts</p>
        </div>
        <Link href="/accounts/open">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Open New Account
          </Button>
        </Link>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Total Balance</CardTitle>
          <CardDescription className="text-blue-100">Across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-sm text-blue-100 mt-2">
            {accounts?.length || 0} account{accounts?.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No accounts yet</h3>
            <p className="text-gray-500 mb-4">Open your first account to get started</p>
            <Link href="/accounts/open">
              <Button>Open Account</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Checking Accounts */}
          {accountsByType.CHECKING.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Checking Accounts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accountsByType.CHECKING.map((account) => (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className={`bg-gradient-to-br ${getAccountColor(account.accountType)} text-white`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getAccountIcon(account.accountType)}
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              {account.accountType}
                            </Badge>
                          </div>
                          <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-4">
                          <p className="text-sm opacity-90">{account.name || 'Account'}</p>
                          <p className="text-2xl font-bold mt-1">{formatCurrency(account.balance)}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">IBAN</span>
                            <span className="font-mono">
                              {account.iban.slice(0, 4)} •••• {account.iban.slice(-4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Currency</span>
                            <span className="font-semibold">{account.currency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Savings Accounts */}
          {accountsByType.SAVINGS.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Savings Accounts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accountsByType.SAVINGS.map((account) => (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className={`bg-gradient-to-br ${getAccountColor(account.accountType)} text-white`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getAccountIcon(account.accountType)}
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              {account.accountType}
                            </Badge>
                          </div>
                          <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-4">
                          <p className="text-sm opacity-90">{account.name || 'Account'}</p>
                          <p className="text-2xl font-bold mt-1">{formatCurrency(account.balance)}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">IBAN</span>
                            <span className="font-mono">
                              {account.iban.slice(0, 4)} •••• {account.iban.slice(-4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Currency</span>
                            <span className="font-semibold">{account.currency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Investment Accounts */}
          {accountsByType.INVESTMENT.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Investment Accounts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accountsByType.INVESTMENT.map((account) => (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className={`bg-gradient-to-br ${getAccountColor(account.accountType)} text-white`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getAccountIcon(account.accountType)}
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              {account.accountType}
                            </Badge>
                          </div>
                          <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-4">
                          <p className="text-sm opacity-90">{account.name || 'Account'}</p>
                          <p className="text-2xl font-bold mt-1">{formatCurrency(account.balance)}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">IBAN</span>
                            <span className="font-mono">
                              {account.iban.slice(0, 4)} •••• {account.iban.slice(-4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Currency</span>
                            <span className="font-semibold">{account.currency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
