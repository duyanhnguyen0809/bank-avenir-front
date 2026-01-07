'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { loansApi } from '@/lib/api/loans';
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
  DollarSign,
  Plus,
  ArrowLeft,
  Check,
  X,
  Clock,
  Users,
  UserCheck,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { LoanRequest, LoanRequestStatus, User } from '@/lib/types';

export default function AdvisorLoansPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalData, setApprovalData] = useState({
    approvedAmount: 0,
    annualRate: 0.05,
    termMonths: 24,
    insuranceRate: 0.005,
  });
  const [newLoan, setNewLoan] = useState({
    userId: '',
    accountId: '',
    principal: 10000,
    annualRate: 0.05,
    termMonths: 24,
    insuranceRate: 0.005,
  });

  // Redirect non-manager users
  if (user && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch loan requests using the correct API
  const { data: loanRequests, isLoading: loansLoading } = useQuery({
    queryKey: ['loanRequests'],
    queryFn: () => loansApi.getPendingRequests(),
  });

  const { data: users } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getAllUsers(),
  });

  // Filter to only clients
  const clients = users?.filter((u: User) => u.role === 'CLIENT') || [];

  // Create a user lookup map for displaying applicant info
  const userMap = new Map<string, User>();
  users?.forEach((u: User) => userMap.set(u.id, u));

  // Helper to get user info from userId
  const getUserInfo = (userId: string) => {
    const u = userMap.get(userId);
    if (u) {
      return {
        name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || 'Unknown',
        email: u.email,
      };
    }
    return { name: 'Unknown', email: '' };
  };

  // Assign loan request to manager
  const assignMutation = useMutation({
    mutationFn: (requestId: string) => loansApi.assignLoanRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      toast.success('Loan request assigned to you!');
    },
    onError: () => {
      toast.error('Failed to assign loan request');
    },
  });

  // Approve loan request with parameters
  const approveMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: typeof approvalData }) =>
      loansApi.approveLoanRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      toast.success('Loan approved successfully! Client has been notified.');
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error('Failed to approve loan');
    },
  });

  // Reject loan request with reason
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      loansApi.rejectLoanRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      toast.success('Loan rejected. Client has been notified.');
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: () => {
      toast.error('Failed to reject loan');
    },
  });

  const grantMutation = useMutation({
    mutationFn: (data: typeof newLoan) => loansApi.grantLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      toast.success('Loan granted successfully!');
      setIsGrantDialogOpen(false);
      setNewLoan({
        userId: '',
        accountId: '',
        principal: 10000,
        annualRate: 0.05,
        termMonths: 24,
        insuranceRate: 0.005,
      });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to grant loan');
    },
  });

  const handleUserSelect = (userId: string) => {
    const selected = clients.find((c: User) => c.id === userId);
    setSelectedUser(selected || null);
    setNewLoan({ ...newLoan, userId, accountId: '' });
  };

  const openApproveDialog = (request: LoanRequest) => {
    setSelectedRequest(request);
    setApprovalData({
      approvedAmount: Number(request.requestedAmount),
      annualRate: 0.05,
      termMonths: request.termMonths,
      insuranceRate: 0.005,
    });
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (request: LoanRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const getStatusBadge = (status: LoanRequestStatus) => {
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate monthly payment preview
  const calculateMonthlyPayment = (principal: number, annualRate: number, termMonths: number, insuranceRate: number) => {
    const monthlyRate = annualRate / 12;
    const basePayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    const insurance = (principal * (insuranceRate || 0)) / 12;
    return basePayment + insurance;
  };

  // Stats
  const pendingCount = loanRequests?.filter((r: LoanRequest) => r.status === 'PENDING').length || 0;
  const assignedCount = loanRequests?.filter((r: LoanRequest) => r.status === 'ASSIGNED').length || 0;
  const totalRequestedValue = loanRequests?.reduce((sum: number, r: LoanRequest) => sum + Number(r.requestedAmount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/advisor">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loan Management</h1>
          <p className="text-gray-500">Review pending applications and grant new loans</p>
        </div>
        <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Grant New Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Grant a New Loan</DialogTitle>
              <DialogDescription>
                Create a loan directly for a client
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select
                  value={newLoan.userId}
                  onValueChange={handleUserSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c: User) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.profile?.firstName} {c.profile?.lastName} ({c.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="space-y-2">
                  <Label>Disbursement Account</Label>
                  <Select
                    value={newLoan.accountId}
                    onValueChange={(value) => setNewLoan({ ...newLoan, accountId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Principal Amount (EUR)</Label>
                  <Input
                    type="number"
                    value={newLoan.principal}
                    onChange={(e) => setNewLoan({ ...newLoan, principal: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Term (months)</Label>
                  <Input
                    type="number"
                    value={newLoan.termMonths}
                    onChange={(e) => setNewLoan({ ...newLoan, termMonths: parseInt(e.target.value) || 12 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={(newLoan.annualRate * 100).toFixed(1)}
                    onChange={(e) => setNewLoan({ ...newLoan, annualRate: (parseFloat(e.target.value) || 0) / 100 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Insurance Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={((newLoan.insuranceRate || 0) * 100).toFixed(1)}
                    onChange={(e) => setNewLoan({ ...newLoan, insuranceRate: (parseFloat(e.target.value) || 0) / 100 })}
                  />
                </div>
              </div>

              {newLoan.principal > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Monthly Payment Preview:</strong>{' '}
                    {formatCurrency(calculateMonthlyPayment(newLoan.principal, newLoan.annualRate, newLoan.termMonths, newLoan.insuranceRate), 'EUR')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Total: {formatCurrency(calculateMonthlyPayment(newLoan.principal, newLoan.annualRate, newLoan.termMonths, newLoan.insuranceRate) * newLoan.termMonths, 'EUR')}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => grantMutation.mutate(newLoan)}
                disabled={!newLoan.userId || !newLoan.principal}
              >
                Grant Loan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-gray-500">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assigned</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedCount}</div>
            <p className="text-xs text-gray-500">Being processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requested</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRequestedValue, 'EUR')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Requests</CardTitle>
          <CardDescription>Review, assign, approve or reject loan requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loansLoading ? (
            <div className="text-center py-8 text-gray-500">Loading loan requests...</div>
          ) : loanRequests && loanRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanRequests.map((request: LoanRequest) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {request.user?.profile?.firstName
                            ? `${request.user.profile.firstName} ${request.user.profile.lastName || ''}`
                            : getUserInfo(request.userId).name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.user?.email || getUserInfo(request.userId).email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(Number(request.requestedAmount), 'EUR')}
                    </TableCell>
                    <TableCell>{request.termMonths} months</TableCell>
                    <TableCell className="max-w-37.5 truncate">{request.purpose}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm">
                      {request.managerId ? (
                        request.managerId === user?.id ? (
                          <span className="text-purple-700 font-medium">
                            Me ({user?.profile?.firstName || 'Manager'})
                          </span>
                        ) : (
                          <span className="text-gray-600">
                            {getUserInfo(request.managerId).name}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Show Assign button only for PENDING requests not assigned to anyone */}
                        {request.status === 'PENDING' && !request.managerId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignMutation.mutate(request.id)}
                            disabled={assignMutation.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Assign to me
                          </Button>
                        )}
                        {/* Show Approve/Reject only for requests assigned to current manager */}
                        {request.status === 'ASSIGNED' && request.managerId === user?.id && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openApproveDialog(request)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(request)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No pending loan requests
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Loan Request</DialogTitle>
            <DialogDescription>
              Set the loan terms for approval. The loan will be created and funds disbursed to the client's account.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm"><strong>Requested Amount:</strong> {formatCurrency(Number(selectedRequest.requestedAmount), 'EUR')}</p>
                <p className="text-sm"><strong>Requested Term:</strong> {selectedRequest.termMonths} months</p>
                <p className="text-sm"><strong>Purpose:</strong> {selectedRequest.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Approved Amount (EUR)</Label>
                  <Input
                    type="number"
                    value={approvalData.approvedAmount}
                    onChange={(e) => setApprovalData({ ...approvalData, approvedAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Term (months)</Label>
                  <Input
                    type="number"
                    value={approvalData.termMonths}
                    onChange={(e) => setApprovalData({ ...approvalData, termMonths: parseInt(e.target.value) || 12 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={(approvalData.annualRate * 100).toFixed(1)}
                    onChange={(e) => setApprovalData({ ...approvalData, annualRate: (parseFloat(e.target.value) || 0) / 100 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Insurance Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={((approvalData.insuranceRate || 0) * 100).toFixed(1)}
                    onChange={(e) => setApprovalData({ ...approvalData, insuranceRate: (parseFloat(e.target.value) || 0) / 100 })}
                  />
                </div>
              </div>

              {approvalData.approvedAmount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Monthly Payment:</strong>{' '}
                    {formatCurrency(calculateMonthlyPayment(approvalData.approvedAmount, approvalData.annualRate, approvalData.termMonths, approvalData.insuranceRate), 'EUR')}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Total Repayment: {formatCurrency(calculateMonthlyPayment(approvalData.approvedAmount, approvalData.annualRate, approvalData.termMonths, approvalData.insuranceRate) * approvalData.termMonths, 'EUR')}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedRequest && approveMutation.mutate({ requestId: selectedRequest.id, data: approvalData })}
              disabled={!approvalData.approvedAmount || approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve Loan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this loan request. The client will be notified.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm"><strong>Amount:</strong> {formatCurrency(Number(selectedRequest.requestedAmount), 'EUR')}</p>
                <p className="text-sm"><strong>Purpose:</strong> {selectedRequest.purpose}</p>
              </div>

              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter the reason for rejection..."
                  value={rejectReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectReason })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
