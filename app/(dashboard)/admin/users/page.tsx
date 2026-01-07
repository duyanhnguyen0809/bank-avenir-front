'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  CreditCard,
  ArrowLeft,
  UserCog,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { User } from '@/lib/types';

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'MANAGER' | 'ADMIN'>('CLIENT');

  // Redirect non-admin users
  if (user && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getAllUsers(),
  });

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'CLIENT' | 'MANAGER' | 'ADMIN' }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User role updated successfully');
      setRoleDialog({ open: false, user: null });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message || 'Unknown error'}`);
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'MANAGER':
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>;
      case 'CLIENT':
        return <Badge className="bg-gray-100 text-gray-800">Client</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      case 'CLOSED':
        return <Badge className="bg-red-100 text-red-800">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openRoleDialog = (u: User) => {
    setSelectedRole(u.role as 'CLIENT' | 'MANAGER' | 'ADMIN');
    setRoleDialog({ open: true, user: u });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-gray-500">View users and manage their roles</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <p className="text-xs text-gray-500">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.accounts?.total || 0}</div>
            <p className="text-xs text-gray-500">Bank accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage user roles</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Accounts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-xs">
                              {u.profile?.firstName?.charAt(0) || 'U'}
                              {u.profile?.lastName?.charAt(0) || ''}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {u.profile?.firstName} {u.profile?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>{getStatusBadge(u.status || 'ACTIVE')}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{u.accountsCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openRoleDialog(u)}
                          disabled={u.id === user?.id}
                        >
                          <UserCog className="h-3 w-3" />
                          <span className="hidden sm:inline">Change Role</span>
                        </Button>
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

      {/* Change Role Dialog */}
      <Dialog
        open={roleDialog.open}
        onOpenChange={(open) => !open && setRoleDialog({ open: false, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {roleDialog.user?.profile?.firstName} {roleDialog.user?.profile?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Current role: {getRoleBadge(roleDialog.user?.role || 'CLIENT')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Role</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'CLIENT' | 'MANAGER' | 'ADMIN')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {selectedRole === 'ADMIN' && 'Full system access including user management'}
                {selectedRole === 'MANAGER' && 'Can manage loans and assist clients'}
                {selectedRole === 'CLIENT' && 'Standard user with banking features'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                roleDialog.user &&
                updateRoleMutation.mutate({
                  userId: roleDialog.user.id,
                  role: selectedRole,
                })
              }
              disabled={updateRoleMutation.isPending || selectedRole === roleDialog.user?.role}
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
