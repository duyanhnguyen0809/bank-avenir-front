'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

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

export default function AdvisorSecuritiesPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect non-manager users
  if (user && user.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  const { data: securities, isLoading } = useQuery({
    queryKey: ['adminSecurities'],
    queryFn: () => adminApi.getAllSecurities(),
  });

  const filteredSecurities = securities?.filter((s: Security) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.symbol.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
    );
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
      <div>
        <Link href="/advisor">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">View Securities</h1>
        <p className="text-gray-500">Browse all tradeable securities on the platform</p>
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
          <CardDescription>View securities information (read-only)</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading securities...</div>
          ) : filteredSecurities && filteredSecurities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecurities.map((security: Security) => (
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
