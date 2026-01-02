import api from './client';
import { BankAccount, AccountOperation } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockAccountsApi } from '@/lib/mock/api';

export interface OpenAccountRequest {
  userId: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  initialDeposit: number;
  name?: string;
  currency?: string;
}

export const accountsApi = {
  openAccount: async (data: OpenAccountRequest): Promise<BankAccount> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.openAccount(data);
    }
    const response = await api.post('/accounts/open', data);
    return response.data;
  },

  getAccount: async (id: string): Promise<BankAccount> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.getAccount(id);
    }
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  getUserAccounts: async (userId: string): Promise<BankAccount[]> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.getUserAccounts(userId);
    }
    const response = await api.get(`/accounts/user/${userId}`);
    return response.data;
  },

  getAccountOperations: async (accountId: string): Promise<AccountOperation[]> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.getAccountOperations(accountId) as unknown as AccountOperation[];
    }
    const response = await api.get(`/accounts/${accountId}/operations`);
    return response.data;
  },

  calculateInterest: async (accountId: string): Promise<void> => {
    if (USE_MOCK_API) {
      return; // No-op for mock
    }
    await api.post('/accounts/interest/calculate', { accountId });
  },
};
