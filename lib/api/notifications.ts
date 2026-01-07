import api from './client';
import { Notification } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockNotificationsApi } from '@/lib/mock/api';

export const notificationsApi = {
  // GET /notifications?userId={{userId}} - Get all notifications
  // GET /notifications?userId={{userId}}&unreadOnly=true - Get unread only
  getNotifications: async (userId: string, unreadOnly?: boolean): Promise<Notification[]> => {
    if (USE_MOCK_API) {
      const notifications = await mockNotificationsApi.getUserNotifications(userId);
      return unreadOnly ? notifications.filter(n => !n.isRead) : notifications;
    }
    const params: Record<string, string | boolean> = { userId };
    if (unreadOnly) params.unreadOnly = true;
    const response = await api.get(`/notifications`, { params });
    return response.data;
  },

  // GET /notifications/unread-count?userId={{userId}} - Get unread count
  getUnreadCount: async (userId: string): Promise<number> => {
    if (USE_MOCK_API) {
      return mockNotificationsApi.getUnreadCount(userId);
    }
    const response = await api.get(`/notifications/unread-count`, { params: { userId } });
    return response.data.count ?? response.data;
  },

  // POST /notifications/:id/read - Mark single notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    if (USE_MOCK_API) {
      await mockNotificationsApi.markAsRead(notificationId);
      return;
    }
    await api.post(`/notifications/${notificationId}/read`);
  },

  // POST /notifications/read-all?userId={{userId}} - Mark all as read
  markAllAsRead: async (userId: string): Promise<void> => {
    if (USE_MOCK_API) {
      await mockNotificationsApi.markAllAsRead(userId);
      return;
    }
    await api.post(`/notifications/read-all`, null, { params: { userId } });
  },
};
