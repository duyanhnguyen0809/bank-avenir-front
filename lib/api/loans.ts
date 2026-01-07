import api from './client';
import { Loan, LoanRequest, LoanSchedule } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockLoansApi } from '@/lib/mock/api';

export interface GrantLoanRequest {
  userId: string;
  accountId: string;
  principal: number;
  annualRate: number;      // e.g., 0.05 for 5%
  termMonths: number;
  insuranceRate?: number;  // e.g., 0.01 for 1%
}

export interface GrantLoanResponse {
  message: string;
  loanId?: string;
  loan: Loan;
}

export interface RequestLoanRequest {
  accountId: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
}

export interface RequestLoanResponse {
  message: string;
  loanRequestId?: string;
  loanRequest?: LoanRequest;
}

export interface ApplyLoanRequest {
  userId: string;
  accountId: string;
  purpose: 'PERSONAL' | 'MORTGAGE' | 'AUTO' | 'STUDENT';
  requestedAmount: number;
  termMonths: number;
}

export interface CalculatePaymentRequest {
  principal: number;
  annualRate: number;      // e.g., 0.05 for 5%
  termMonths: number;
  insuranceRate?: number;  // e.g., 0.01 for 1%
}

export interface CalculatePaymentResponse {
  monthlyPayment: number;
  monthlyPaymentWithoutInsurance: number;
  monthlyInsurance: number;
  totalAmount: number;
  totalInterest: number;
  totalInsurance: number;
}

export const loansApi = {
  // ===== GRANT LOAN (MANAGER) =====
  // Grant a loan to a client (MANAGER only)
  grantLoan: async (data: GrantLoanRequest): Promise<GrantLoanResponse> => {
    if (USE_MOCK_API) {
      const monthlyRate = data.annualRate / 12;
      const insuranceRate = data.insuranceRate || 0;
      const monthlyPayment = (data.principal * monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) /
        (Math.pow(1 + monthlyRate, data.termMonths) - 1);
      
      return {
        message: 'Loan granted successfully',
        loan: {
          id: `loan-${Date.now()}`,
          userId: data.userId,
          accountId: data.accountId,
          amount: data.principal,
          interestRate: data.annualRate,
          insuranceRate: data.insuranceRate || 0,
          durationMonths: data.termMonths,
          monthlyPayment: monthlyPayment + (data.principal * insuranceRate) / 12,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      };
    }
    const response = await api.post('/loans/grant', data);
    return response.data;
  },

  // ===== LOAN REQUESTS (CLIENT) =====
  // Request a loan (CLIENT only)
  requestLoan: async (data: RequestLoanRequest): Promise<RequestLoanResponse> => {
    if (USE_MOCK_API) {
      const requestId = `req-${Date.now()}`;
      return {
        message: 'Loan request submitted successfully. A manager will review your request soon.',
        loanRequestId: requestId,
        loanRequest: {
          id: requestId,
          userId: 'current-user-id',
          accountId: data.accountId,
          requestedAmount: data.requestedAmount,
          termMonths: data.termMonths,
          purpose: data.purpose,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      };
    }
    const response = await api.post('/loans/request', data);
    return response.data;
  },

  // Get my loan requests (CLIENT)
  getMyLoanRequests: async (): Promise<LoanRequest[]> => {
    if (USE_MOCK_API) {
      return [];
    }
    try {
      const response = await api.get('/loans/my-requests');
      return response.data.requests || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // ===== LOAN MANAGEMENT (MANAGER) =====
  // Get all pending loan requests (MANAGER/ADMIN)
  getPendingRequests: async (): Promise<LoanRequest[]> => {
    if (USE_MOCK_API) {
      return [];
    }
    try {
      const response = await api.get('/loans/requests');
      return response.data.requests || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get specific loan request details
  getLoanRequest: async (requestId: string): Promise<LoanRequest | null> => {
    if (USE_MOCK_API) {
      return null;
    }
    const response = await api.get(`/loans/requests/${requestId}`);
    return response.data.loanRequest || response.data;
  },

  // Assign loan request to manager (creates conversation for chat)
  assignLoanRequest: async (requestId: string): Promise<{ message: string; conversationId?: string }> => {
    if (USE_MOCK_API) {
      return { message: 'Loan request assigned' };
    }
    const response = await api.post(`/loans/requests/${requestId}/assign`);
    return response.data;
  },

  // Approve loan request (creates actual Loan and credits account)
  approveLoanRequest: async (requestId: string, data: {
    approvedAmount: number;
    annualRate: number;
    termMonths: number;
    insuranceRate?: number;
  }): Promise<{ message: string; loanId?: string; loan?: Loan }> => {
    if (USE_MOCK_API) {
      return { message: 'Loan approved' };
    }
    const response = await api.post(`/loans/requests/${requestId}/approve`, data);
    return response.data;
  },

  // Reject loan request
  rejectLoanRequest: async (requestId: string, reason: string): Promise<{ message: string }> => {
    if (USE_MOCK_API) {
      return { message: 'Loan request rejected' };
    }
    const response = await api.post(`/loans/requests/${requestId}/reject`, { reason });
    return response.data;
  },

  // ===== LOAN DETAILS =====
  // Get loan by ID
  getLoan: async (id: string): Promise<Loan> => {
    if (USE_MOCK_API) {
      return mockLoansApi.getLoan(id);
    }
    const response = await api.get(`/loans/${id}`);
    const loan = response.data;
    // Backend returns strings for numeric fields, convert them
    return {
      ...loan,
      amount: Number(loan.amount),
      interestRate: Number(loan.interestRate),
      insuranceRate: Number(loan.insuranceRate),
      monthlyPayment: Number(loan.monthlyPayment),
      account: loan.account ? {
        ...loan.account,
        balance: Number(loan.account.balance),
      } : undefined,
    };
  },

  // Calculate payment for an existing loan
  calculateLoanPayment: async (loanId: string, data: CalculatePaymentRequest): Promise<CalculatePaymentResponse> => {
    if (USE_MOCK_API) {
      // Local calculation for mock mode
      const monthlyRate = data.annualRate / 12;
      const insuranceRate = data.insuranceRate || 0;

      const monthlyPaymentWithoutInsurance = (data.principal * monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) /
        (Math.pow(1 + monthlyRate, data.termMonths) - 1);
      const monthlyInsurance = (data.principal * insuranceRate) / 12;
      const monthlyPayment = monthlyPaymentWithoutInsurance + monthlyInsurance;

      const totalAmount = monthlyPayment * data.termMonths;
      const totalInterest = (monthlyPaymentWithoutInsurance * data.termMonths) - data.principal;
      const totalInsurance = monthlyInsurance * data.termMonths;

      return {
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        monthlyPaymentWithoutInsurance: Number(monthlyPaymentWithoutInsurance.toFixed(2)),
        monthlyInsurance: Number(monthlyInsurance.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        totalInterest: Number(totalInterest.toFixed(2)),
        totalInsurance: Number(totalInsurance.toFixed(2)),
      };
    }
    const response = await api.post(`/loans/${loanId}/calculate-payment`, data);
    return response.data;
  },

  // Get user loans
  getUserLoans: async (userId: string): Promise<Loan[]> => {
    if (USE_MOCK_API) {
      return mockLoansApi.getUserLoans(userId);
    }
    try {
      const response = await api.get(`/loans/user/${userId}`);
      const loans = response.data.loans || response.data;
      // Backend returns strings for numeric fields, convert them
      return loans.map((loan: any) => ({
        ...loan,
        amount: Number(loan.amount),
        interestRate: Number(loan.interestRate),
        insuranceRate: Number(loan.insuranceRate),
        monthlyPayment: Number(loan.monthlyPayment),
        account: loan.account ? {
          ...loan.account,
          balance: Number(loan.account.balance),
        } : undefined,
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get loan payment schedule
  getSchedule: async (loanId: string): Promise<LoanSchedule[]> => {
    if (USE_MOCK_API) {
      return mockLoansApi.getLoanSchedule(loanId) as unknown as LoanSchedule[];
    }
    try {
      const response = await api.get(`/loans/${loanId}/schedule`);
      return response.data.schedules || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Calculate payment for loan parameters
  calculatePayment: async (data: CalculatePaymentRequest): Promise<CalculatePaymentResponse> => {
    // For calculation, try backend first, fall back to local
    if (!USE_MOCK_API) {
      try {
        const response = await api.post(`/loans/calculate-payment/preview`, data);
        return response.data;
      } catch (error) {
        console.warn('Backend payment calculation failed, using local calculation');
      }
    }
    
    // Local calculation for instant preview
    const monthlyRate = data.annualRate / 12;
    const insuranceRate = data.insuranceRate || 0;
    
    const monthlyPaymentWithoutInsurance = (data.principal * monthlyRate * Math.pow(1 + monthlyRate, data.termMonths)) /
      (Math.pow(1 + monthlyRate, data.termMonths) - 1);
    const monthlyInsurance = (data.principal * insuranceRate) / 12;
    const monthlyPayment = monthlyPaymentWithoutInsurance + monthlyInsurance;
    
    const totalAmount = monthlyPayment * data.termMonths;
    const totalInterest = (monthlyPaymentWithoutInsurance * data.termMonths) - data.principal;
    const totalInsurance = monthlyInsurance * data.termMonths;
    
    return {
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      monthlyPaymentWithoutInsurance: Number(monthlyPaymentWithoutInsurance.toFixed(2)),
      monthlyInsurance: Number(monthlyInsurance.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      totalInsurance: Number(totalInsurance.toFixed(2)),
    };
  },

  // Legacy method for backward compatibility
  applyForLoan: async (data: ApplyLoanRequest): Promise<Loan> => {
    if (USE_MOCK_API) {
      return mockLoansApi.applyForLoan(data);
    }
    const response = await api.post('/loans/request', data);
    return response.data;
  },
};
