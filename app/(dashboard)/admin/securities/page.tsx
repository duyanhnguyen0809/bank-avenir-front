'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  BarChart3,
  Plus,
  ArrowLeft,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface Security {
  id: string;
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
  currentPrice: number;
  currency?: string;
  isAvailable?: boolean;
}

export default function AdminSecuritiesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSecurity, setNewSecurity] = useState({
    symbol: '',
    name: '',
    type: 'STOCK',
    exchange: '',
    currentPrice: 0,
    currency: 'USD',
  });

  // Redirect non-admin users
  if (user && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { data: securities, isLoading } = useQuery({
    queryKey: ['adminSecurities'],
    queryFn: () => adminApi.getAllSecurities(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newSecurity) => adminApi.createSecurity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSecurities'] });
      toast.success('Security created successfully');
      setIsCreateDialogOpen(false);
      setNewSecurity({
        symbol: '',
        name: '',
        type: 'STOCK',
        exchange: '',
        currentPrice: 0,
        currency: 'USD',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create security');
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ symbol, isAvailable }: { symbol: string; isAvailable: boolean }) =>
      adminApi.updateStockAvailability(symbol, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSecurities'] });
      toast.success('Availability updated');
    },
    onError: () => {
      toast.error('Failed to update availability');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (symbol: string) => adminApi.deleteStock(symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSecurities'] });
      toast.success('Security deleted');
    },
    onError: () => {
      toast.error('Failed to delete security');
    },
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'STOCK':
        return <Badge className="bg-blue-100 text-blue-800">Stock</Badge>;
      case 'CRYPTO':
        return <Badge className="bg-purple-100 text-purple-800">Crypto</Badge>;
      case 'BOND':
        return <Badge className="bg-green-100 text-green-800">Bond</Badge>;
      case 'ETF':
        return <Badge className="bg-orange-100 text-orange-800">ETF</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Securities Management</h1>
          <p className="text-gray-500">Create, manage, and delete tradeable securities</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Security
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Security</DialogTitle>
              <DialogDescription>
                Add a new security to the trading platform
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="AAPL"
                    value={newSecurity.symbol}
                    onChange={(e) => setNewSecurity({ ...newSecurity, symbol: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newSecurity.type}
                    onValueChange={(value) => setNewSecurity({ ...newSecurity, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK">Stock</SelectItem>
                      <SelectItem value="CRYPTO">Crypto</SelectItem>
                      <SelectItem value="BOND">Bond</SelectItem>
                      <SelectItem value="ETF">ETF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Apple Inc."
                  value={newSecurity.name}
                  onChange={(e) => setNewSecurity({ ...newSecurity, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange">Exchange</Label>
                  <Input
                    id="exchange"
                    placeholder="NASDAQ"
                    value={newSecurity.exchange}
                    onChange={(e) => setNewSecurity({ ...newSecurity, exchange: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={newSecurity.currency}
                    onValueChange={(value) => setNewSecurity({ ...newSecurity, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Current Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={newSecurity.currentPrice || ''}
                  onChange={(e) => setNewSecurity({ ...newSecurity, currentPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newSecurity)}
                disabled={!newSecurity.symbol || !newSecurity.name || !newSecurity.currentPrice}
              >
                Create Security
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Securities</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securities?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securities?.filter((s: Security) => s.type === 'STOCK').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Crypto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securities?.filter((s: Security) => s.type === 'CRYPTO').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securities?.filter((s: Security) => s.isAvailable !== false).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Securities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Securities</CardTitle>
          <CardDescription>Manage tradeable securities on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading securities...</div>
          ) : securities && securities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securities.map((security: Security) => (
                  <TableRow key={security.id || security.symbol}>
                    <TableCell className="font-bold">{security.symbol}</TableCell>
                    <TableCell>{security.name}</TableCell>
                    <TableCell>{getTypeBadge(security.type)}</TableCell>
                    <TableCell>{security.exchange || '-'}</TableCell>
                    <TableCell>{formatCurrency(security.currentPrice, security.currency || 'USD')}</TableCell>
                    <TableCell>
                      {security.isAvailable !== false ? (
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toggleAvailabilityMutation.mutate({
                              symbol: security.symbol,
                              isAvailable: security.isAvailable === false,
                            })
                          }
                          title={security.isAvailable !== false ? 'Disable' : 'Enable'}
                        >
                          {security.isAvailable !== false ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {security.symbol}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {security.name} from the trading platform.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(security.symbol)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">No securities found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
