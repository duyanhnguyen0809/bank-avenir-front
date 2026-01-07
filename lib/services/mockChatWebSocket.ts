/**
 * Mock WebSocket Service for Chat
 * 
 * This simulates real-time messaging without a real WebSocket server.
 * It uses browser events (BroadcastChannel or custom events) to communicate
 * between tabs/windows for testing purposes.
 */

import { Message, Notification } from '@/lib/types';

type MessageCallback = (message: Message) => void;
type HelpRequestCallback = (data: { 
  clientId: string; 
  clientName: string;
  clientEmail: string;
  message: string; 
  timestamp: string;
  conversationId: string;
}) => void;
type HelpAcceptedCallback = (data: { conversationId: string; advisorId: string; advisorName: string }) => void;
type NotificationCallback = (notification: Notification) => void;

// Generate random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// In-memory storage for cross-"connection" communication
interface MockState {
  messages: Message[];
  helpRequests: Array<{
    clientId: string;
    clientName: string;
    clientEmail: string;
    message: string;
    timestamp: string;
    conversationId: string;
    status: 'pending' | 'accepted';
    advisorId?: string;
  }>;
  notifications: Notification[];
}

// Global state that persists across instances (simulating server state)
const mockState: MockState = {
  messages: [],
  helpRequests: [],
  notifications: [],
};

// Event emitter for cross-instance communication
const eventListeners: {
  message: MessageCallback[];
  helpRequest: HelpRequestCallback[];
  helpAccepted: HelpAcceptedCallback[];
  notification: NotificationCallback[];
} = {
  message: [],
  helpRequest: [],
  helpAccepted: [],
  notification: [],
};

class MockChatWebSocketService {
  private userId: string | null = null;
  private userRole: 'CLIENT' | 'MANAGER' | 'ADMIN' | null = null;
  private userName: string | null = null;
  private userEmail: string | null = null;
  private connected: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  connect(userId: string, userRole: 'CLIENT' | 'MANAGER' | 'ADMIN', userName: string, userEmail: string): void {
    this.userId = userId;
    this.userRole = userRole;
    this.userName = userName;
    this.userEmail = userEmail;
    this.connected = true;
    
    console.log(`🔌 Mock WebSocket connected for ${userRole}: ${userName} (${userId})`);
    
    // Start polling for new messages/requests (simulates WebSocket push)
    this.startPolling();
  }

  disconnect(): void {
    this.connected = false;
    this.userId = null;
    this.userRole = null;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('🔌 Mock WebSocket disconnected');
  }

  private startPolling(): void {
    // Poll every 500ms to check for new messages (simulates real-time)
    this.pollInterval = setInterval(() => {
      this.checkForNewMessages();
      this.checkForHelpRequests();
    }, 500);
  }

  private checkForNewMessages(): void {
    if (!this.userId) return;
    
    // Check for undelivered messages for this user
    const undeliveredMessages = mockState.messages.filter(
      m => m.receiverId === this.userId && !(m as Message & { delivered?: boolean }).delivered
    );
    
    undeliveredMessages.forEach(msg => {
      (msg as Message & { delivered?: boolean }).delivered = true;
      eventListeners.message.forEach(cb => cb(msg));
    });
  }

  private checkForHelpRequests(): void {
    if (!this.userId || this.userRole === 'CLIENT') return;
    
    // Only managers/admins receive help requests
    const pendingRequests = mockState.helpRequests.filter(r => r.status === 'pending');
    pendingRequests.forEach(request => {
      eventListeners.helpRequest.forEach(cb => cb(request));
    });
  }

  // Send a message
  sendMessage(
    conversationId: string,
    receiverId: string,
    content: string
  ): Promise<{ success: boolean; message?: Message }> {
    return new Promise((resolve) => {
      if (!this.connected || !this.userId) {
        resolve({ success: false });
        return;
      }

      const message: Message = {
        id: `msg-${generateId()}`,
        conversationId,
        senderId: this.userId,
        receiverId,
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Add to mock state
      mockState.messages.push(message);

      console.log('📤 Message sent:', message);

      // If receiver is a manager/advisor, also create a notification
      if (this.userRole === 'CLIENT') {
        const notification: Notification = {
          id: generateId(),
          userId: receiverId,
          type: 'PRIVATE_MESSAGE_SENT',
          title: '💬 New Message',
          message: `New message from ${this.userName}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        mockState.notifications.push(notification);
        eventListeners.notification.forEach(cb => cb(notification));
      }

      resolve({ success: true, message });
    });
  }

  // Client requests help from an advisor
  requestHelp(message: string): Promise<{ success: boolean; conversationId?: string }> {
    return new Promise((resolve) => {
      if (!this.connected || !this.userId || this.userRole !== 'CLIENT') {
        resolve({ success: false });
        return;
      }

      const conversationId = `conv-help-${generateId()}`;
      const helpRequest = {
        clientId: this.userId,
        clientName: this.userName || 'Unknown Client',
        clientEmail: this.userEmail || 'unknown@example.com',
        message,
        timestamp: new Date().toISOString(),
        conversationId,
        status: 'pending' as const,
      };

      mockState.helpRequests.push(helpRequest);
      
      console.log('🆘 Help request created:', helpRequest);

      // Notify all connected advisors
      eventListeners.helpRequest.forEach(cb => cb(helpRequest));

      resolve({ success: true, conversationId });
    });
  }

  // Advisor accepts a help request
  acceptHelp(conversationId: string): Promise<{ success: boolean; clientId?: string }> {
    return new Promise((resolve) => {
      if (!this.connected || !this.userId || this.userRole === 'CLIENT') {
        resolve({ success: false });
        return;
      }

      const request = mockState.helpRequests.find(r => r.conversationId === conversationId);
      if (!request || request.status === 'accepted') {
        resolve({ success: false });
        return;
      }

      request.status = 'accepted';
      request.advisorId = this.userId;

      console.log('✅ Help request accepted by advisor:', this.userName);

      // Notify the client
      const notification: Notification = {
        id: generateId(),
        userId: request.clientId,
        type: 'SUCCESS',
        title: '🎉 Help Request Accepted',
        message: `An advisor (${this.userName}) has accepted your help request and will assist you shortly.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      mockState.notifications.push(notification);
      eventListeners.notification.forEach(cb => cb(notification));

      // Notify via help accepted callback
      eventListeners.helpAccepted.forEach(cb => cb({
        conversationId,
        advisorId: this.userId!,
        advisorName: this.userName || 'Advisor',
      }));

      resolve({ success: true, clientId: request.clientId });
    });
  }

  // Register event callbacks
  onMessage(callback: MessageCallback): () => void {
    eventListeners.message.push(callback);
    return () => {
      const index = eventListeners.message.indexOf(callback);
      if (index > -1) eventListeners.message.splice(index, 1);
    };
  }

  onHelpRequest(callback: HelpRequestCallback): () => void {
    eventListeners.helpRequest.push(callback);
    return () => {
      const index = eventListeners.helpRequest.indexOf(callback);
      if (index > -1) eventListeners.helpRequest.splice(index, 1);
    };
  }

  onHelpAccepted(callback: HelpAcceptedCallback): () => void {
    eventListeners.helpAccepted.push(callback);
    return () => {
      const index = eventListeners.helpAccepted.indexOf(callback);
      if (index > -1) eventListeners.helpAccepted.splice(index, 1);
    };
  }

  onNotification(callback: NotificationCallback): () => void {
    eventListeners.notification.push(callback);
    return () => {
      const index = eventListeners.notification.indexOf(callback);
      if (index > -1) eventListeners.notification.splice(index, 1);
    };
  }

  // Get pending help requests (for advisors)
  getPendingHelpRequests(): Array<{
    clientId: string;
    clientName: string;
    clientEmail: string;
    message: string;
    timestamp: string;
    conversationId: string;
  }> {
    return mockState.helpRequests.filter(r => r.status === 'pending');
  }

  // Get notifications for a user
  getNotifications(userId: string): Notification[] {
    return mockState.notifications.filter(n => n.userId === userId);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
export const mockChatWebSocketService = new MockChatWebSocketService();
