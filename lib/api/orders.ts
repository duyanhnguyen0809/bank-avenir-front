import api from './client';
import { Order, Portfolio, Security } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockOrdersApi } from '@/lib/mock/api';

export interface PlaceOrderRequest {
  userId: string;
  accountId: string;
  securityId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}

export interface OrderBook {
  buyOrders: Order[];
  sellOrders: Order[];
}

export const ordersApi = {
  placeOrder: async (data: PlaceOrderRequest): Promise<Order> => {
    if (USE_MOCK_API) {
      return mockOrdersApi.placeOrder(data);
    }
    const response = await api.post('/orders', data);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    if (USE_MOCK_API) {
      return mockOrdersApi.getOrder(id);
    }
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    if (USE_MOCK_API) {
      return mockOrdersApi.getUserOrders(userId);
    }
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  getOrderBook: async (securityId: string): Promise<OrderBook> => {
    const response = await api.get(`/orders/security/${securityId}/book`);
    return response.data;
  },

  getPortfolio: async (userId: string): Promise<Portfolio[]> => {
    if (USE_MOCK_API) {
      return mockOrdersApi.getPortfolio(userId) as unknown as Portfolio[];
    }
    const response = await api.get(`/orders/user/${userId}/portfolio`);
    return response.data;
  },

  getTrades: async (accountId: string) => {
    const response = await api.get(`/orders/account/${accountId}/trades`);
    return response.data;
  },

  cancelOrder: async (id: string): Promise<Order> => {
    if (USE_MOCK_API) {
      return mockOrdersApi.cancelOrder(id);
    }
    await api.delete(`/orders/${id}`);
    return {} as Order;
  },
};
