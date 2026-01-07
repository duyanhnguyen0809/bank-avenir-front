'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { accountsApi } from '@/lib/api/accounts';
import { ordersApi } from '@/lib/api/orders';
import { loansApi } from '@/lib/api/loans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Redirect admin/manager to their respective dashboards
  if (user?.role === 'ADMIN') {
    redirect('/admin');
  }
  if (user?.role === 'MANAGER') {
    redirect('/advisor');
  }

  // Fetch user data
  const { data: accounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => accountsApi.getUserAccounts(user!.id),
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => ordersApi.getUserOrders(user!.id),
    enabled: !!user?.id,
  });

  const { data: loans } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: () => loansApi.getUserLoans(user!.id),
    enabled: !!user?.id,
  });

  // Calculate stats
  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
  
  const investmentAccounts = accounts?.filter(a => a.accountType === 'INVESTMENT') || [];
  const portfolioValue = investmentAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const activeLoans = loans?.filter(l => l.status === 'ACTIVE').length || 0;
  const openOrders = orders?.filter(o => o.status === 'PENDING').length || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {user?.profile.firstName}!
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Here&apos;s an overview of your banking activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Total Balance
            </CardTitle>
            <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {accounts?.length || 0} account{accounts?.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Portfolio Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
            <p className="text-xs text-gray-500 mt-1">Investment accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Active Loans
            </CardTitle>
            <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold">{activeLoans}</div>
            <p className="text-xs text-gray-500 mt-1">Outstanding loans</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Open Orders
            </CardTitle>
            <Activity className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-lg md:text-2xl font-bold">{openOrders}</div>
            <p className="text-xs text-gray-500 mt-1">Pending trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-xs md:text-sm">Get started with your banking activities</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Link
              href="/accounts"
              className="flex items-center gap-3 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
            >
              <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-medium text-sm md:text-base">View Accounts</h3>
                <p className="text-xs md:text-sm text-gray-500">Manage your accounts</p>
              </div>
            </Link>

            <Link
              href="/trading"
              className="flex items-center gap-3 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer group"
            >
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-medium text-sm md:text-base">Trade Securities</h3>
                <p className="text-xs md:text-sm text-gray-500">Buy and sell stocks</p>
              </div>
            </Link>

            <Link
              href="/loans"
              className="flex items-center gap-3 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer group"
            >
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-600 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-medium text-sm md:text-base">Apply for Loan</h3>
                <p className="text-xs md:text-sm text-gray-500">Get financing</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          <CardDescription className="text-xs md:text-sm">Your latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {accounts && accounts.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {accounts.slice(0, 3).map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  className="flex items-center justify-between p-3 md:p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`p-1.5 md:p-2 rounded-full ${
                      account.accountType === 'CHECKING' ? 'bg-blue-100' :
                      account.accountType === 'SAVINGS' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      <CreditCard className={`h-4 w-4 md:h-5 md:w-5 ${
                        account.accountType === 'CHECKING' ? 'text-blue-600' :
                        account.accountType === 'SAVINGS' ? 'text-green-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base">{account.name || `${account.accountType} Account`}</p>
                      <p className="text-xs md:text-sm text-gray-500">IBAN: •••• {account.iban.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm md:text-base">{formatCurrency(account.balance)}</p>
                    <p className="text-xs text-gray-500">{account.currency}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No accounts yet</p>
              <Link href="/accounts/open">
                <p className="text-blue-600 hover:underline mt-2">Open your first account</p>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
