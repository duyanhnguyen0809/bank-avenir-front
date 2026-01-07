'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { loansApi } from '@/lib/api/loans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Shield,
  Clock,
  UserCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { LoanRequest } from '@/lib/types';

export default function AdminPage() {
  const { user } = useAuthStore();

  // Redirect non-admin users
  if (user && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getAllUsers(),
  });

  // Fetch loan requests using the same API as manager/advisor
  const { data: loanRequests, isLoading: loansLoading } = useQuery({
    queryKey: ['loanRequests'],
    queryFn: () => loansApi.getPendingRequests(),
  });

  // Filter pending and assigned requests
  const pendingRequests = loanRequests?.filter((r: LoanRequest) => r.status === 'PENDING') || [];
  const assignedRequests = loanRequests?.filter((r: LoanRequest) => r.status === 'ASSIGNED') || [];
  const allRequests = loanRequests || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      case 'CLOSED':
        return <Badge className="bg-red-100 text-red-800">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'MANAGER':
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>;
      case 'CLIENT':
        return <Badge variant="outline">Client</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getLoanStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-purple-100 flex items-center justify-center">
          <Shield className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-500">Manage users, loans, and system settings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              <span className="text-xs md:text-sm text-gray-500">Users</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{statsLoading ? '...' : stats?.users?.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              <span className="text-xs md:text-sm text-gray-500">Accounts</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{statsLoading ? '...' : stats?.accounts?.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              <span className="text-xs md:text-sm text-gray-500">Active Loans</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{statsLoading ? '...' : stats?.loans?.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              <span className="text-xs md:text-sm text-gray-500">Pending Orders</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{statsLoading ? '...' : stats?.orders?.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              <span className="text-xs md:text-sm text-gray-500">Pending Loans</span>
            </div>
            <div className="text-lg md:text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              <span className="text-xs md:text-sm text-gray-500">Assigned</span>
            </div>
            <div className="text-lg md:text-2xl font-bold text-blue-600">{assignedRequests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="users" className="gap-2 flex-1 sm:flex-none">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="loans" className="gap-2 flex-1 sm:flex-none">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Loan Requests</span>
            <span className="sm:hidden">Loans</span>
            {allRequests.length > 0 && (
              <Badge className="ml-1 bg-orange-500">{allRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 md:mt-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Users Overview</CardTitle>
              <CardDescription className="text-xs md:text-sm">View all registered users (manage accounts in Users & Accounts page)</CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              {usersLoading ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">User</TableHead>
                        <TableHead className="whitespace-nowrap hidden md:table-cell">Email</TableHead>
                        <TableHead className="whitespace-nowrap">Role</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Accounts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {u.profile.firstName} {u.profile.lastName}
                            </div>
                            <div className="text-xs text-gray-500 md:hidden">{u.email}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell>{getStatusBadge(u.status || 'ACTIVE')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.accountsCount || 0}</Badge>
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No users found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loan Requests Tab */}
        <TabsContent value="loans" className="mt-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Loan Requests Overview</CardTitle>
              <CardDescription className="text-xs md:text-sm">View all loan requests (processing is handled by managers)</CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              {loansLoading ? (
                <div className="text-center py-8 text-gray-500">Loading loan requests...</div>
              ) : allRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Client</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                        <TableHead className="text-right whitespace-nowrap hidden md:table-cell">Term</TableHead>
                        <TableHead className="whitespace-nowrap hidden lg:table-cell">Purpose</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap hidden lg:table-cell">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequests.map((request: LoanRequest) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {request.user?.profile?.firstName} {request.user?.profile?.lastName || 'Client'}
                            </div>
                            <div className="text-xs text-gray-500">{request.user?.email}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            {formatCurrency(Number(request.requestedAmount), 'EUR')}
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell">
                            {request.termMonths} months
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-gray-600 line-clamp-1">{request.purpose}</span>
                          </TableCell>
                          <TableCell>
                            {getLoanStatusBadge(request.status)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No loan requests</p>
                  <p className="text-sm mt-1">No loan applications at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
