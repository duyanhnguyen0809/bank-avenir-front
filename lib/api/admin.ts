import api from './client';
import { DashboardStats, User, Loan } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';

// Mock admin API
const mockAdminApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return {
      totalUsers: 156,
      totalAccounts: 312,
      activeLoans: 45,
      totalDeposits: 2450000,
      totalLoanAmount: 890000,
    };
  },

  async getAllUsers(): Promise<User[]> {
    return [
      {
        id: '1',
        email: 'john@example.com',
        role: 'CLIENT',
        status: 'ACTIVE',
        emailConfirmed: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+33 6 12 34 56 78',
          address: '123 Main Street, Paris',
          dateOfBirth: '1990-05-15',
        },
      },
      {
        id: '2',
        email: 'jane@example.com',
        role: 'CLIENT',
        status: 'ACTIVE',
        emailConfirmed: true,
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+33 6 98 76 54 32',
          address: '456 Oak Avenue, Lyon',
          dateOfBirth: '1988-08-22',
        },
      },
      {
        id: '3',
        email: 'bob@example.com',
        role: 'CLIENT',
        status: 'SUSPENDED',
        emailConfirmed: false,
        profile: {
          firstName: 'Bob',
          lastName: 'Johnson',
          phone: '+33 6 11 22 33 44',
          address: '789 Pine Road, Marseille',
          dateOfBirth: '1995-03-10',
        },
      },
    ];
  },

  async getPendingLoans(): Promise<Loan[]> {
    return [
      {
        id: 'loan-1',
        userId: '1',
        accountId: 'acc-1',
        amount: 25000,
        interestRate: 0.055,
        insuranceRate: 0.005,
        durationMonths: 36,
        monthlyPayment: 752.50,
        status: 'PENDING',
        createdAt: '2025-01-10T10:00:00Z',
      },
      {
        id: 'loan-2',
        userId: '2',
        accountId: 'acc-2',
        amount: 150000,
        interestRate: 0.035,
        insuranceRate: 0.003,
        durationMonths: 240,
        monthlyPayment: 870.25,
        status: 'PENDING',
        createdAt: '2025-01-12T14:30:00Z',
      },
    ];
  },

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'): Promise<User> {
    return {
      id: userId,
      email: 'updated@example.com',
      role: 'CLIENT',
      status,
      emailConfirmed: true,
      profile: { firstName: 'Updated', lastName: 'User' },
    };
  },

  async approveLoan(loanId: string): Promise<Loan> {
    return {
      id: loanId,
      userId: '1',
      accountId: 'acc-1',
      amount: 25000,
      interestRate: 0.055,
      insuranceRate: 0.005,
      durationMonths: 36,
      monthlyPayment: 752.50,
      status: 'APPROVED',
      createdAt: '2025-01-10T10:00:00Z',
      approvalDate: new Date().toISOString(),
    };
  },

  async rejectLoan(loanId: string): Promise<Loan> {
    return {
      id: loanId,
      userId: '1',
      accountId: 'acc-1',
      amount: 25000,
      interestRate: 0.055,
      insuranceRate: 0.005,
      durationMonths: 36,
      monthlyPayment: 752.50,
      status: 'REJECTED',
      createdAt: '2025-01-10T10:00:00Z',
    };
  },
};

export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    if (USE_MOCK_API) {
      return mockAdminApi.getDashboardStats();
    }
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    if (USE_MOCK_API) {
      return mockAdminApi.getAllUsers();
    }
    const response = await api.get('/admin/users');
    return response.data;
  },

  getPendingLoans: async (): Promise<Loan[]> => {
    if (USE_MOCK_API) {
      return mockAdminApi.getPendingLoans();
    }
    const response = await api.get('/admin/loans/pending');
    return response.data;
  },

  updateUserStatus: async (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'): Promise<User> => {
    if (USE_MOCK_API) {
      return mockAdminApi.updateUserStatus(userId, status);
    }
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  approveLoan: async (loanId: string): Promise<Loan> => {
    if (USE_MOCK_API) {
      return mockAdminApi.approveLoan(loanId);
    }
    const response = await api.post(`/admin/loans/${loanId}/approve`);
    return response.data;
  },

  rejectLoan: async (loanId: string): Promise<Loan> => {
    if (USE_MOCK_API) {
      return mockAdminApi.rejectLoan(loanId);
    }
    const response = await api.post(`/admin/loans/${loanId}/reject`);
    return response.data;
  },

  updateUserRole: async (userId: string, role: 'CLIENT' | 'MANAGER' | 'ADMIN'): Promise<User> => {
    if (USE_MOCK_API) {
      return mockAdminApi.updateUserStatus(userId, 'ACTIVE'); // Mock fallback
    }
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  createSavingsRate: async (data: {
    accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
    rate: number;
    minBalance: number;
    effectiveDate: string;
  }): Promise<void> => {
    if (USE_MOCK_API) {
      return; // No-op for mock
    }
    await api.post('/admin/savings-rate', data);
  },

  getSavingsRates: async (): Promise<Array<{
    id: string;
    accountType: string;
    rate: number;
    minBalance: number;
    effectiveDate: string;
  }>> => {
    if (USE_MOCK_API) {
      return [
        { id: '1', accountType: 'SAVINGS', rate: 0.025, minBalance: 1000, effectiveDate: '2026-01-01' },
        { id: '2', accountType: 'CHECKING', rate: 0.005, minBalance: 0, effectiveDate: '2026-01-01' },
      ];
    }
    const response = await api.get('/admin/savings-rates');
    return response.data;
  },
};
