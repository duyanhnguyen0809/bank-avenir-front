'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { chatApi } from '@/lib/api/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Plus, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, Message } from '@/lib/types';

export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => chatApi.getConversations(user!.id),
    enabled: !!user?.id,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => chatApi.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch advisors for new conversation
  const { data: advisors } = useQuery({
    queryKey: ['advisors'],
    queryFn: () => chatApi.getAdvisors(),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { conversationId: string; senderId: string; receiverId: string; content: string }) =>
      chatApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      setMessageInput('');
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (data: { userId: string; recipientId: string; initialMessage?: string }) =>
      chatApi.createConversation(data),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      setSelectedConversation(newConv.id);
    },
  });

  // Mark conversation as read
  useEffect(() => {
    if (selectedConversation && user?.id) {
      chatApi.markConversationRead(selectedConversation, user.id);
    }
  }, [selectedConversation, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const conversation = conversations?.find(c => c.id === selectedConversation);
    if (!conversation) return;

    const recipient = conversation.participants.find(p => p.id !== user.id);
    if (!recipient) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      senderId: user.id,
      receiverId: recipient.id,
      content: messageInput.trim(),
    });
  };

  const handleStartConversation = (advisorId: string) => {
    if (!user) return;
    
    createConversationMutation.mutate({
      userId: user.id,
      recipientId: advisorId,
      initialMessage: 'Hello, I would like to speak with an advisor.',
    });
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-gray-500">Chat with your bank advisor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100%-80px)]">
        {/* Conversations List */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              {advisors && advisors.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartConversation(advisors[0].id)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              )}
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
                        onClick={() => setSelectedConversation(conv.id)}
                        className={cn(
                          'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                          isSelected && 'bg-blue-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {other?.profile.firstName?.charAt(0)}
                              {other?.profile.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">
                                {other?.profile.firstName} {other?.profile.lastName}
                              </p>
                              {conv.lastMessage && (
                                <span className="text-xs text-gray-400">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500 truncate">
                                {conv.lastMessage?.content || 'No messages yet'}
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
                {advisors && advisors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartConversation(advisors[0].id)}
                    className="mt-3"
                  >
                    Start a conversation
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Panel */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                {(() => {
                  const conv = conversations?.find(c => c.id === selectedConversation);
                  const other = conv ? getOtherParticipant(conv) : null;
                  return (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {other?.profile.firstName?.charAt(0)}
                          {other?.profile.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {other?.profile.firstName} {other?.profile.lastName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {other?.role?.toLowerCase()} Advisor
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  {messagesLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading messages...</div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
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
                                'max-w-[70%] rounded-lg px-4 py-2',
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
              <div className="p-4 border-t">
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
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a conversation from the list to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
