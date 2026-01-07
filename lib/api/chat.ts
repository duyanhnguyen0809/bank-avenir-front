import api from './client';
import { Conversation, Message, User } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';
import { mockChatApi } from '@/lib/mock/api';

// Helper to transform backend conversation to frontend format
const transformConversation = (conv: any): Conversation => {
  const participants: User[] = [];
  
  // Backend returns `otherUser` object with id, name, role
  if (conv.otherUser) {
    const nameParts = (conv.otherUser.name || '').split(' ');
    participants.push({
      id: conv.otherUser.id,
      email: '',
      role: conv.otherUser.role || 'CLIENT',
      profile: {
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || '',
      },
    } as User);
  }
  
  // Also check for legacy formats (clientId/advisorId or participants array)
  if (participants.length === 0 && conv.participants?.length > 0) {
    return { ...conv };
  }
  
  if (participants.length === 0) {
    // Fallback to clientId/advisorId format
    if (conv.clientId) {
      const clientName = conv.clientName || conv.lastMessage?.senderName || '';
      const nameParts = clientName.split(' ');
      participants.push({
        id: conv.clientId,
        email: '',
        role: 'CLIENT',
        profile: {
          firstName: nameParts[0] || 'Client',
          lastName: nameParts.slice(1).join(' ') || '',
        },
      } as User);
    }
    if (conv.advisorId) {
      const advisorName = conv.advisorName || '';
      const nameParts = advisorName.split(' ');
      participants.push({
        id: conv.advisorId,
        email: '',
        role: 'MANAGER',
        profile: {
          firstName: nameParts[0] || 'Advisor',
          lastName: nameParts.slice(1).join(' ') || '',
        },
      } as User);
    }
  }
  
  return {
    ...conv,
    participants,
    // Store otherUser info for easy access
    otherUser: conv.otherUser,
  };
};

export const chatApi = {
  // ========== REST API Endpoints (matching backend /messages routes) ==========
  
  // GET /messages/conversations?userId={userId}
  getConversations: async (userId: string): Promise<Conversation[]> => {
    if (USE_MOCK_API) {
      return mockChatApi.getConversations(userId);
    }
    const response = await api.get('/messages/conversations', { params: { userId } });
    // Transform each conversation to ensure participants are populated
    return (response.data || []).map(transformConversation);
  },

  // GET /messages/conversations/:conversationId
  getMessages: async (conversationId: string): Promise<Message[]> => {
    if (USE_MOCK_API) {
      return mockChatApi.getMessages(conversationId);
    }
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  // GET /messages/unread?userId={userId}
  getUnreadCount: async (userId: string): Promise<{ count: number }> => {
    if (USE_MOCK_API) {
      const convs = await mockChatApi.getConversations(userId);
      const count = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return { count };
    }
    const response = await api.get('/messages/unread', { params: { userId } });
    return response.data;
  },

  // ========== Mock-only endpoints (not available in backend REST API) ==========
  
  // Get single conversation details
  getConversation: async (conversationId: string): Promise<Conversation> => {
    if (USE_MOCK_API) {
      const conv = await mockChatApi.getConversation(conversationId);
      if (!conv) throw new Error('Conversation not found');
      return conv;
    }
    // Backend returns messages, we need to construct conversation from it
    const response = await api.get(`/messages/conversations/${conversationId}`);
    const messages = response.data as Message[];
    // Return a minimal conversation object
    return {
      id: conversationId,
      participants: [],
      lastMessage: messages[messages.length - 1],
      unreadCount: 0,
      createdAt: messages[0]?.createdAt || new Date().toISOString(),
    };
  },

  // Send message (use WebSocket private_message instead for real-time)
  sendMessage: async (data: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
  }): Promise<Message> => {
    // Always use mock - real backend uses WebSocket for messages
    return mockChatApi.sendMessage(data);
  },

  // Create conversation (use WebSocket request_help for client->advisor)
  createConversation: async (data: {
    userId: string;
    recipientId: string;
    initialMessage?: string;
  }): Promise<Conversation> => {
    // Always use mock - real backend creates conversations via WebSocket
    return mockChatApi.createConversation(data);
  },

  // Mark conversation as read (use WebSocket mark_read)
  markConversationRead: async (conversationId: string, userId: string): Promise<void> => {
    if (USE_MOCK_API) {
      return mockChatApi.markConversationRead(conversationId, userId);
    }
    // For real backend, this is handled via WebSocket mark_read event
    // Import and use the service here would cause circular dependency
    // So we just no-op and let the WebSocket handle it
  },

  // Get advisors list (not available in backend, use mock)
  getAdvisors: async (): Promise<User[]> => {
    // Backend doesn't have a /chat/advisors endpoint
    return mockChatApi.getAdvisors();
  },

  // Legacy aliases
  getConversationsRest: async (userId: string): Promise<Conversation[]> => {
    return chatApi.getConversations(userId);
  },

  getConversationMessagesRest: async (conversationId: string): Promise<Message[]> => {
    return chatApi.getMessages(conversationId);
  },

  getUnreadMessagesCount: async (userId: string): Promise<{ count: number }> => {
    return chatApi.getUnreadCount(userId);
  },
};
