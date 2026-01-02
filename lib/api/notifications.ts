import api from './client';
import { Notification } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockNotificationsApi } from '@/lib/mock/api';

export const notificationsApi = {
  getNotifications: async (userId: string, unreadOnly?: boolean): Promise<Notification[]> => {
    if (USE_MOCK_API) {
      const notifications = await mockNotificationsApi.getUserNotifications(userId);
      return unreadOnly ? notifications.filter(n => !n.read) : notifications;
    }
    const params = unreadOnly ? { unreadOnly: true } : {};
    const response = await api.get(`/notifications`, { params: { userId, ...params } });
    return response.data;
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    if (USE_MOCK_API) {
      return mockNotificationsApi.getUnreadCount(userId);
    }
    const response = await api.get(`/notifications/unread-count`, { params: { userId } });
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    if (USE_MOCK_API) {
      await mockNotificationsApi.markAsRead(id);
      return;
    }
    await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    if (USE_MOCK_API) {
      await mockNotificationsApi.markAllAsRead(userId);
      return;
    }
    await api.post(`/notifications/read-all`, { userId });
  },
};
