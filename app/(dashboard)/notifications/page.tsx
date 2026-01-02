'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { notificationsApi } from '@/lib/api/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Info, AlertTriangle, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.getNotifications(user!.id),
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'SUCCESS':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'ALERT':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'LOAN':
        return <DollarSign className="h-5 w-5 text-purple-500" />;
      case 'TRADE':
        return <TrendingUp className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const unreadNotifications = notifications?.filter(n => !n.isRead && !n.read) || [];
  const allNotifications = notifications || [];

  const renderNotificationCard = (notification: Notification) => {
    const isUnread = !notification.isRead && !notification.read;
    
    return (
      <div
        key={notification.id}
        className={cn(
          'p-3 md:p-4 rounded-lg border transition-colors',
          isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
        )}
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={cn(
                  'font-medium text-sm md:text-base',
                  isUnread ? 'text-gray-900' : 'text-gray-700'
                )}>
                  {notification.title}
                </p>
                <p className="text-xs md:text-sm text-gray-600 mt-1">{notification.message}</p>
              </div>
              {isUnread && (
                <Badge className="bg-blue-500 text-white flex-shrink-0">New</Badge>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {formatDate(notification.createdAt)}
              </div>
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                  className="text-xs h-7 px-2"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
          <p className="text-sm md:text-base text-gray-500">
            {unreadNotifications.length > 0
              ? `You have ${unreadNotifications.length} unread notification${unreadNotifications.length > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="gap-2 w-full sm:w-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="gap-2 flex-1 sm:flex-none">
            All
            <Badge variant="secondary">{allNotifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2 flex-1 sm:flex-none">
            Unread
            {unreadNotifications.length > 0 && (
              <Badge className="bg-blue-500 text-white">{unreadNotifications.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading notifications...</div>
          ) : allNotifications.length > 0 ? (
            <div className="space-y-3">
              {allNotifications.map(renderNotificationCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm mt-1">You&#39;ll be notified about important updates here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {unreadNotifications.length > 0 ? (
            <div className="space-y-3">
              {unreadNotifications.map(renderNotificationCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <CheckCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-sm mt-1">No unread notifications</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
