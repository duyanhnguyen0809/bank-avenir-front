'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { ordersApi } from '@/lib/api/orders';
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
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function PortfolioPage() {
  const { user } = useAuthStore();

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: () => ordersApi.getPortfolio(user!.id),
    enabled: !!user?.id,
  });

  // Calculate totals
  const totalCost = portfolio?.reduce((sum, item) => sum + (item.averagePurchasePrice * item.quantity), 0) || 0;
  const totalValue = portfolio?.reduce((sum, item) => sum + ((item.security?.currentPrice || 0) * item.quantity), 0) || 0;
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Calculate individual gains
  const portfolioWithGains = portfolio?.map((item) => {
    const currentValue = (item.security?.currentPrice || 0) * item.quantity;
    const cost = item.averagePurchasePrice * item.quantity;
    const gain = currentValue - cost;
    const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
    return { ...item, currentValue, gain, gainPercent };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/trading">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Trading
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">My Portfolio</h1>
        <p className="text-gray-500">Track your investment holdings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 opacity-80" />
              <span className="text-sm opacity-80">Total Value</span>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(totalValue, 'USD')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Total Cost</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalCost, 'USD')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              {totalGain >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-500">Total Gain/Loss</span>
            </div>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, 'USD')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">Return %</span>
            </div>
            <div className={`text-2xl font-bold ${totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Your current securities positions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading portfolio...</div>
          ) : portfolioWithGains && portfolioWithGains.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Security</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Return</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioWithGains.map((item) => (
                  <TableRow key={item.securityId}>
                    <TableCell>
                      <Link
                        href={`/trading/${item.securityId}`}
                        className="hover:underline"
                      >
                        <div>
                          <p className="font-medium">{item.security?.symbol}</p>
                          <p className="text-xs text-gray-500">{item.security?.name}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.averagePurchasePrice, 'USD')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.security?.currentPrice || 0, 'USD')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.currentValue, 'USD')}
                    </TableCell>
                    <TableCell className={`text-right ${item.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.gain >= 0 ? '+' : ''}{formatCurrency(item.gain, 'USD')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={`${
                        item.gainPercent >= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.gainPercent >= 0 ? '+' : ''}{item.gainPercent.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No holdings yet</p>
              <p className="text-sm mt-1">Start trading to build your portfolio</p>
              <Link href="/trading">
                <Button className="mt-4">Browse Securities</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocation Chart Placeholder */}
      {portfolioWithGains && portfolioWithGains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>Distribution of your investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioWithGains.map((item) => {
                const percentage = totalValue > 0 ? (item.currentValue / totalValue) * 100 : 0;
                return (
                  <div key={item.securityId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.security?.symbol}</span>
                      <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
