'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { securitiesApi } from '@/lib/api/securities';
import { ordersApi } from '@/lib/api/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Search, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function TradingPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: securities, isLoading, refetch } = useQuery({
    queryKey: ['securities'],
    queryFn: () => securitiesApi.getSecurities(),
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => ordersApi.getUserOrders(user!.id),
    enabled: !!user?.id,
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: () => ordersApi.getPortfolio(user!.id),
    enabled: !!user?.id,
  });

  // Filter securities
  const filteredSecurities = securities?.filter((security) => {
    const matchesSearch =
      security.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      security.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || security.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Calculate portfolio value
  const portfolioValue = portfolio?.reduce((sum, item) => {
    return sum + (item.quantity * (item.security?.currentPrice || 0));
  }, 0) || 0;

  // Get pending orders count
  const pendingOrders = orders?.filter(o => o.status === 'PENDING').length || 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STOCK': return 'bg-blue-100 text-blue-800';
      case 'CRYPTO': return 'bg-purple-100 text-purple-800';
      case 'BOND': return 'bg-green-100 text-green-800';
      case 'ETF': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Trading</h1>
          <p className="text-gray-500 text-sm md:text-base">Buy and sell securities</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/trading/orders">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              My Orders
              {pendingOrders > 0 && (
                <Badge className="ml-2 bg-orange-500">{pendingOrders}</Badge>
              )}
            </Button>
          </Link>
          <Link href="/trading/portfolio">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">My Portfolio</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioValue, 'USD')}</div>
            <p className="text-xs text-gray-500">{portfolio?.length || 0} holdings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available Securities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securities?.length || 0}</div>
            <p className="text-xs text-gray-500">Tradeable assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-gray-500">Awaiting execution</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Securities Market</CardTitle>
          <CardDescription>Browse and trade available securities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by symbol or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="STOCK" className="text-xs sm:text-sm">Stocks</TabsTrigger>
                <TabsTrigger value="CRYPTO" className="text-xs sm:text-sm">Crypto</TabsTrigger>
                <TabsTrigger value="BOND" className="text-xs sm:text-sm">Bonds</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Securities List */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading securities...</div>
          ) : filteredSecurities && filteredSecurities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSecurities.map((security) => (
                <Link key={security.id} href={`/trading/${security.symbol}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{security.symbol}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{security.name}</p>
                        </div>
                        <Badge className={getTypeColor(security.type)}>
                          {security.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-2xl font-bold">
                            {formatCurrency(security.currentPrice, 'USD')}
                          </p>
                          <p className="text-xs text-gray-500">{security.exchange}</p>
                        </div>
                        <div className={`flex items-center gap-1 ${
                          Math.random() > 0.5 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.random() > 0.5 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {(Math.random() * 5).toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Button className="w-full" size="sm">
                          Trade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No securities found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
