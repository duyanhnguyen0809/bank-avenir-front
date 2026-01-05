'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { chatApi } from '@/lib/api/chat';
import { loansApi } from '@/lib/api/loans';
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
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Conversation, Message, Loan } from '@/lib/types';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';

export default function ConseillerPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect non-manager/admin users
  if (user && user.role === 'CLIENT') {
    redirect('/dashboard');
  }

  // Fetch all conversations (as advisor, we see all client conversations)
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['advisorConversations', user?.id],
    queryFn: () => chatApi.getConversations(user!.id),
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => chatApi.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: 3000,
  });

  // Fetch pending loans for approval
  const { data: pendingLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['pendingLoansAdvisor'],
    queryFn: async () => {
      // Get all loans and filter pending ones
      // In real implementation, there would be an API for this
      const allLoans: Loan[] = [];
      // Mock pending loans for advisor view
      return [
        {
          id: 'loan-pending-1',
          userId: 'user-1',
          accountId: 'acc-1',
          amount: 25000,
          interestRate: 0.055,
          insuranceRate: 0.005,
          durationMonths: 36,
          monthlyPayment: 752.50,
          status: 'PENDING' as const,
          createdAt: '2026-01-03T10:00:00Z',
          applicantName: 'Jean Dupont',
          applicantEmail: 'jean.dupont@email.com',
        },
        {
          id: 'loan-pending-2',
          userId: 'user-2',
          accountId: 'acc-2',
          amount: 150000,
          interestRate: 0.035,
          insuranceRate: 0.003,
          durationMonths: 240,
          monthlyPayment: 870.25,
          status: 'PENDING' as const,
          createdAt: '2026-01-04T14:30:00Z',
          applicantName: 'Marie Martin',
          applicantEmail: 'marie.martin@email.com',
        },
        {
          id: 'loan-pending-3',
          userId: 'user-3',
          accountId: 'acc-3',
          amount: 15000,
          interestRate: 0.065,
          insuranceRate: 0.004,
          durationMonths: 24,
          monthlyPayment: 685.75,
          status: 'PENDING' as const,
          createdAt: '2026-01-05T09:15:00Z',
          applicantName: 'Pierre Durand',
          applicantEmail: 'pierre.durand@email.com',
        },
      ] as (Loan & { applicantName: string; applicantEmail: string })[];
    },
    refetchInterval: 30000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { conversationId: string; senderId: string; receiverId: string; content: string }) =>
      chatApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['advisorConversations', user?.id] });
      setMessageInput('');
    },
  });

  // Approve loan mutation
  const approveLoanMutation = useMutation({
    mutationFn: (loanId: string) => {
      // Mock approval - in real app, use adminApi.approveLoan
      return Promise.resolve({ id: loanId, status: 'APPROVED' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingLoansAdvisor'] });
      toast.success('Prêt approuvé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de l\'approbation du prêt');
    },
  });

  // Reject loan mutation
  const rejectLoanMutation = useMutation({
    mutationFn: (loanId: string) => {
      // Mock rejection - in real app, use adminApi.rejectLoan
      return Promise.resolve({ id: loanId, status: 'REJECTED' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingLoansAdvisor'] });
      toast.success('Prêt refusé');
    },
    onError: () => {
      toast.error('Erreur lors du refus du prêt');
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

  const totalUnread = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
          <UserCog className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Espace Conseiller</h1>
          <p className="text-sm md:text-base text-gray-500">Gérer les conversations clients et les demandes de prêt</p>
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
            <p className="text-xs text-gray-500">non lus</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              <span className="text-xs md:text-sm text-gray-500">Conversations</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{conversations?.length || 0}</div>
            <p className="text-xs text-gray-500">actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              <span className="text-xs md:text-sm text-gray-500">Prêts</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">{pendingLoans?.length || 0}</div>
            <p className="text-xs text-gray-500">en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              <span className="text-xs md:text-sm text-gray-500">Temps moyen</span>
            </div>
            <div className="text-lg md:text-2xl font-bold">~5min</div>
            <p className="text-xs text-gray-500">de réponse</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="chat" className="gap-2 flex-1 sm:flex-none">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Conversations</span>
            <span className="sm:hidden">Chat</span>
            {totalUnread > 0 && (
              <Badge className="ml-1 bg-blue-500">{totalUnread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="loans" className="gap-2 flex-1 sm:flex-none">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Demandes de prêt</span>
            <span className="sm:hidden">Prêts</span>
            {pendingLoans && pendingLoans.length > 0 && (
              <Badge className="ml-1 bg-orange-500">{pendingLoans.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-400px)] min-h-[400px]">
            {/* Conversations List */}
            <Card className={cn(
              "md:col-span-1 flex flex-col",
              selectedConversation && !showConversations ? "hidden md:flex" : "flex"
            )}>
              <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                <CardTitle className="text-base md:text-lg">Clients</CardTitle>
                <CardDescription className="text-xs md:text-sm">Conversations en cours</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {conversationsLoading ? (
                  <div className="text-center py-8 text-gray-500">Chargement...</div>
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
                              isSelected && 'bg-indigo-50'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-indigo-100 text-indigo-600">
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
                                    {conv.lastMessage?.content || 'Aucun message'}
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
                    <p className="text-sm">Aucune conversation</p>
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
                              {other?.profile.firstName?.charAt(0)}
                              {other?.profile.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm md:text-base">
                              {other?.profile.firstName} {other?.profile.lastName}
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
                        <div className="text-center py-8 text-gray-500">Chargement...</div>
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
                          <p className="text-sm">Aucun message</p>
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
                        placeholder="Tapez votre message..."
                        className="flex-1 text-sm md:text-base"
                      />
                      <Button
                        type="submit"
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
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
                    <p className="font-medium text-sm md:text-base">Sélectionnez une conversation</p>
                    <p className="text-xs md:text-sm mt-1">Choisissez un client pour commencer</p>
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
              <CardTitle className="text-lg md:text-xl">Demandes de prêt en attente</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Examinez et traitez les demandes de prêt des clients
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              {loansLoading ? (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
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
                              <p className="text-gray-500 text-xs">Montant</p>
                              <p className="font-semibold">{formatCurrency(loan.amount, 'EUR')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Durée</p>
                              <p className="font-semibold">{loan.durationMonths} mois</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Taux</p>
                              <p className="font-semibold">{(loan.interestRate * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Mensualité</p>
                              <p className="font-semibold">{formatCurrency(loan.monthlyPayment, 'EUR')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Demandé le {new Date(loan.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 md:flex-col">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="flex-1 md:flex-none gap-2 bg-green-600 hover:bg-green-700">
                                <Check className="h-4 w-4" />
                                <span className="hidden sm:inline">Approuver</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approuver le prêt</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir approuver ce prêt de{' '}
                                  {formatCurrency(loan.amount, 'EUR')} pour {loan.applicantName} ?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => approveLoanMutation.mutate(loan.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approuver
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="flex-1 md:flex-none gap-2">
                                <X className="h-4 w-4" />
                                <span className="hidden sm:inline">Refuser</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Refuser le prêt</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir refuser cette demande de prêt ?
                                  Cette action ne peut pas être annulée.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => rejectLoanMutation.mutate(loan.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Refuser
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
                  <p className="text-lg font-medium">Aucune demande en attente</p>
                  <p className="text-sm mt-1">Toutes les demandes de prêt ont été traitées</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
