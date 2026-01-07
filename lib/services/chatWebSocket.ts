import { io, Socket } from 'socket.io-client';
import { Message } from '@/lib/types';

// Types matching backend WebSocket events
interface NewMessagePayload {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface HelpRequestBroadcastPayload {
  conversationId: string;
  clientId: string;
  clientName: string;
  content: string;
  createdAt: string;
}

interface AdvisorAssignedPayload {
  conversationId: string;
  advisorId: string;
  advisorName: string;
  message: string;
}

interface HelpRequestTakenPayload {
  conversationId: string;
  advisorId: string;
}

interface ConversationTransferredPayload {
  conversationId: string;
  clientId: string;
  clientName: string;
  fromAdvisor: string;
  reason?: string;
}

interface AdvisorChangedPayload {
  conversationId: string;
  newAdvisorId: string;
  newAdvisorName: string;
  previousAdvisorName: string;
  reason?: string;
}

type MessageCallback = (message: NewMessagePayload) => void;
type HelpRequestCallback = (data: HelpRequestBroadcastPayload) => void;
type AdvisorAssignedCallback = (data: AdvisorAssignedPayload) => void;
type HelpRequestTakenCallback = (data: HelpRequestTakenPayload) => void;
type ConversationTransferredCallback = (data: ConversationTransferredPayload) => void;
type AdvisorChangedCallback = (data: AdvisorChangedPayload) => void;

class ChatWebSocketService {
  private socket: Socket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private helpRequestCallbacks: HelpRequestCallback[] = [];
  private advisorAssignedCallbacks: AdvisorAssignedCallback[] = [];
  private helpRequestTakenCallbacks: HelpRequestTakenCallback[] = [];
  private conversationTransferredCallbacks: ConversationTransferredCallback[] = [];
  private advisorChangedCallbacks: AdvisorChangedCallback[] = [];

  connect(userId: string): Socket {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://127.0.0.1:4000';
    
    this.socket = io(`${baseUrl}/chat`, {
      query: { userId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected to', baseUrl);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Listen for new_message
    this.socket.on('new_message', (data: NewMessagePayload) => {
      console.log('Received new_message:', data);
      this.messageCallbacks.forEach(cb => cb(data));
    });

    // Listen for help_request_broadcast (sent to all advisors when client has no assigned advisor)
    this.socket.on('help_request_broadcast', (data: HelpRequestBroadcastPayload) => {
      console.log('Received help_request_broadcast:', data);
      this.helpRequestCallbacks.forEach(cb => cb(data));
    });

    // Listen for help_request (sent to assigned advisor when their client sends a new request)
    this.socket.on('help_request', (data: HelpRequestBroadcastPayload) => {
      console.log('Received help_request:', data);
      this.helpRequestCallbacks.forEach(cb => cb(data));
    });

    // Listen for advisor_assigned (client receives when advisor accepts)
    this.socket.on('advisor_assigned', (data: AdvisorAssignedPayload) => {
      console.log('Received advisor_assigned:', data);
      this.advisorAssignedCallbacks.forEach(cb => cb(data));
    });

    // Listen for help_request_taken (other advisors receive when one accepts)
    this.socket.on('help_request_taken', (data: HelpRequestTakenPayload) => {
      console.log('Received help_request_taken:', data);
      this.helpRequestTakenCallbacks.forEach(cb => cb(data));
    });

    // Listen for conversation_transferred_to_you (new advisor receives)
    this.socket.on('conversation_transferred_to_you', (data: ConversationTransferredPayload) => {
      console.log('Received conversation_transferred_to_you:', data);
      this.conversationTransferredCallbacks.forEach(cb => cb(data));
    });

    // Listen for advisor_changed (client receives when transferred)
    this.socket.on('advisor_changed', (data: AdvisorChangedPayload) => {
      console.log('Received advisor_changed:', data);
      this.advisorChangedCallbacks.forEach(cb => cb(data));
    });

    return this.socket;
  }

  // Emit: private_message (Advisor → Client)
  sendMessage(receiverId: string, content: string, conversationId?: string): Promise<{ success: boolean; message?: Message }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      const payload: { receiverId: string; content: string; conversationId?: string } = { receiverId, content };
      if (conversationId) {
        payload.conversationId = conversationId;
      }

      console.log('📤 Sending private_message:', payload);

      // Emit with optional acknowledgment callback
      this.socket.emit('private_message', payload, (response?: { success: boolean; message?: Message; error?: string }) => {
        // If backend sends acknowledgment
        if (response) {
          console.log('📥 private_message response:', response);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to send message'));
          }
        } else {
          // If no acknowledgment, assume success (fire and forget)
          resolve({ success: true });
        }
      });

      // Fallback timeout - resolve if no response within 5 seconds
      setTimeout(() => resolve({ success: true }), 5000);
    });
  }

  // Emit: request_help (Client → Advisor)
  requestHelp(content: string): Promise<{ success: boolean; conversationId?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('request_help', { content }, (response?: { success: boolean; conversationId?: string; error?: string }) => {
        if (response) {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to request help'));
          }
        } else {
          resolve({ success: true });
        }
      });

      // Fallback timeout
      setTimeout(() => resolve({ success: true }), 5000);
    });
  }

  // Emit: accept_help (Advisor accepts client help request)
  acceptHelp(conversationId: string, clientId: string, message?: string): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('accept_help', { 
        conversationId, 
        clientId, 
        message: message || 'An advisor is now assisting you.' 
      }, (response?: { success: boolean; error?: string }) => {
        if (response) {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to accept help'));
          }
        } else {
          resolve({ success: true });
        }
      });

      // Fallback timeout
      setTimeout(() => resolve({ success: true }), 5000);
    });
  }

  // Emit: mark_read
  markAsRead(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('mark_read', { conversationId });
  }

  // Emit: transfer_conversation
  transferConversation(
    conversationId: string,
    newAdvisorId: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'transfer_conversation',
        { conversationId, newAdvisorId, reason },
        (response?: { success: boolean; error?: string }) => {
          if (response) {
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error || 'Failed to transfer conversation'));
            }
          } else {
            resolve({ success: true });
          }
        }
      );

      // Fallback timeout
      setTimeout(() => resolve({ success: true }), 5000);
    });
  }

  // Event listeners
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onHelpRequest(callback: HelpRequestCallback): () => void {
    this.helpRequestCallbacks.push(callback);
    return () => {
      this.helpRequestCallbacks = this.helpRequestCallbacks.filter(cb => cb !== callback);
    };
  }

  onAdvisorAssigned(callback: AdvisorAssignedCallback): () => void {
    this.advisorAssignedCallbacks.push(callback);
    return () => {
      this.advisorAssignedCallbacks = this.advisorAssignedCallbacks.filter(cb => cb !== callback);
    };
  }

  onHelpRequestTaken(callback: HelpRequestTakenCallback): () => void {
    this.helpRequestTakenCallbacks.push(callback);
    return () => {
      this.helpRequestTakenCallbacks = this.helpRequestTakenCallbacks.filter(cb => cb !== callback);
    };
  }

  onConversationTransferred(callback: ConversationTransferredCallback): () => void {
    this.conversationTransferredCallbacks.push(callback);
    return () => {
      this.conversationTransferredCallbacks = this.conversationTransferredCallbacks.filter(cb => cb !== callback);
    };
  }

  onAdvisorChanged(callback: AdvisorChangedCallback): () => void {
    this.advisorChangedCallbacks.push(callback);
    return () => {
      this.advisorChangedCallbacks = this.advisorChangedCallbacks.filter(cb => cb !== callback);
    };
  }

  // Legacy aliases for backwards compatibility
  onHelpAccepted(callback: AdvisorAssignedCallback): () => void {
    return this.onAdvisorAssigned(callback);
  }

  onRequestTaken(callback: HelpRequestTakenCallback): () => void {
    return this.onHelpRequestTaken(callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks = [];
    this.helpRequestCallbacks = [];
    this.advisorAssignedCallbacks = [];
    this.helpRequestTakenCallbacks = [];
    this.conversationTransferredCallbacks = [];
    this.advisorChangedCallbacks = [];
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const chatWebSocketService = new ChatWebSocketService();
