import api from './client';
import { DashboardStats, User, Loan, Notification } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';

// Shared state for notifications (accessible for testing)
let mockNotifications: Notification[] = [];
let mockPendingLoans: Loan[] = [
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
    applicantName: 'John Doe',
    applicantEmail: 'john@example.com',
  },
  {
    id: 'loan-2',
    userId: '4',
    accountId: 'acc-2',
    amount: 150000,
    interestRate: 0.035,
    insuranceRate: 0.003,
    durationMonths: 240,
    monthlyPayment: 870.25,
    status: 'PENDING',
    createdAt: '2025-01-12T14:30:00Z',
    applicantName: 'Jane Smith',
    applicantEmail: 'jane@example.com',
  },
  {
    id: 'loan-3',
    userId: '5',
    accountId: 'acc-3',
    amount: 50000,
    interestRate: 0.045,
    insuranceRate: 0.004,
    durationMonths: 60,
    monthlyPayment: 940.00,
    status: 'PENDING',
    createdAt: '2025-01-14T09:15:00Z',
    applicantName: 'Bob Johnson',
    applicantEmail: 'bob@example.com',
  },
];

// Export for notification retrieval
export const getMockNotificationsForUser = (userId: string) => {
  return mockNotifications.filter(n => n.userId === userId);
};

// Generate random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock admin API
const mockAdminApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return {
      users: { total: 156 },
      accounts: { total: 312, totalBalance: '2450000' },
      orders: { total: 50, pending: 5 },
      loans: { total: 45, active: 30 },
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
    // Return only pending loans from the shared state
    return mockPendingLoans.filter(l => l.status === 'PENDING');
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
    const loanIndex = mockPendingLoans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) throw new Error('Loan not found');
    
    const loan = mockPendingLoans[loanIndex];
    loan.status = 'APPROVED';
    loan.approvalDate = new Date().toISOString();
    
    // Create notification for the client
    const notification: Notification = {
      id: generateId(),
      userId: loan.userId,
      type: 'LOAN_APPROVED',
      title: '🎉 Loan Approved!',
      message: `Great news! Your loan application for €${loan.amount.toLocaleString()} has been approved. The funds will be disbursed to your account within 2-3 business days.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    mockNotifications.push(notification);

    console.log('📧 Notification sent to client:', notification);

    return loan;
  },

  async rejectLoan(loanId: string): Promise<Loan> {
    const loanIndex = mockPendingLoans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) throw new Error('Loan not found');

    const loan = mockPendingLoans[loanIndex];
    loan.status = 'REJECTED';

    // Create notification for the client
    const notification: Notification = {
      id: generateId(),
      userId: loan.userId,
      type: 'LOAN_REJECTED',
      title: 'Loan Application Update',
      message: `We regret to inform you that your loan application for €${loan.amount.toLocaleString()} has not been approved at this time. Please contact our support team for more information.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    mockNotifications.push(notification);
    
    console.log('📧 Notification sent to client:', notification);
    
    return loan;
  },
};

export const adminApi = {
  // ========== DASHBOARD ==========
  // GET /admin/dashboard - Get platform statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    if (USE_MOCK_API) {
      return mockAdminApi.getDashboardStats();
    }
    const response = await api.get('/admin/dashboard');
    return response.data.stats || response.data;
  },

  // ========== USERS MANAGEMENT ==========
  // GET /admin/users - Get all users
  getAllUsers: async (): Promise<User[]> => {
    if (USE_MOCK_API) {
      return mockAdminApi.getAllUsers();
    }
    const response = await api.get('/admin/users');
    return response.data.users || response.data;
  },

  // PUT /admin/users/:id/role - Update user role (ADMIN only)
  updateUserRole: async (userId: string, role: 'CLIENT' | 'MANAGER' | 'ADMIN'): Promise<User> => {
    if (USE_MOCK_API) {
      return mockAdminApi.updateUserStatus(userId, 'ACTIVE');
    }
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data.user || response.data;
  },

  // ========== LOAN REQUESTS MANAGEMENT ==========
  getPendingLoans: async (): Promise<Loan[]> => {
    if (USE_MOCK_API) {
      return mockAdminApi.getPendingLoans();
    }
    const response = await api.get('/admin/loans/pending');
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

  // ========== SAVINGS RATES (ADMIN ONLY) ==========
  // POST /admin/savings-rate - Create savings rate
  createSavingsRate: async (data: {
    accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
    rate: number;  // Decimal format (e.g., 0.035 for 3.5%)
    minBalance: number;
    effectiveDate: string;  // ISO date string (e.g., "2027-01-01")
  }): Promise<{ message: string; rate: any }> => {
    if (USE_MOCK_API) {
      return { message: 'Savings rate created', rate: { id: Date.now().toString(), ...data } };
    }
    const response = await api.post('/admin/savings-rate', data);
    return response.data;
  },

  // GET /admin/savings-rates - Get all savings rates
  getSavingsRates: async (): Promise<any[]> => {
    if (USE_MOCK_API) {
      return [
        { id: '1', accountType: 'SAVINGS', rate: 0.025, minBalance: 1000, effectiveDate: '2025-01-01' },
        { id: '2', accountType: 'CHECKING', rate: 0.005, minBalance: 0, effectiveDate: '2025-01-01' },
        { id: '3', accountType: 'INVESTMENT', rate: 0.045, minBalance: 5000, effectiveDate: '2025-01-01' },
      ];
    }
    const response = await api.get('/admin/savings-rates');
    return response.data.rates || response.data;
  },

  // ========== SECURITIES/STOCKS (ADMIN ONLY) ==========
  
  // GET /admin/securities - Get all securities (ADMIN + MANAGER)
  getAllSecurities: async () => {
    const response = await api.get('/admin/securities');
    return response.data.securities || response.data;
  },

  // POST /admin/securities - Create a new security
  createSecurity: async (data: {
    symbol: string;
    name: string;
    type: string;
    exchange?: string;
    currentPrice: number;
    currency?: string;
  }) => {
    const response = await api.post('/admin/securities', data);
    return response.data.security || response.data;
  },

  // POST /admin/stocks - Create stock
  createStock: async (data: {
    symbol: string;
    name: string;
    type: string;
    exchange?: string;
    currentPrice: number;
    currency?: string;
  }) => {
    const response = await api.post('/admin/stocks', data);
    return response.data.stock || response.data;
  },

  // PUT /admin/stocks/:symbol/availability - Enable/disable stock
  updateStockAvailability: async (symbol: string, isAvailable: boolean, reason?: string) => {
    const response = await api.put(`/admin/stocks/${symbol}/availability`, { isAvailable, reason });
    return response.data.stock || response.data;
  },

  // DELETE /admin/stocks/:symbol - Delete a stock
  deleteStock: async (symbol: string) => {
    const response = await api.delete(`/admin/stocks/${symbol}`);
    return response.data;
  },
};
