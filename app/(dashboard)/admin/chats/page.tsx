'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { chatApi } from '@/lib/api/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  ArrowLeft,
  Search,
  User,
  Users,
  Clock,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Conversation, Message, User as UserType } from '@/lib/types';

export default function AdminChatsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Redirect non-admin users
  if (user && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get all users to fetch their conversations
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getAllUsers(),
  });

  // Get all conversations for all users
  const { data: allConversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['adminAllConversations', allUsers],
    queryFn: async () => {
      if (!allUsers) return [];
      
      // Fetch conversations for all users
      const conversationPromises = allUsers.map(async (u) => {
        try {
          const convs = await chatApi.getConversations(u.id);
          return convs.map(conv => ({
            ...conv,
            fetchedForUser: u,
          }));
        } catch {
          return [];
        }
      });
      
      const results = await Promise.all(conversationPromises);
      const allConvs = results.flat();
      
      // Deduplicate by conversation ID
      const uniqueConvs = new Map();
      allConvs.forEach(conv => {
        if (!uniqueConvs.has(conv.id)) {
          uniqueConvs.set(conv.id, conv);
        }
      });
      
      return Array.from(uniqueConvs.values());
    },
    enabled: !!allUsers && allUsers.length > 0,
  });

  // Get messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ['conversationMessages', selectedConversation?.id],
    queryFn: () => chatApi.getMessages(selectedConversation!.id),
    enabled: !!selectedConversation?.id,
  });

  const filteredConversations = allConversations?.filter((conv: Conversation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Search in participant names
    const participantMatch = conv.participants?.some(p => 
      `${p.profile?.firstName} ${p.profile?.lastName}`.toLowerCase().includes(query)
    );
    
    // Search in other user name
    const otherUserMatch = conv.otherUser?.name?.toLowerCase().includes(query);
    
    // Search in last message
    const messageMatch = conv.lastMessage?.content?.toLowerCase().includes(query);
    
    return participantMatch || otherUserMatch || messageMatch;
  }) || [];

  const getOtherParticipant = (conv: Conversation): string => {
    if (conv.otherUser?.name) {
      return conv.otherUser.name;
    }
    if (conv.participants && conv.participants.length > 0) {
      const other = conv.participants[0];
      return `${other.profile?.firstName || ''} ${other.profile?.lastName || ''}`.trim() || 'Unknown';
    }
    return 'Unknown User';
  };

  const formatTime = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">All Conversations</h1>
        <p className="text-gray-500">View all chat conversations between users and advisors</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allConversations?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Chats</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allConversations?.filter((c: Conversation) => c.status === 'ACTIVE').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-150">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-120">
              {conversationsLoading || usersLoading ? (
                <div className="p-4 text-center text-gray-500">Loading conversations...</div>
              ) : filteredConversations.length > 0 ? (
                <div className="divide-y">
                  {filteredConversations.map((conv: Conversation) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {getOtherParticipant(conv)}
                            </p>
                            <span className="text-xs text-gray-500">
                              {conv.lastMessage?.createdAt && formatTime(conv.lastMessage.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conv.lastMessage?.content || 'No messages yet'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {conv.status || 'ACTIVE'}
                            </Badge>
                            {conv.otherUser?.role && (
                              <Badge 
                                className={`text-xs ${
                                  conv.otherUser.role === 'CLIENT' 
                                    ? 'bg-gray-100 text-gray-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {conv.otherUser.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">No conversations found</div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages View */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{getOtherParticipant(selectedConversation)}</CardTitle>
                  <CardDescription>
                    Conversation ID: {selectedConversation.id}
                  </CardDescription>
                </div>
              </div>
            ) : (
              <CardTitle className="text-lg">Select a conversation</CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-125 p-4">
              {selectedConversation ? (
                messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg: Message) => (
                      <div key={msg.id} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {msg.senderName || msg.senderId}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No messages in this conversation
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a conversation to view messages
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
