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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Accounts</h1>
            <p className="text-sm md:text-base text-gray-500">Manage your bank accounts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-28 md:h-32 bg-gray-200"></CardHeader>
              <CardContent className="h-20 md:h-24 bg-gray-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">My Accounts</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500 text-sm md:text-base">Error loading accounts: {(error as Error).message}</p>
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Accounts</h1>
          <p className="text-sm md:text-base text-gray-500">Manage your bank accounts</p>
        </div>
        <Link href="/accounts/open">
          <Button size="default" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            Open New Account
          </Button>
        </Link>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-linear-to-br from-blue-600 to-indigo-700 text-white">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-white text-lg md:text-xl">Total Balance</CardTitle>
          <CardDescription className="text-blue-100 text-xs md:text-sm">Across all accounts</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <p className="text-3xl md:text-4xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-xs md:text-sm text-blue-100 mt-2">
            {accounts?.length || 0} account{accounts?.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
            <CreditCard className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">No accounts yet</h3>
            <p className="text-sm md:text-base text-gray-500 mb-4">Open your first account to get started</p>
            <Link href="/accounts/open">
              <Button>Open Account</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {/* Checking Accounts */}
          {accountsByType.CHECKING.length > 0 && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                Checking Accounts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {accountsByType.CHECKING.map((account) => (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className={`bg-linear-to-br ${getAccountColor(account.accountType)} text-white p-3 md:p-6`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 md:h-6 md:w-6">{getAccountIcon(account.accountType)}</div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                              {account.accountType}
                            </Badge>
                          </div>
                          <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-3 md:mt-4">
                          <p className="text-xs md:text-sm opacity-90">{account.name || 'Account'}</p>
                          <p className="text-xl md:text-2xl font-bold mt-1">{formatCurrency(account.balance)}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 md:pt-4 md:p-6">
                        <div className="space-y-2 text-xs md:text-sm">
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
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                Savings Accounts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {accountsByType.SAVINGS.map((account) => (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className={`bg-linear-to-br ${getAccountColor(account.accountType)} text-white p-3 md:p-6`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 md:h-6 md:w-6">{getAccountIcon(account.accountType)}</div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                              {account.accountType}
                            </Badge>
                          </div>
                          <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-3 md:mt-4">
                          <p className="text-xs md:text-sm opacity-90">{account.name || 'Account'}</p>
                          <p className="text-xl md:text-2xl font-bold mt-1">{formatCurrency(account.balance)}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 md:p-6 md:pt-4">
                        <div className="space-y-2 text-xs md:text-sm">
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
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                Investment Accounts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {accountsByType.INVESTMENT.map((account) => (
                  <Link key={account.id} href={`/accounts/${account.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className={`bg-linear-to-br ${getAccountColor(account.accountType)} text-white p-3 md:p-6`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 md:h-6 md:w-6">{getAccountIcon(account.accountType)}</div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                              {account.accountType}
                            </Badge>
                          </div>
                          <ArrowRight className="h-4 w-4 md:h-5 md:w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-3 md:mt-4">
                          <p className="text-xs md:text-sm opacity-90">{account.name || 'Account'}</p>
                          <p className="text-xl md:text-2xl font-bold mt-1">{formatCurrency(account.balance)}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 md:pt-4 md:p-6">
                        <div className="space-y-2 text-xs md:text-sm">
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
