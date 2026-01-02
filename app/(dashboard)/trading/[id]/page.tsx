'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/store/authStore';
import { securitiesApi } from '@/lib/api/securities';
import { ordersApi } from '@/lib/api/orders';
import { accountsApi } from '@/lib/api/accounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

const orderSchema = z.object({
  accountId: z.string().min(1, 'Please select an account'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function SecurityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');

  const { data: security, isLoading: securityLoading } = useQuery({
    queryKey: ['security', resolvedParams.id],
    queryFn: () => securitiesApi.getSecurity(resolvedParams.id),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => accountsApi.getUserAccounts(user!.id),
    enabled: !!user?.id,
  });

  const { data: orderBook } = useQuery({
    queryKey: ['orderBook', resolvedParams.id],
    queryFn: () => securitiesApi.getOrderBook(resolvedParams.id),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Filter only investment accounts
  const investmentAccounts = accounts?.filter(a => a.accountType === 'INVESTMENT') || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      price: security?.currentPrice || 0,
    },
  });

  // Update price when security loads
  if (security && !watch('price')) {
    setValue('price', security.currentPrice);
  }

  const quantity = watch('quantity') || 0;
  const price = watch('price') || 0;
  const totalAmount = quantity * price;
  const selectedAccountId = watch('accountId');
  const selectedAccount = investmentAccounts.find(a => a.id === selectedAccountId);

  const mutation = useMutation({
    mutationFn: (data: OrderFormData) =>
      ordersApi.placeOrder({
        userId: user!.id,
        accountId: data.accountId,
        securityId: resolvedParams.id,
        type: orderType,
        quantity: data.quantity,
        price: data.price,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(`${orderType} order placed successfully!`);
      router.push('/trading/orders');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place order');
    },
  });

  const onSubmit = (data: OrderFormData) => {
    if (orderType === 'BUY' && selectedAccount && totalAmount > selectedAccount.balance) {
      toast.error('Insufficient funds in selected account');
      return;
    }
    mutation.mutate(data);
  };

  if (securityLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading security details...</p>
      </div>
    );
  }

  if (!security) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Security not found</h2>
        <Link href="/trading">
          <Button className="mt-4">Back to Trading</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/trading">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Market
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{security.symbol}</h1>
              <Badge variant="outline">{security.type}</Badge>
              {security.isAvailable ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">{security.name}</p>
            <p className="text-sm text-gray-400">{security.exchange}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{formatCurrency(security.currentPrice, 'USD')}</p>
            <div className={`flex items-center justify-end gap-1 ${
              Math.random() > 0.5 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.random() > 0.5 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">{(Math.random() * 5).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
              <CardDescription>Buy or sell {security.symbol}</CardDescription>
            </CardHeader>
            <CardContent>
              {investmentAccounts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need an investment account to trade securities.{' '}
                    <Link href="/accounts/open" className="text-blue-600 hover:underline">
                      Open one now
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Order Type Toggle */}
                  <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'BUY' | 'SELL')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="BUY"
                        className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                      >
                        Buy
                      </TabsTrigger>
                      <TabsTrigger
                        value="SELL"
                        className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                      >
                        Sell
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Account Selection */}
                  <div className="space-y-2">
                    <Label>Trading Account</Label>
                    <Select onValueChange={(value) => setValue('accountId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investment account" />
                      </SelectTrigger>
                      <SelectContent>
                        {investmentAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name || 'Investment Account'} - {formatCurrency(account.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.accountId && (
                      <p className="text-sm text-red-500">{errors.accountId.message}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      {...register('quantity', { valueAsNumber: true })}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500">{errors.quantity.message}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Limit Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500">{errors.price.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Market price: {formatCurrency(security.currentPrice, 'USD')}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium">Order Summary</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className={orderType === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                        {orderType}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Quantity</span>
                      <span>{quantity} shares</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price per share</span>
                      <span>{formatCurrency(price, 'USD')}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total {orderType === 'BUY' ? 'Cost' : 'Proceeds'}</span>
                        <span>{formatCurrency(totalAmount, 'USD')}</span>
                      </div>
                    </div>
                    {selectedAccount && orderType === 'BUY' && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Available Balance</span>
                        <span className={totalAmount > selectedAccount.balance ? 'text-red-500' : ''}>
                          {formatCurrency(selectedAccount.balance)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className={`w-full ${
                      orderType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                    disabled={mutation.isPending || !security.isAvailable}
                  >
                    {mutation.isPending ? 'Placing Order...' : `${orderType} ${security.symbol}`}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Book */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Book</CardTitle>
              <CardDescription>Live buy and sell orders</CardDescription>
            </CardHeader>
            <CardContent>
              {orderBook ? (
                <div className="space-y-4">
                  {/* Asks (Sell Orders) */}
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">Sell Orders</h4>
                    <div className="space-y-1">
                      {orderBook.asks?.slice(0, 5).reverse().map((order: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-red-600">{formatCurrency(order.price, 'USD')}</span>
                          <span className="text-gray-500">{order.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Spread */}
                  <div className="py-2 text-center border-y">
                    <span className="text-lg font-bold">
                      {formatCurrency(security.currentPrice, 'USD')}
                    </span>
                  </div>

                  {/* Bids (Buy Orders) */}
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2">Buy Orders</h4>
                    <div className="space-y-1">
                      {orderBook.bids?.slice(0, 5).map((order: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-green-600">{formatCurrency(order.price, 'USD')}</span>
                          <span className="text-gray-500">{order.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Loading order book...</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Market Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Exchange</span>
                <span>{security.exchange}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <span>{security.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span>{security.isAvailable ? 'Trading' : 'Halted'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
