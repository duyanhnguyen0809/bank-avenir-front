import api from './client';
import { Conversation, Message, User } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockChatApi } from '@/lib/mock/api';

export const chatApi = {
  // REST API endpoints (matching backend /messages routes)
  getConversationsRest: async (userId: string): Promise<Conversation[]> => {
    const response = await api.get('/messages/conversations', { params: { userId } });
    return response.data;
  },

  getConversationMessagesRest: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  getUnreadMessagesCount: async (userId: string): Promise<{ count: number }> => {
    if (USE_MOCK_API) {
      const convs = await mockChatApi.getConversations(userId);
      const count = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return { count };
    }
    const response = await api.get('/messages/unread', { params: { userId } });
    return response.data;
  },

  // Mock-compatible endpoints (used by current UI)
  getConversations: async (userId: string): Promise<Conversation[]> => {
    if (USE_MOCK_API) {
      return mockChatApi.getConversations(userId);
    }
    const response = await api.get('/messages/conversations', { params: { userId } });
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    if (USE_MOCK_API) {
      const conv = await mockChatApi.getConversation(conversationId);
      if (!conv) throw new Error('Conversation not found');
      return conv;
    }
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    if (USE_MOCK_API) {
      return mockChatApi.getMessages(conversationId);
    }
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  sendMessage: async (data: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
  }): Promise<Message> => {
    if (USE_MOCK_API) {
      return mockChatApi.sendMessage(data);
    }
    const response = await api.post('/chat/messages', data);
    return response.data;
  },

  createConversation: async (data: {
    userId: string;
    recipientId: string;
    initialMessage?: string;
  }): Promise<Conversation> => {
    if (USE_MOCK_API) {
      return mockChatApi.createConversation(data);
    }
    const response = await api.post('/chat/conversations', data);
    return response.data;
  },

  markConversationRead: async (conversationId: string, userId: string): Promise<void> => {
    if (USE_MOCK_API) {
      return mockChatApi.markConversationRead(conversationId, userId);
    }
    await api.put(`/chat/conversations/${conversationId}/read`, { userId });
  },

  getAdvisors: async (): Promise<User[]> => {
    if (USE_MOCK_API) {
      return mockChatApi.getAdvisors();
    }
    const response = await api.get('/chat/advisors');
    return response.data;
  },
};
