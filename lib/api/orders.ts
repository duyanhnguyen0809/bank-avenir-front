import api from './client';
import { Order, Portfolio, Security } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockOrdersApi, mockSecuritiesApi } from '@/lib/mock/api';

export interface PlaceOrderRequest {
  userId: string;
  accountId: string;
  securityId: string;  // Stock UUID from backend
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}

export interface OrderBook {
  buyOrders: Order[];
  sellOrders: Order[];
  // Also support bid/ask format from some APIs
  bids?: { price: number; quantity: number }[];
  asks?: { price: number; quantity: number }[];
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

  // Get authenticated user's orders
  getMyOrders: async (): Promise<Order[]> => {
    if (USE_MOCK_API) {
      // Mock implementation - return all orders
      return [];
    }
    try {
      const response = await api.get(`/orders/my/orders`);
      return response.data.orders || response.data;
    } catch (error: any) {
      // Fall back to empty list if endpoint doesn't exist
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Get specific user's orders (MANAGER/ADMIN only)
  getUserOrders: async (userId: string): Promise<Order[]> => {
    if (USE_MOCK_API) {
      return mockOrdersApi.getUserOrders(userId);
    }
    const response = await api.get(`/orders/my/orders`);
    return response.data.orders || response.data;
  },

  getOrderBook: async (securityId: string): Promise<OrderBook> => {
    if (USE_MOCK_API) {
      const book = await mockSecuritiesApi.getOrderBook(securityId);
      // Convert bids/asks to buyOrders/sellOrders format
      return {
        buyOrders: [],
        sellOrders: [],
        bids: book.bids,
        asks: book.asks,
      };
    }
    try {
      const response = await api.get(`/orders/security/${securityId}/book`);
      return response.data;
    } catch (error: any) {
      // Fall back to mock if endpoint doesn't exist
      if (error.response?.status === 404) {
        const book = await mockSecuritiesApi.getOrderBook(securityId);
        return {
          buyOrders: [],
          sellOrders: [],
          bids: book.bids,
          asks: book.asks,
        };
      }
      throw error;
    }
  },

  getPortfolio: async (userId: string): Promise<Portfolio[]> => {
    // Backend doesn't have a portfolio endpoint, use mock or calculate from orders
    return mockOrdersApi.getPortfolio(userId) as unknown as Portfolio[];
  },

  getTrades: async (accountId: string) => {
    if (USE_MOCK_API) {
      return []; // Mock returns empty trades
    }
    try {
      const response = await api.get(`/orders/account/${accountId}/trades`);
      return response.data.trades || response.data;
    } catch (error: any) {
      // Fall back to empty if endpoint doesn't exist
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  cancelOrder: async (id: string, userId?: string, reason?: string): Promise<Order> => {
    if (USE_MOCK_API) {
      return mockOrdersApi.cancelOrder(id);
    }
    await api.delete(`/orders/${id}`, {
      data: { userId, reason: reason || 'Cancelled by user' }
    });
    return {} as Order;
  },
};
