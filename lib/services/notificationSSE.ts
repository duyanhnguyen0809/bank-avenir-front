import { Notification } from '@/lib/types';
import { USE_MOCK_API } from '@/lib/config';

type NotificationCallback = (notification: Notification) => void;

class NotificationSSEService {
  private eventSource: EventSource | null = null;
  private callbacks: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private isDisabled = false;

  connect(userId: string): void {
    // Skip SSE in mock mode or if previously disabled due to errors
    if (typeof window === 'undefined' || USE_MOCK_API || this.isDisabled) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    const url = `${baseUrl}/sse/notifications?userId=${userId}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('[SSE] Connected for real-time notifications');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.callbacks.forEach(cb => cb(notification));
        } catch {
          // Silently ignore parse errors
        }
      };

      this.eventSource.onerror = () => {
        this.eventSource?.close();

        // Attempt to reconnect with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          setTimeout(() => this.connect(userId), delay);
        } else {
          // Disable SSE after max attempts - polling will handle updates
          this.isDisabled = true;
          console.log('[SSE] Disabled - using polling fallback for notifications');
        }
      };
    } catch {
      // SSE not available, polling will handle updates
      this.isDisabled = true;
    }
  }

  onNotification(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.callbacks = [];
    this.reconnectAttempts = 0;
    // Reset disabled flag so SSE can try again on next connect
    this.isDisabled = false;
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

export const notificationSSEService = new NotificationSSEService();
