import { io, Socket } from 'socket.io-client';
import { Message } from '@/lib/types';

type MessageCallback = (message: Message) => void;
type HelpRequestCallback = (data: { clientId: string; message: string; timestamp: string }) => void;
type HelpAcceptedCallback = (data: { conversationId: string; advisorId: string; advisorName: string }) => void;
type RequestTakenCallback = (data: { conversationId: string; advisorId: string }) => void;

class ChatWebSocketService {
  private socket: Socket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private helpRequestCallbacks: HelpRequestCallback[] = [];
  private helpAcceptedCallbacks: HelpAcceptedCallback[] = [];
  private requestTakenCallbacks: RequestTakenCallback[] = [];

  connect(userId: string): Socket {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    
    this.socket = io(`${baseUrl}/chat`, {
      query: { userId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('new_message', (message: Message) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.socket.on('help_request', (data: { clientId: string; message: string; timestamp: string }) => {
      this.helpRequestCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('help_accepted', (data: { conversationId: string; advisorId: string; advisorName: string }) => {
      this.helpAcceptedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('request_taken', (data: { conversationId: string; advisorId: string }) => {
      this.requestTakenCallbacks.forEach(cb => cb(data));
    });

    return this.socket;
  }

  sendMessage(receiverId: string, content: string): Promise<{ success: boolean; message?: Message }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('private_message', { receiverId, content }, (response: { success: boolean; message?: Message; error?: string }) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to send message'));
        }
      });
    });
  }

  requestHelp(message: string): Promise<{ success: boolean; conversationId?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('request_help', { message }, (response: { success: boolean; conversationId?: string; error?: string }) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to request help'));
        }
      });
    });
  }

  acceptHelp(conversationId: string): Promise<{ success: boolean; clientId?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('accept_help', { conversationId }, (response: { success: boolean; clientId?: string; error?: string }) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to accept help'));
        }
      });
    });
  }

  markAsRead(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('mark_read', { conversationId });
  }

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
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to transfer conversation'));
          }
        }
      );
    });
  }

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

  onHelpAccepted(callback: HelpAcceptedCallback): () => void {
    this.helpAcceptedCallbacks.push(callback);
    return () => {
      this.helpAcceptedCallbacks = this.helpAcceptedCallbacks.filter(cb => cb !== callback);
    };
  }

  onRequestTaken(callback: RequestTakenCallback): () => void {
    this.requestTakenCallbacks.push(callback);
    return () => {
      this.requestTakenCallbacks = this.requestTakenCallbacks.filter(cb => cb !== callback);
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks = [];
    this.helpRequestCallbacks = [];
    this.helpAcceptedCallbacks = [];
    this.requestTakenCallbacks = [];
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const chatWebSocketService = new ChatWebSocketService();
