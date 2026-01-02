'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Check,
  X,
  UserCog,
  Shield,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { User, Loan } from '@/lib/types';

export default function AdminPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

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

  const { data: pendingLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['pendingLoans'],
    queryFn: () => adminApi.getPendingLoans(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED' }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  const approveLoanMutation = useMutation({
    mutationFn: (loanId: string) => adminApi.approveLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingLoans'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Loan approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve loan');
    },
  });

  const rejectLoanMutation = useMutation({
    mutationFn: (loanId: string) => adminApi.rejectLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingLoans'] });
      toast.success('Loan rejected');
    },
    onError: () => {
      toast.error('Failed to reject loan');
    },
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
          <Shield className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">Manage users, loans, and system settings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-500">Total Users</span>
            </div>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-500">Total Accounts</span>
            </div>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalAccounts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-500">Active Loans</span>
            </div>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.activeLoans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-500">Total Deposits</span>
            </div>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatCurrency(stats?.totalDeposits || 0, 'EUR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-gray-500">Loan Portfolio</span>
            </div>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatCurrency(stats?.totalLoanAmount || 0, 'EUR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="loans" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pending Loans
            {pendingLoans && pendingLoans.length > 0 && (
              <Badge className="ml-1 bg-orange-500">{pendingLoans.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : users && users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email Verified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">
                            {u.profile.firstName} {u.profile.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{getStatusBadge(u.status)}</TableCell>
                        <TableCell>
                          {u.emailConfirmed ? (
                            <Badge className="bg-green-100 text-green-800">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.status !== 'ACTIVE' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ userId: u.id, status: 'ACTIVE' })
                                  }
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {u.status !== 'SUSPENDED' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ userId: u.id, status: 'SUSPENDED' })
                                  }
                                >
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {u.status !== 'CLOSED' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ userId: u.id, status: 'CLOSED' })
                                  }
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Close Account
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">No users found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Loans Tab */}
        <TabsContent value="loans" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Loan Applications</CardTitle>
              <CardDescription>Review and approve or reject loan applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="text-center py-8 text-gray-500">Loading loans...</div>
              ) : pendingLoans && pendingLoans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Interest Rate</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Monthly Payment</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-xs">
                          {loan.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(loan.amount, 'EUR')}
                        </TableCell>
                        <TableCell className="text-right">
                          {(loan.interestRate * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {loan.durationMonths} months
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(loan.monthlyPayment, 'EUR')}
                        </TableCell>
                        <TableCell>
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700">
                                  <Check className="h-3 w-3" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Loan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve this loan of{' '}
                                    {formatCurrency(loan.amount, 'EUR')}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => approveLoanMutation.mutate(loan.id)}
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="gap-1">
                                  <X className="h-3 w-3" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Loan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject this loan application?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => rejectLoanMutation.mutate(loan.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reject
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
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending loans</p>
                  <p className="text-sm mt-1">All loan applications have been processed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
