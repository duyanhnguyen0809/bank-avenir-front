import api from './client';
import { Security } from '@/lib/types';

export interface CreateSecurityRequest {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  currentPrice: number;
}

export const securitiesApi = {
  getSecurities: async (): Promise<Security[]> => {
    const response = await api.get('/admin/securities');
    return response.data;
  },

  getSecurity: async (id: string): Promise<Security> => {
    const response = await api.get(`/admin/securities/${id}`);
    return response.data;
  },

  createSecurity: async (data: CreateSecurityRequest): Promise<Security> => {
    const response = await api.post('/admin/securities', data);
    return response.data;
  },

  updatePrice: async (id: string, price: number): Promise<Security> => {
    const response = await api.put(`/admin/securities/${id}/price`, { price });
    return response.data;
  },
};
