'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { loansApi } from '@/lib/api/loans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Clock,
  UserCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LoanRequest } from '@/lib/types';

export default function AdvisorDashboardPage() {
  const { user } = useAuthStore();

  // Redirect non-manager users
  if (user && user.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  // Fetch loan requests using the correct API
  const { data: loanRequests } = useQuery({
    queryKey: ['loanRequests'],
    queryFn: () => loansApi.getPendingRequests(),
  });

  // Filter pending and assigned requests
  const pendingRequests = loanRequests?.filter((r: LoanRequest) => r.status === 'PENDING') || [];
  const assignedToMe = loanRequests?.filter((r: LoanRequest) => r.status === 'ASSIGNED' && r.managerId === user?.id) || [];

  const { data: users } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getAllUsers(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Advisor Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {user?.profile?.firstName}! Here's an overview of the bank's activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <p className="text-xs text-gray-500">Registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.accounts?.total || 0}</div>
            <p className="text-xs text-gray-500">Bank accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Loans</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.loans?.active || 0}</div>
            <p className="text-xs text-gray-500">{stats?.loans?.total || 0} total loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
            <p className="text-xs text-gray-500">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assigned to Me</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedToMe.length}</div>
            <p className="text-xs text-gray-500">Ready to review</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common advisor tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/advisor/loans">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Manage Loans</span>
                {(pendingRequests.length > 0 || assignedToMe.length > 0) && (
                  <span className="text-xs text-orange-600">
                    {pendingRequests.length} pending, {assignedToMe.length} assigned
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/advisor/users">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                <span>View Users</span>
              </Button>
            </Link>
            <Link href="/advisor/securities">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
                <span>View Securities</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned to Me */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Assigned to Me
            </CardTitle>
            <CardDescription>Loan requests ready for your review</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedToMe.length > 0 ? (
              <div className="space-y-3">
                {assignedToMe.slice(0, 5).map((request: LoanRequest) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {request.user?.profile?.firstName} {request.user?.profile?.lastName || 'Client'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(Number(request.requestedAmount), 'EUR')} - {request.termMonths} months
                      </p>
                      <p className="text-xs text-gray-400">{request.purpose}</p>
                    </div>
                    <Link href="/advisor/loans">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Review</Button>
                    </Link>
                  </div>
                ))}
                {assignedToMe.length > 5 && (
                  <Link href="/advisor/loans">
                    <Button variant="link" className="w-full">
                      View all {assignedToMe.length} assigned requests
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No requests assigned to you</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Requests
            </CardTitle>
            <CardDescription>New requests awaiting assignment</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((request: LoanRequest) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {request.user?.profile?.firstName} {request.user?.profile?.lastName || 'Client'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(Number(request.requestedAmount), 'EUR')} - {request.termMonths} months
                      </p>
                      <p className="text-xs text-gray-400">{request.purpose}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                ))}
                {pendingRequests.length > 5 && (
                  <Link href="/advisor/loans">
                    <Button variant="link" className="w-full">
                      View all {pendingRequests.length} pending requests
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending requests</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Recent Users
            </CardTitle>
            <CardDescription>Latest registered clients</CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-3">
                {users.slice(0, 5).map((u: any) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">
                        {u.profile?.firstName?.charAt(0) || 'U'}
                        {u.profile?.lastName?.charAt(0) || ''}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {u.profile?.firstName} {u.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No users found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
