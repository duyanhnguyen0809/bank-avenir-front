import api from './client';
import { Loan, LoanSchedule } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockLoansApi } from '@/lib/mock/api';

export interface GrantLoanRequest {
  userId: string;
  accountId: string;
  principal: number;
  annualRate: number;
  durationMonths: number;
  insuranceRate?: number;
}

export interface ApplyLoanRequest {
  userId: string;
  accountId: string;
  type: 'PERSONAL' | 'MORTGAGE' | 'AUTO' | 'STUDENT';
  amount: number;
  termMonths: number;
}

export const loansApi = {
  grantLoan: async (data: GrantLoanRequest): Promise<Loan> => {
    const response = await api.post('/loans/grant', data);
    return response.data;
  },

  applyForLoan: async (data: ApplyLoanRequest): Promise<Loan> => {
    if (USE_MOCK_API) {
      return mockLoansApi.applyForLoan(data);
    }
    const response = await api.post('/loans/apply', data);
    return response.data;
  },

  getLoan: async (id: string): Promise<Loan> => {
    if (USE_MOCK_API) {
      return mockLoansApi.getLoan(id);
    }
    const response = await api.get(`/loans/${id}`);
    return response.data;
  },

  getUserLoans: async (userId: string): Promise<Loan[]> => {
    if (USE_MOCK_API) {
      return mockLoansApi.getUserLoans(userId);
    }
    const response = await api.get(`/loans/user/${userId}`);
    return response.data;
  },

  getSchedule: async (loanId: string): Promise<LoanSchedule[]> => {
    if (USE_MOCK_API) {
      return mockLoansApi.getLoanSchedule(loanId) as unknown as LoanSchedule[];
    }
    const response = await api.get(`/loans/${loanId}/schedule`);
    return response.data;
  },

  calculatePayment: async (data: {
    principal: number;
    annualRate: number;
    durationMonths: number;
    insuranceRate?: number;
  }) => {
    if (USE_MOCK_API) {
      // Simple calculation for mock
      const monthlyRate = data.annualRate / 100 / 12;
      const monthlyPayment = (data.principal * monthlyRate * Math.pow(1 + monthlyRate, data.durationMonths)) /
        (Math.pow(1 + monthlyRate, data.durationMonths) - 1);
      return { monthlyPayment: Number(monthlyPayment.toFixed(2)) };
    }
    const response = await api.post('/loans/calculate-payment', data);
    return response.data;
  },
};
