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
  currency?: string;
}

export const securitiesApi = {
  // Get all available stocks (public endpoint)
  getSecurities: async (): Promise<Security[]> => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getAllSecurities();
    }
    try {
      const response = await api.get('/stocks');
      return response.data.stocks || response.data;
    } catch (error: any) {
      // Fall back to mock if endpoint doesn't exist
      if (error.response?.status === 404) {
        console.warn('GET /stocks endpoint not found, using mock data');
        return mockSecuritiesApi.getAllSecurities();
      }
      throw error;
    }
  },

  // Get stock details by symbol
  getSecurity: async (symbol: string): Promise<Security> => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getSecurity(symbol);
    }
    try {
      const response = await api.get(`/stocks/${symbol}`);
      return response.data;
    } catch (error: any) {
      // Fall back to mock if endpoint doesn't exist
      if (error.response?.status === 404) {
        return mockSecuritiesApi.getSecurity(symbol);
      }
      throw error;
    }
  },

  // Search stocks
  searchSecurities: async (query: string): Promise<Security[]> => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.searchSecurities(query);
    }
    const response = await api.get(`/stocks/search`, { params: { q: query } });
    return response.data;
  },

  // Get stock order book by symbol
  getOrderBook: async (symbol: string) => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getOrderBook(symbol);
    }
    try {
      const response = await api.get(`/stocks/${symbol}/orderbook`);
      return response.data;
    } catch (error: any) {
      // Fall back to mock if endpoint doesn't exist
      if (error.response?.status === 404) {
        return mockSecuritiesApi.getOrderBook(symbol);
      }
      throw error;
    }
  },

  // Get stock statistics
  getStockStats: async (symbol: string) => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getSecurity(symbol);
    }
    try {
      const response = await api.get(`/stocks/${symbol}/stats`);
      return response.data;
    } catch (error: any) {
      // Fall back to mock if endpoint doesn't exist
      if (error.response?.status === 404) {
        return mockSecuritiesApi.getSecurity(symbol);
      }
      throw error;
    }
  },

  // ADMIN ONLY: Create security
  createSecurity: async (data: CreateSecurityRequest): Promise<Security> => {
    if (USE_MOCK_API) {
      throw new Error('Admin operation not available in mock mode');
    }
    const response = await api.post('/admin/securities', data);
    return response.data;
  },

  // ADMIN ONLY: Get all securities (admin view)
  getAllSecurities: async (): Promise<Security[]> => {
    if (USE_MOCK_API) {
      return mockSecuritiesApi.getAllSecurities();
    }
    try {
      const response = await api.get('/admin/securities');
      return response.data.securities || response.data;
    } catch (error: any) {
      // If 403 (not admin), fall back to mock securities for trading
      if (error.response?.status === 403) {
        console.warn('Admin securities access denied, using mock data');
        return mockSecuritiesApi.getAllSecurities();
      }
      throw error;
    }
  },

  // ADMIN ONLY: Update stock availability
  updateStockAvailability: async (symbol: string, isAvailable: boolean, reason?: string): Promise<Security> => {
    if (USE_MOCK_API) {
      throw new Error('Admin operation not available in mock mode');
    }
    const response = await api.put(`/admin/stocks/${symbol}/availability`, {
      isAvailable,
      reason,
    });
    return response.data;
  },

  // ADMIN ONLY: Delete stock
  deleteStock: async (symbol: string): Promise<void> => {
    if (USE_MOCK_API) {
      throw new Error('Admin operation not available in mock mode');
    }
    await api.delete(`/admin/stocks/${symbol}`);
  },

  // ADMIN ONLY: Update price
  updatePrice: async (id: string, price: number): Promise<Security> => {
    if (USE_MOCK_API) {
      throw new Error('Admin operation not available in mock mode');
    }
    const response = await api.put(`/admin/securities/${id}/price`, { price });
    return response.data;
  },
};
