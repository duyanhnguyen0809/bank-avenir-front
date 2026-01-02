import api from './client';
import { Notification } from '@/lib/types';

export const notificationsApi = {
  getNotifications: async (userId: string, unreadOnly?: boolean): Promise<Notification[]> => {
    const params = unreadOnly ? { unreadOnly: true } : {};
    const response = await api.get(`/notifications`, { params: { userId, ...params } });
    return response.data;
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const response = await api.get(`/notifications/unread-count`, { params: { userId } });
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await api.post(`/notifications/read-all`, { userId });
  },
};
