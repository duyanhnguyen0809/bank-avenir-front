'use client';

import { useEffect, useCallback } from 'react';
import { Bell, User, Menu, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { notificationSSEService } from '@/lib/services/notificationSSE';
import { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { unreadCount, setUnreadCount, addNotification } = useNotificationStore();

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.getNotifications(user!.id),
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds as fallback
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Handle incoming SSE notification
  const handleSSENotification = useCallback((notification: Notification) => {
    // Add notification to store (this also increments unread count)
    addNotification(notification);
    // Invalidate and refetch notifications to sync with server
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  }, [queryClient, user?.id, addNotification]);

  // Connect to SSE for real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    // Connect to SSE
    notificationSSEService.connect(user.id);

    // Subscribe to notifications
    const unsubscribe = notificationSSEService.onNotification(handleSSENotification);

    return () => {
      unsubscribe();
      notificationSSEService.disconnect();
    };
  }, [user?.id, handleSSENotification]);

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (unreadCount > 0) setUnreadCount(unreadCount - 1);
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
    },
  });

  // Sync unread count from fetched notifications
  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    }
  }, [notifications, setUnreadCount]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    // Navigate based on notification type and metadata
    if (notification.metadata) {
      try {
        const meta = JSON.parse(notification.metadata);
        if (meta.loanRequestId) {
          router.push('/advisor/loans');
        }
      } catch {
        // Ignore parse errors
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
      case 'LOAN_APPROVED':
      case 'LOAN_GRANTED':
        return '✅';
      case 'WARNING':
      case 'LOAN_REJECTED':
        return '⚠️';
      case 'ERROR':
        return '❌';
      case 'LOAN_REQUEST':
        return '📋';
      case 'LOAN_REQUEST_ASSIGNED':
        return '👤';
      case 'ORDER_EXECUTED':
        return '📈';
      case 'SAVINGS_RATE_CHANGED':
        return '💰';
      case 'PRIVATE_MESSAGE_SENT':
        return '💬';
      case 'ACCOUNT_CREDITED':
        return '💵';
      case 'ACCOUNT_DEBITED':
        return '💸';
      case 'INFO':
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Get first 10 notifications
  const displayNotifications = notifications?.slice(0, 10) || [];
  const hasMore = (notifications?.length || 0) > 10;

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div>
          <h1 className="text-lg md:text-xl font-bold text-blue-600">Bank Avenir</h1>
          <p className="text-xs text-gray-500 hidden sm:block">Your Digital Banking Partner</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs text-blue-600 hover:text-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsReadMutation.mutate();
                  }}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {displayNotifications.length > 0 ? (
              <>
                <ScrollArea className="h-100">
                  {displayNotifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "px-3 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0",
                        !notification.isRead && "bg-blue-50 hover:bg-blue-100"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              !notification.isRead ? "font-semibold" : "font-medium"
                            )}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
                
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => router.push('/notifications')}
                  >
                    See all notifications
                    {hasMore && ` (${notifications?.length})`}
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.profile.firstName} {user?.profile.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="text-xs">
                Role: <Badge variant="secondary">{user?.role}</Badge>
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
