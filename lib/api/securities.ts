import api from './client';
import { Security } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockSecuritiesApi } from '@/lib/mock/api';

export interface CreateSecurityRequest {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currentPrice: number;
}

export const securitiesApi = {
  getSecurities: async (): Promise<Security[]> => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getAllSecurities();
    }
    const response = await api.get('/admin/securities');
    return response.data;
  },

  getSecurity: async (id: string): Promise<Security> => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getSecurity(id);
    }
    const response = await api.get(`/admin/securities/${id}`);
    return response.data;
  },

  searchSecurities: async (query: string): Promise<Security[]> => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.searchSecurities(query);
    }
    const response = await api.get(`/securities/search`, { params: { q: query } });
    return response.data;
  },

  getOrderBook: async (securityId: string) => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getOrderBook(securityId);
    }
    const response = await api.get(`/securities/${securityId}/orderbook`);
    return response.data;
  },

  createSecurity: async (data: CreateSecurityRequest): Promise<Security> => {
    if (USE_MOCK_API) {
      throw new Error('Admin operation not available in mock mode');
    }
    const response = await api.post('/admin/securities', data);
    return response.data;
  },

  updatePrice: async (id: string, price: number): Promise<Security> => {
    if (USE_MOCK_API) {
      throw new Error('Admin operation not available in mock mode');
    }
    const response = await api.put(`/admin/securities/${id}/price`, { price });
    return response.data;
  },
};
