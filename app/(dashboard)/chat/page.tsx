'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { chatApi } from '@/lib/api/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, User as UserIcon, ArrowLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, Message } from '@/lib/types';
import { chatWebSocketService } from '@/lib/services/chatWebSocket';
import { USE_MOCK_API } from '@/lib/config';
import { mockChatWebSocketService } from '@/lib/services/mockChatWebSocket';
import { toast } from 'sonner';

export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const [helpRequestSent, setHelpRequestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    if (user) {
      const userName = user.profile?.firstName 
        ? `${user.profile.firstName} ${user.profile.lastName || ''}`
        : user.email.split('@')[0];
      
      // Use mock or real WebSocket based on config
      if (USE_MOCK_API) {
        mockChatWebSocketService.connect(user.id, user.role, userName, user.email);

        const unsubMessage = mockChatWebSocketService.onMessage((message) => {
          console.log('📨 New message received:', message);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          toast.info('New message received!');
        });

        const unsubHelp = mockChatWebSocketService.onHelpAccepted((data) => {
          console.log('✅ Help request accepted by:', data.advisorName);
          setHelpRequestSent(false);
          toast.success(`An advisor (${data.advisorName}) has accepted your request!`);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        return () => {
          unsubMessage();
          unsubHelp();
          mockChatWebSocketService.disconnect();
        };
      } else {
        // Use real WebSocket
        chatWebSocketService.connect(user.id);

        const unsubMessage = chatWebSocketService.onMessage((message) => {
          console.log('📨 New message received:', message);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          toast.info('New message received!');
        });

        const unsubHelp = chatWebSocketService.onAdvisorAssigned((data) => {
          console.log('✅ Help request accepted by:', data.advisorName);
          setHelpRequestSent(false);
          toast.success(`An advisor (${data.advisorName}) has accepted your request!`);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        return () => {
          unsubMessage();
          unsubHelp();
          chatWebSocketService.disconnect();
        };
      }
    }
  }, [user, queryClient]);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => chatApi.getConversations(user!.id),
    enabled: !!user?.id,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Check if client has an active conversation with an advisor
  const hasActiveConversation = conversations && conversations.length > 0;

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => chatApi.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Poll every 5 seconds
  });

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
    if (!messageInput.trim() || !user || isSending) return;

    const content = messageInput.trim();
    setMessageInput(''); // Clear immediately for better UX
    setIsSending(true);

    try {
      if (USE_MOCK_API) {
        if (selectedConversation) {
          const conversation = conversations?.find(c => c.id === selectedConversation);
          const recipient = conversation?.participants.find(p => p.id !== user.id);
          if (recipient) {
            await mockChatWebSocketService.sendMessage(selectedConversation, recipient.id, content);
          }
        } else {
          await mockChatWebSocketService.requestHelp(content);
        }
      } else {
        // If client has an active conversation, use private_message
        // Otherwise use request_help (for new help requests)
        if (selectedConversation && hasActiveConversation) {
          const conversation = conversations?.find(c => c.id === selectedConversation);
          // Get advisor ID from conversation
          const advisorId = conversation?.otherUser?.id ||
            conversation?.participants?.find(p => p.id !== user.id)?.id ||
            conversation?.advisorId;

          if (advisorId) {
            await chatWebSocketService.sendMessage(advisorId, content, selectedConversation);
            console.log('📤 Message sent via private_message to advisor:', advisorId);
          } else {
            // Fallback to request_help if can't determine advisor
            await chatWebSocketService.requestHelp(content);
            console.log('📤 Message sent via request_help (no advisor ID found)');
          }
        } else {
          // No active conversation - use request_help
          await chatWebSocketService.requestHelp(content);
          console.log('📤 Message sent via request_help');
        }
      }
      // Refresh messages
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
      setMessageInput(content); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestHelp = async (customMessage?: string) => {
    if (!user) return;

    const content = customMessage || 'I need assistance with my account.';
    setIsSending(true);

    try {
      let result;
      if (USE_MOCK_API) {
        result = await mockChatWebSocketService.requestHelp(content);
      } else {
        // Use real WebSocket request_help
        result = await chatWebSocketService.requestHelp(content);
      }
      
      if (result.success) {
        setHelpRequestSent(true);
        toast.success('Help request sent!', {
          description: 'An advisor will respond shortly.',
        });
        queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      }
    } catch (err) {
      console.error('Failed to request help:', err);
      toast.error('Failed to send help request');
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
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
        },
      } as any;
    }
    
    // Fallback: try to get from participants array
    if (conversation?.participants && Array.isArray(conversation.participants) && conversation.participants.length > 0) {
      const participant = conversation.participants.find(p => p.id !== user?.id);
      if (participant) return participant;
    }
    
    // Last fallback
    return {
      id: 'unknown',
      email: '',
      role: user?.role === 'CLIENT' ? 'MANAGER' : 'CLIENT',
      profile: {
        firstName: user?.role === 'CLIENT' ? 'Advisor' : 'Client',
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

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
          <p className="text-sm md:text-base text-gray-500">Chat with your bank advisor</p>
        </div>
        {/* Request Help Button for Clients - only shown if no active conversation */}
        {user?.role === 'CLIENT' && !hasActiveConversation && (
          <Button
            onClick={() => handleRequestHelp()}
            disabled={helpRequestSent || isSending}
            variant={helpRequestSent ? "outline" : "default"}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {helpRequestSent ? 'Help Requested' : 'Request Help'}
          </Button>
        )}
      </div>

      {/* Help Request Status - only shown when waiting and no active conversation */}
      {helpRequestSent && !hasActiveConversation && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-sm text-blue-700">
            Waiting for an advisor to accept your help request...
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-[calc(100%-80px)]">
        {/* Conversations List */}
        <Card className={cn(
          "md:col-span-1 flex flex-col",
          selectedConversation && !showConversations ? "hidden md:flex" : "flex"
        )}>
          <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg">Conversations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {conversationsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : conversations && conversations.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {conversations.map((conv) => {
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
                          isSelected && 'bg-blue-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {other?.profile?.firstName?.charAt(0) || 'A'}
                              {other?.profile?.lastName?.charAt(0) || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">
                                {other?.profile?.firstName || 'Advisor'} {other?.profile?.lastName || ''}
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
                                  : 'No messages yet'}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge className="ml-2 bg-blue-500 text-white h-5 min-w-5 text-xs">
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
                <p className="text-sm">No conversations yet</p>
                {user?.role === 'CLIENT' && !helpRequestSent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequestHelp()}
                    className="mt-3 gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Request Help
                  </Button>
                )}
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
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm md:text-base">
                          {other?.profile?.firstName?.charAt(0) || 'A'}
                          {other?.profile?.lastName?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm md:text-base">
                          {other?.profile?.firstName || 'Advisor'} {other?.profile?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          Advisor
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-3 md:p-4 overflow-hidden">
                <ScrollArea className="h-full pr-2 md:pr-4">
                  {messagesLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading messages...</div>
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
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              )}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={cn(
                                  'text-xs mt-1',
                                  isOwnMessage ? 'text-blue-100' : 'text-gray-400'
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
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Send a message to start the conversation</p>
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
                    size="sm"
                    className="md:size-default"
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
                <p className="text-xs md:text-sm mt-1">Choose a conversation from the list to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
