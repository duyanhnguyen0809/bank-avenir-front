import api from './client';
import { Order, Portfolio, Security } from '@/lib/types';

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
    const response = await api.post('/orders', data);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  getOrderBook: async (securityId: string): Promise<OrderBook> => {
    const response = await api.get(`/orders/security/${securityId}/book`);
    return response.data;
  },

  getPortfolio: async (accountId: string): Promise<Portfolio[]> => {
    const response = await api.get(`/orders/account/${accountId}/portfolio`);
    return response.data;
  },

  getTrades: async (accountId: string) => {
    const response = await api.get(`/orders/account/${accountId}/trades`);
    return response.data;
  },

  cancelOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};
