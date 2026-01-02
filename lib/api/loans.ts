import api from './client';
import { Loan, LoanSchedule } from '@/lib/types';

export interface GrantLoanRequest {
  userId: string;
  accountId: string;
  principal: number;
  annualRate: number;
  durationMonths: number;
  insuranceRate?: number;
}

export const loansApi = {
  grantLoan: async (data: GrantLoanRequest): Promise<Loan> => {
    const response = await api.post('/loans/grant', data);
    return response.data;
  },

  getLoan: async (id: string): Promise<Loan> => {
    const response = await api.get(`/loans/${id}`);
    return response.data;
  },

  getUserLoans: async (userId: string): Promise<Loan[]> => {
    const response = await api.get(`/loans/user/${userId}`);
    return response.data;
  },

  getSchedule: async (loanId: string): Promise<LoanSchedule[]> => {
    const response = await api.get(`/loans/${loanId}/schedule`);
    return response.data;
  },

  calculatePayment: async (data: {
    principal: number;
    annualRate: number;
    durationMonths: number;
    insuranceRate?: number;
  }) => {
    const response = await api.post('/loans/calculate-payment', data);
    return response.data;
  },
};
