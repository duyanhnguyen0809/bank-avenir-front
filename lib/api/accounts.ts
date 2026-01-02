import api from './client';
import { BankAccount, AccountOperation } from '@/lib/types';

export interface OpenAccountRequest {
  userId: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  initialDeposit: number;
  name?: string;
  currency?: string;
}

export const accountsApi = {
  openAccount: async (data: OpenAccountRequest): Promise<BankAccount> => {
    const response = await api.post('/accounts/open', data);
    return response.data;
  },

  getAccount: async (id: string): Promise<BankAccount> => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  getUserAccounts: async (userId: string): Promise<BankAccount[]> => {
    const response = await api.get(`/accounts/user/${userId}`);
    return response.data;
  },

  getAccountOperations: async (accountId: string): Promise<AccountOperation[]> => {
    const response = await api.get(`/accounts/${accountId}/operations`);
    return response.data;
  },

  calculateInterest: async (accountId: string): Promise<void> => {
    await api.post('/accounts/interest/calculate', { accountId });
  },
};
