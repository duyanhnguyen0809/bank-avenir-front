'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { chatApi } from '@/lib/api/chat';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Send,
  DollarSign,
  Check,
  X,
  UserCog,
  Clock,
  ArrowLeft,
  Users,
  Bell,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Conversation, Message, Loan } from '@/lib/types';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';
import { mockChatWebSocketService } from '@/lib/services/mockChatWebSocket';
import { chatWebSocketService } from '@/lib/services/chatWebSocket';
import { USE_MOCK_API } from '@/lib/config';

interface HelpRequestMessage {
  content: string;
  timestamp: string;
}

interface HelpRequest {
  clientId: string;
  clientName: string;
  clientEmail: string;
  message: string; // Latest message for display
  messages: HelpRequestMessage[]; // All accumulated messages
  timestamp: string; // First message timestamp
  lastMessageAt: string; // Latest message timestamp
  conversationId: string;
}

export default function AdvisorPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [newMessages, setNewMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track accepted conversation IDs to prevent re-adding help requests
  const acceptedConversationsRef = useRef<Set<string>>(new Set());
  // Track pending conversation IDs (help requested but not yet accepted by any advisor)
  const pendingConversationsRef = useRef<Set<string>>(new Set());

  // Redirect non-manager/admin users
  if (user && user.role === 'CLIENT') {
    redirect('/dashboard');
  }

  // Connect to WebSocket on mount
  useEffect(() => {
    if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
      const userName = user.profile?.firstName 
        ? `${user.profile.firstName} ${user.profile.lastName || ''}`
        : user.email.split('@')[0];
      
      if (USE_MOCK_API) {
        mockChatWebSocketService.connect(user.id, user.role, userName, user.email);

        // Listen for new messages - check if for pending conversation
        const unsubMessage = mockChatWebSocketService.onMessage((message) => {
          console.log('📨 New message received:', message);

          // Check if this is for a pending conversation
          if (pendingConversationsRef.current.has(message.conversationId)) {
            console.log('📨 Message for pending conversation - adding to help request:', message.conversationId);
            setHelpRequests(prev => {
              const existingIndex = prev.findIndex(r => r.conversationId === message.conversationId);
              if (existingIndex >= 0) {
                const updated = [...prev];
                const existing = updated[existingIndex];
                updated[existingIndex] = {
                  ...existing,
                  message: message.content,
                  lastMessageAt: message.createdAt,
                  messages: [...existing.messages, { content: message.content, timestamp: message.createdAt }],
                };
                return updated;
              }
              return prev;
            });
            toast.info(`New message from client (pending)`, {
              description: message.content.substring(0, 50),
            });
            return;
          }

          setNewMessages(prev => [...prev, message]);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['advisorConversations'] });
          toast.info(`New message from client`, {
            description: message.content.substring(0, 50),
          });
        });

        // Listen for NEW help requests only (first contact from client)
        const unsubHelp = mockChatWebSocketService.onHelpRequest((request) => {
          console.log('🆘 Help request received:', request);

          // Mark as pending
          pendingConversationsRef.current.add(request.conversationId);

          setHelpRequests(prev => {
            // Check for existing
            const existingIndex = prev.findIndex(r => r.conversationId === request.conversationId);
            if (existingIndex >= 0) {
              const updated = [...prev];
              const existing = updated[existingIndex];
              updated[existingIndex] = {
                ...existing,
                message: request.message,
                lastMessageAt: request.timestamp,
                messages: [...existing.messages, { content: request.message, timestamp: request.timestamp }],
              };
              return updated;
            }
            return [...prev, {
              ...request,
              messages: [{ content: request.message, timestamp: request.timestamp }],
              lastMessageAt: request.timestamp,
            }];
          });
          toast.info(`New help request from ${request.clientName}`, {
            description: request.message.substring(0, 50),
          });
        });

        // Load existing pending help requests (with proper format)
        const existingRequests = mockChatWebSocketService.getPendingHelpRequests();
        setHelpRequests(existingRequests.map(r => {
          pendingConversationsRef.current.add(r.conversationId);
          return {
            ...r,
            messages: [{ content: r.message, timestamp: r.timestamp }],
            lastMessageAt: r.timestamp,
          };
        }));

        return () => {
          unsubMessage();
          unsubHelp();
          mockChatWebSocketService.disconnect();
        };
      } else {
        // Use real WebSocket
        chatWebSocketService.connect(user.id);

        // Listen for new messages - check if it's for a pending conversation
        const unsubMessage = chatWebSocketService.onMessage((message) => {
          console.log('📨 New message received:', message);

          // Check if this message is for a pending conversation (not yet accepted)
          if (pendingConversationsRef.current.has(message.conversationId)) {
            console.log('📨 Message for pending conversation - adding to help request:', message.conversationId);

            // Update the help request with the new message
            setHelpRequests(prev => {
              const existingIndex = prev.findIndex(r => r.conversationId === message.conversationId);
              if (existingIndex >= 0) {
                const updated = [...prev];
                const existing = updated[existingIndex];
                updated[existingIndex] = {
                  ...existing,
                  message: message.content, // Update latest message
                  lastMessageAt: message.createdAt,
                  messages: [...existing.messages, { content: message.content, timestamp: message.createdAt }],
                };
                return updated;
              }
              return prev;
            });

            toast.info(`New message from ${message.senderName || 'client'} (pending)`, {
              description: message.content.substring(0, 50),
            });
            return;
          }

          // Normal flow - message for accepted conversation
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['advisorConversations'] });
          toast.info(`New message from ${message.senderName || 'client'}`, {
            description: message.content.substring(0, 50),
          });
        });

        // Listen for help_request_broadcast - first contact from NEW clients
        const unsubHelpBroadcast = chatWebSocketService.onHelpRequest((request) => {
          console.log('🆘 New help request broadcast received:', request);

          // Skip if we already accepted this conversation
          if (acceptedConversationsRef.current.has(request.conversationId)) {
            console.log('⏭️ Skipping help request - already accepted:', request.conversationId);
            return;
          }

          // Mark as pending
          pendingConversationsRef.current.add(request.conversationId);

          setHelpRequests(prev => {
            // Check if we already have this conversation in help requests
            const existingIndex = prev.findIndex(r => r.conversationId === request.conversationId);

            if (existingIndex >= 0) {
              // Update existing help request with new message
              const updated = [...prev];
              const existing = updated[existingIndex];
              updated[existingIndex] = {
                ...existing,
                message: request.content,
                lastMessageAt: request.createdAt,
                messages: [...existing.messages, { content: request.content, timestamp: request.createdAt }],
              };
              return updated;
            }

            // Create new help request
            return [...prev, {
              conversationId: request.conversationId,
              clientId: request.clientId,
              clientName: request.clientName,
              clientEmail: '',
              message: request.content,
              messages: [{ content: request.content, timestamp: request.createdAt }],
              timestamp: request.createdAt,
              lastMessageAt: request.createdAt,
            }];
          });
          toast.info(`New help request from ${request.clientName}`, {
            description: request.content.substring(0, 50),
          });
        });

        // Listen for help_request_taken (another advisor took it)
        const unsubTaken = chatWebSocketService.onHelpRequestTaken((data) => {
          console.log('ℹ️ Help request taken by another advisor:', data);
          // Remove from pending tracking
          pendingConversationsRef.current.delete(data.conversationId);
          setHelpRequests(prev => prev.filter(r => r.conversationId !== data.conversationId));
        });

        // Listen for conversation_transferred_to_you
        const unsubTransferred = chatWebSocketService.onConversationTransferred((data) => {
          console.log('📥 Conversation transferred to you:', data);
          toast.info(`Conversation transferred from ${data.fromAdvisor}`, {
            description: data.reason || `Client: ${data.clientName}`,
          });
          queryClient.invalidateQueries({ queryKey: ['advisorConversations'] });
        });

        return () => {
          unsubMessage();
          unsubHelpBroadcast();
          unsubTaken();
          unsubTransferred();
          chatWebSocketService.disconnect();
        };
      }
    }
  }, [user, queryClient]);

  // Fetch all conversations (as advisor, we see all client conversations)
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['advisorConversations', user?.id],
    queryFn: () => chatApi.getConversations(user!.id),
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Filter conversations to exclude pending ones (shown in Help Requests tab instead)
  const activeConversations = conversations?.filter(
    c => !pendingConversationsRef.current.has(c.id)
  );

  // Sync help requests with conversations from backend
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      // Only mark as accepted if not in our pending set
      conversations.forEach(c => {
        if (!pendingConversationsRef.current.has(c.id)) {
          acceptedConversationsRef.current.add(c.id);
        }
      });

      // Remove help requests for conversations that are accepted (not pending)
      setHelpRequests(prev => {
        const filtered = prev.filter(r => {
          // Keep if still in pending set
          if (pendingConversationsRef.current.has(r.conversationId)) {
            return true;
          }
          // Remove if conversation exists and is not pending
          const conversationExists = conversations.some(c => c.id === r.conversationId);
          if (conversationExists) {
            console.log('🧹 Removing help request - conversation accepted:', r.conversationId);
            return false;
          }
          return true;
        });
        return filtered;
      });
    }
  }, [conversations]);

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => chatApi.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: 3000,
  });

  // Fetch pending loans from admin API
  const { data: pendingLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['pendingLoansAdvisor'],
    queryFn: () => adminApi.getPendingLoans(),
    refetchInterval: 10000,
  });

  // Approve loan mutation - uses admin API with notifications
  const approveLoanMutation = useMutation({
    mutationFn: (loanId: string) => adminApi.approveLoan(loanId),
    onSuccess: (loan) => {
      queryClient.invalidateQueries({ queryKey: ['pendingLoansAdvisor'] });
      toast.success('Loan approved successfully!', {
        description: `The client has been notified of the approval.`,
      });
      console.log('✅ Loan approved, notification sent to client:', loan.userId);
    },
    onError: () => {
      toast.error('Error approving loan');
    },
  });

  // Reject loan mutation - uses admin API with notifications
  const rejectLoanMutation = useMutation({
    mutationFn: (loanId: string) => adminApi.rejectLoan(loanId),
    onSuccess: (loan) => {
      queryClient.invalidateQueries({ queryKey: ['pendingLoansAdvisor'] });
      toast.success('Loan rejected', {
        description: `The client has been notified.`,
      });
      console.log('❌ Loan rejected, notification sent to client:', loan.userId);
    },
    onError: () => {
      toast.error('Error rejecting loan');
    },
  });

  // Accept help request handler
  const handleAcceptHelp = async (conversationId: string, clientId: string) => {
    // Immediately mark as accepted and remove from pending
    acceptedConversationsRef.current.add(conversationId);
    pendingConversationsRef.current.delete(conversationId);
    // Immediately remove from UI
    setHelpRequests(prev => prev.filter(r => r.conversationId !== conversationId));

    try {
      if (USE_MOCK_API) {
        await mockChatWebSocketService.acceptHelp(conversationId);
      } else {
        // Use real WebSocket accept_help
        await chatWebSocketService.acceptHelp(
          conversationId,
          clientId,
          'Hello! I am here to help you. How can I assist you today?'
        );
      }
      toast.success('Help request accepted!', {
        description: 'You can now chat with the client.',
      });
      queryClient.invalidateQueries({ queryKey: ['advisorConversations'] });
    } catch (error) {
      console.error('Failed to accept help:', error);
      toast.error('Error accepting help request');
      // On error, allow re-adding the request
      acceptedConversationsRef.current.delete(conversationId);
      pendingConversationsRef.current.add(conversationId);
    }
  };

  // Mark conversation as read
  useEffect(() => {
    if (selectedConversation && user?.id) {
      if (USE_MOCK_API) {
        chatApi.markConversationRead(selectedConversation, user.id);
      } else {
        // Use WebSocket mark_read for real backend
        chatWebSocketService.markAsRead(selectedConversation);
      }
    }
  }, [selectedConversation, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user || isSending) {
      console.log('⚠️ Send blocked:', { hasInput: !!messageInput.trim(), selectedConversation, user: !!user, isSending });
      return;
    }

    const conversation = conversations?.find(c => c.id === selectedConversation);
    if (!conversation) {
      console.log('⚠️ Conversation not found:', selectedConversation);
      toast.error('Conversation not found');
      return;
    }

    // Get recipient - use otherUser.id from backend response
    let recipientId: string | undefined;
    
    // Primary: use otherUser from backend
    if (conversation.otherUser?.id) {
      recipientId = conversation.otherUser.id;
    }
    
    // Fallback: try participants array
    if (!recipientId && conversation.participants && conversation.participants.length > 0) {
      const recipient = conversation.participants.find(p => p.id !== user.id);
      recipientId = recipient?.id;
    }
    
    // Fallback: try clientId
    if (!recipientId && conversation.clientId) {
      recipientId = conversation.clientId;
    }
    
    // Fallback: get from last message receiverId or senderId
    if (!recipientId && conversation.lastMessage) {
      recipientId = conversation.lastMessage.senderId !== user.id 
        ? conversation.lastMessage.senderId 
        : conversation.lastMessage.receiverId;
    }

    if (!recipientId) {
      console.log('⚠️ No recipient found in conversation:', conversation);
      toast.error('Cannot identify message recipient');
      return;
    }

    const content = messageInput.trim();
    setMessageInput(''); // Clear immediately for better UX
    setIsSending(true);

    try {
      if (USE_MOCK_API) {
        await mockChatWebSocketService.sendMessage(selectedConversation, recipientId, content);
      } else {
        // Use real WebSocket private_message with conversationId
        await chatWebSocketService.sendMessage(recipientId, content, selectedConversation);
      }
      console.log('📤 Message sent via WebSocket to:', recipientId);
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['advisorConversations', user?.id] });
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
      setMessageInput(content); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    // Backend returns otherUser directly - use it first
    if (conversation.otherUser) {
      const nameParts = (conversation.otherUser.name || '').split(' ');
      return {
        id: conversation.otherUser.id,
        email: '',
        role: conversation.otherUser.role,
        profile: {
          firstName: nameParts[0] || 'Client',
          lastName: nameParts.slice(1).join(' ') || '',
        },
      } as any;
    }
    
    // Fallback: try to get from participants array
    if (conversation?.participants && Array.isArray(conversation.participants) && conversation.participants.length > 0) {
      const participant = conversation.participants.find(p => p.id !== user?.id);
      if (participant) return participant;
    }
    
    // Last fallback for client name
    return {
      id: conversation.clientId || 'client',
      email: '',
      role: 'CLIENT',
      profile: {
        firstName: 'Client',
        lastName: '',
      },
    } as any;
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnread = activeConversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
          <UserCog className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Advisor Dashboard</h1>
          <p className="text-sm md:text-base text-gray-500">Manage client conversations and loan requests</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              <span className="text-xs md:text-sm text-gray-500">Messages</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{totalUnread}</div>
            <p className="text-xs text-gray-500">unread</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              <span className="text-xs md:text-sm text-gray-500">Requests</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{helpRequests.length}</div>
            <p className="text-xs text-gray-500">pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              <span className="text-xs md:text-sm text-gray-500">Conversations</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{activeConversations?.length || 0}</div>
            <p className="text-xs text-gray-500">active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              <span className="text-xs md:text-sm text-gray-500">Loans</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{pendingLoans?.length || 0}</div>
            <p className="text-xs text-gray-500">pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="requests" className="gap-2 flex-1 sm:flex-none">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Help Requests</span>
            <span className="sm:hidden">Help</span>
            {helpRequests.length > 0 && (
              <Badge className="ml-1 bg-red-500">{helpRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2 flex-1 sm:flex-none">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Conversations</span>
            <span className="sm:hidden">Chat</span>
            {totalUnread > 0 && (
              <Badge className="ml-1 bg-blue-500">{totalUnread}</Badge>
            )}
          </TabsTrigger>
          {/* <TabsTrigger value="loans" className="gap-2 flex-1 sm:flex-none">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Loan Requests</span>
            <span className="sm:hidden">Loans</span>
            {pendingLoans && pendingLoans.length > 0 && (
              <Badge className="ml-1 bg-orange-500">{pendingLoans.length}</Badge>
            )}
          </TabsTrigger> */}
        </TabsList>

        {/* Help Requests Tab - Shows all messages from clients waiting for an advisor */}
        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Pending Help Requests</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Clients waiting for an advisor - all messages shown until accepted
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              {helpRequests.length > 0 ? (
                <div className="space-y-4">
                  {helpRequests.map((request) => (
                    <div
                      key={request.conversationId}
                      className="border rounded-lg p-4 md:p-6 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-red-100 text-red-600">
                                {request.clientName?.split(' ').map(n => n[0]).join('') || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{request.clientName || 'Client'}</p>
                                {request.messages.length > 1 && (
                                  <Badge className="bg-blue-500 text-white text-xs">
                                    {request.messages.length} messages
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{request.clientEmail || 'New client'}</p>
                            </div>
                          </div>

                          {/* Show all messages */}
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {request.messages.map((msg, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700">{msg.content}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            First message: {new Date(request.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleAcceptHelp(request.conversationId, request.clientId)}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-sm mt-1">New help requests will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab - Shows ongoing conversations (subsequent messages) */}
        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-400px)] min-h-100">
            {/* Conversations List */}
            <Card className={cn(
              "md:col-span-1 flex flex-col",
              selectedConversation && !showConversations ? "hidden md:flex" : "flex"
            )}>
              <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                <CardTitle className="text-base md:text-lg">Clients</CardTitle>
                <CardDescription className="text-xs md:text-sm">Active conversations</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {conversationsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : activeConversations && activeConversations.length > 0 ? (
                  <ScrollArea className="h-full">
                    <div className="divide-y">
                      {activeConversations.map((conv) => {
                        const other = getOtherParticipant(conv);
                        const isSelected = selectedConversation === conv.id;

                        return (
                          <button
                            key={conv.id}
                            onClick={() => {
                              setSelectedConversation(conv.id);
                              setShowConversations(false);
                            }}
                            className={cn(
                              'w-full p-3 md:p-4 text-left hover:bg-gray-50 transition-colors',
                              isSelected && 'bg-indigo-50'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                  {other?.profile?.firstName?.charAt(0) || '?'}
                                  {other?.profile?.lastName?.charAt(0) || ''}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm truncate">
                                    {other?.profile?.firstName || 'Unknown'} {other?.profile?.lastName || ''}
                                  </p>
                                  {conv.lastMessage && (
                                    <span className="text-xs text-gray-400">
                                      {formatTime(conv.lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-xs text-gray-500 truncate">
                                    {conv.lastMessage 
                                      ? conv.lastMessage.senderId === user?.id 
                                        ? `You: ${conv.lastMessage.content}`
                                        : conv.lastMessage.content
                                      : 'No messages'}
                                  </p>
                                  {conv.unreadCount > 0 && (
                                    <Badge className="ml-2 bg-indigo-500 text-white h-5 min-w-5 text-xs">
                                      {conv.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages Panel */}
            <Card className={cn(
              "md:col-span-2 flex flex-col",
              !selectedConversation || showConversations ? "hidden md:flex" : "flex"
            )}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b p-3 md:p-6 md:pb-3">
                    {(() => {
                      const conv = conversations?.find(c => c.id === selectedConversation);
                      const other = conv ? getOtherParticipant(conv) : null;
                      return (
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden -ml-2"
                            onClick={() => setShowConversations(true)}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Avatar className="h-8 w-8 md:h-10 md:w-10">
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm md:text-base">
                              {other?.profile?.firstName?.charAt(0) || '?'}
                              {other?.profile?.lastName?.charAt(0) || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm md:text-base">
                              {other?.profile?.firstName || 'Unknown'} {other?.profile?.lastName || ''}
                            </p>
                            <p className="text-xs text-gray-500">Client</p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 p-3 md:p-4 overflow-hidden">
                    <ScrollArea className="h-full pr-2 md:pr-4">
                      {messagesLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-3 md:space-y-4">
                          {messages.map((message) => {
                            const isOwnMessage = message.senderId === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  'flex',
                                  isOwnMessage ? 'justify-end' : 'justify-start'
                                )}
                              >
                                <div
                                  className={cn(
                                    'max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 md:px-4',
                                    isOwnMessage
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  )}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p
                                    className={cn(
                                      'text-xs mt-1',
                                      isOwnMessage ? 'text-indigo-100' : 'text-gray-400'
                                    )}
                                  >
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No messages</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-3 md:p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 text-sm md:text-base"
                      />
                      <Button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center px-4">
                    <MessageSquare className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-sm md:text-base">Select a conversation</p>
                    <p className="text-xs md:text-sm mt-1">Choose a client to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans" className="mt-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Pending Loan Requests</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Review and process client loan applications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              {loansLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : pendingLoans && pendingLoans.length > 0 ? (
                <div className="space-y-4">
                  {pendingLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="border rounded-lg p-4 md:p-6 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Loan Info */}
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-orange-100 text-orange-600">
                                {loan.applicantName?.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{loan.applicantName}</p>
                              <p className="text-xs text-gray-500">{loan.applicantEmail}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Amount</p>
                              <p className="font-semibold">{formatCurrency(loan.amount, 'EUR')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Duration</p>
                              <p className="font-semibold">{loan.durationMonths} months</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Rate</p>
                              <p className="font-semibold">{(loan.interestRate * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Monthly Payment</p>
                              <p className="font-semibold">{formatCurrency(loan.monthlyPayment, 'EUR')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Requested on {new Date(loan.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 md:flex-col">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="flex-1 md:flex-none gap-2 bg-green-600 hover:bg-green-700">
                                <Check className="h-4 w-4" />
                                <span className="hidden sm:inline">Approve</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Loan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve this loan of{' '}
                                  {formatCurrency(loan.amount, 'EUR')} for {loan.applicantName}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => approveLoanMutation.mutate(loan.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="flex-1 md:flex-none gap-2">
                                <X className="h-4 w-4" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Loan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject this loan application?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => rejectLoanMutation.mutate(loan.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-sm mt-1">All loan requests have been processed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
