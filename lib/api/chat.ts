import api from './client';
import { Conversation, Message, User } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockChatApi } from '@/lib/mock/api';

export const chatApi = {
  getConversations: async (userId: string): Promise<Conversation[]> => {
    if (USE_MOCK_API) {
      return mockChatApi.getConversations(userId);
    }
    const response = await api.get(`/chat/conversations/${userId}`);
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    if (USE_MOCK_API) {
      const conv = await mockChatApi.getConversation(conversationId);
      if (!conv) throw new Error('Conversation not found');
      return conv;
    }
    const response = await api.get(`/chat/conversations/detail/${conversationId}`);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    if (USE_MOCK_API) {
      return mockChatApi.getMessages(conversationId);
    }
    const response = await api.get(`/chat/messages/${conversationId}`);
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
