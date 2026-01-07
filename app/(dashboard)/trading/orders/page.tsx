'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { ordersApi } from '@/lib/api/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, TrendingUp, TrendingDown, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => ordersApi.getUserOrders(user!.id),
    enabled: !!user?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.cancelOrder(orderId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel order';
      toast.error(errorMessage);
    },
  });

  // Filter orders based on tab
  const filteredOrders = orders?.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'PENDING';
    if (activeTab === 'executed') return order.status === 'EXECUTED';
    if (activeTab === 'cancelled') return order.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'EXECUTED':
        return (
          <Badge className="bg-green-100 text-green-800 gap-1">
            <CheckCircle className="h-3 w-3" />
            Executed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-gray-100 text-gray-800 gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'BUY' ? (
      <Badge className="bg-green-100 text-green-800 gap-1">
        <TrendingUp className="h-3 w-3" />
        BUY
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 gap-1">
        <TrendingDown className="h-3 w-3" />
        SELL
      </Badge>
    );
  };

  // Stats
  const pendingCount = orders?.filter((o) => o.status === 'PENDING').length || 0;
  const executedCount = orders?.filter((o) => o.status === 'EXECUTED').length || 0;
  const cancelledCount = orders?.filter((o) => o.status === 'CANCELLED').length || 0;

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
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-gray-500">View and manage your trading orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
            <p className="text-sm text-gray-500">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-sm text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{executedCount}</div>
            <p className="text-sm text-gray-500">Executed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{cancelledCount}</div>
            <p className="text-sm text-gray-500">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>All your trading orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({orders?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="executed">Executed ({executedCount})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelledCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.security?.symbol}</p>
                        <p className="text-xs text-gray-500">{order.security?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(order.type)}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p>{order.quantity}</p>
                        {order.executedQuantity > 0 && order.executedQuantity < order.quantity && (
                          <p className="text-xs text-gray-500">
                            {order.executedQuantity} filled
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.price, 'USD')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.quantity * order.price, 'USD')}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      {order.status === 'PENDING' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this order for {order.quantity}{' '}
                                {order.security?.symbol} at{' '}
                                {formatCurrency(order.price, 'USD')}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Order</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelMutation.mutate(order.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancel Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {order.status === 'EXECUTED' && order.executedAt && (
                        <span className="text-xs text-gray-500">
                          {formatDateTime(order.executedAt)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No orders found</p>
              <Link href="/trading">
                <Button className="mt-4">Start Trading</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
