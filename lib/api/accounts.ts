import api from './client';
import { BankAccount, AccountOperation, TransferResponse } from '@/lib/types';
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
  // Get all accounts for the authenticated user
  getAllAccounts: async (): Promise<BankAccount[]> => {
    if (USE_MOCK_API) {
      return [];
    }
    try {
      const response = await api.get(`/accounts`);
      return response.data.accounts || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  openAccount: async (data: OpenAccountRequest): Promise<BankAccount> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.openAccount(data);
    }
    const response = await api.post('/accounts/open', data);
    return response.data.account || response.data;
  },

  getAccount: async (id: string): Promise<BankAccount> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.getAccount(id);
    }
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  // Get accounts for a specific user (ADMIN/MANAGER only)
  getUserAccounts: async (userId: string): Promise<BankAccount[]> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.getUserAccounts(userId);
    }
    const response = await api.get(`/accounts/user/${userId}`);
    return response.data.accounts || response.data;
  },

  getAccountOperations: async (accountId: string): Promise<AccountOperation[]> => {
    if (USE_MOCK_API) {
      return mockAccountsApi.getAccountOperations(accountId) as unknown as AccountOperation[];
    }
    try {
      const response = await api.get(`/accounts/${accountId}/operations`);
      return response.data.operations || response.data;
    } catch (error: any) {
      // Operations are returned from GET /accounts/:id, so return empty if separate endpoint fails
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Calculate interest (ADMIN/MANAGER only)
  calculateInterest: async (): Promise<{ message: string; accountsProcessed: number; totalInterestAdded: number }> => {
    if (USE_MOCK_API) {
      return { message: 'Interest calculated', accountsProcessed: 0, totalInterestAdded: 0 };
    }
    const response = await api.post('/accounts/interest/calculate');
    return response.data;
  },

  // Transfer funds between accounts
  transfer: async (data: {
    fromAccountId: string;
    toIban: string;
    amount: number;
    description?: string;
  }): Promise<TransferResponse> => {
    if (USE_MOCK_API) {
      await mockAccountsApi.transfer(data);
      return {
        message: 'Transfer successful',
        transferId: `TRF-${Date.now()}`,
        newBalance: 0,
      };
    }
    const response = await api.post('/accounts/transfer', data);
    return response.data;
  },

  // Rename account
  renameAccount: async (accountId: string, data: {
    newName: string;
    userId: string;
  }): Promise<BankAccount> => {
    if (USE_MOCK_API) {
      const account = await mockAccountsApi.getAccount(accountId);
      account.name = data.newName;
      return account;
    }
    const response = await api.put(`/accounts/${accountId}/rename`, data);
    return response.data.account || response.data;
  },

  // Delete/Close account
  deleteAccount: async (accountId: string, data: {
    userId: string;
    reason?: string;
  }): Promise<void> => {
    if (USE_MOCK_API) {
      return;
    }
    await api.delete(`/accounts/${accountId}`, { data });
  },
};
