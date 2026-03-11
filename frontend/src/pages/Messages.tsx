import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { messageService } from '@/services/message.service';
import type { Conversation, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Loader2,
  MessageSquare,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Messages = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, sendMessage } = useSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load specific conversation if ID provided
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  // Socket listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_message', (data: { message: Message }) => {
        if (data.message.conversation === conversationId) {
          setMessages(prev => [...prev, data.message]);
        }
        // Update conversations list
        fetchConversations();
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket, conversationId]);

  // Join/leave conversation room
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
      return () => {
        leaveConversation(conversationId);
      };
    }
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await messageService.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to load conversations');
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      setIsLoading(true);
      const [messagesRes, conversationRes] = await Promise.all([
        messageService.getMessages(id),
        messageService.getConversation(id)
      ]);
      setMessages(messagesRes.messages);
      setActiveConversation(conversationRes.conversation);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setIsSending(true);
    try {
      const recipient = activeConversation.participants.find(
        p => p._id !== user?.id
      );

      if (recipient) {
        // Send via API first
        await messageService.sendMessage({
          recipientId: recipient._id,
          content: newMessage,
          conversationId: activeConversation._id
        });

        // Also emit via socket
        sendMessage({
          recipientId: recipient._id,
          content: newMessage,
          conversationId: activeConversation._id
        });

        setNewMessage('');
        
        // Refresh messages
        if (conversationId) {
          fetchMessages(conversationId);
        }
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    navigate(`/dashboard/messages/${conversation._id}`);
  };

  if (!conversationId) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-80 hidden md:flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <h2 className="font-semibold mb-4">Messages</h2>
          <ScrollArea className="flex-1 -mx-2">
            <div className="space-y-2 px-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  onClick={() => selectConversation(conversation)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    conversationId === conversation._id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.otherParticipant?.profilePicture} />
                    <AvatarFallback>
                      {conversation.otherParticipant?.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conversation.otherParticipant?.firstName} {conversation.otherParticipant?.lastName}
                    </p>
                    <p className="text-xs truncate opacity-70">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {activeConversation && (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activeConversation.otherParticipant?.profilePicture} />
                  <AvatarFallback>
                    {activeConversation.otherParticipant?.firstName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {activeConversation.otherParticipant?.firstName} {activeConversation.otherParticipant?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{activeConversation.otherParticipant?.username}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.sender._id === user?.id;
                    const showDate = index === 0 || 
                      new Date(messages[index - 1].createdAt).toDateString() !== 
                      new Date(message.createdAt).toDateString();

                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              {format(new Date(message.createdAt), 'MMMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender.profilePicture} />
                              <AvatarFallback>{message.sender.firstName[0]}</AvatarFallback>
                            </Avatar>
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p>{message.content}</p>
                              <span className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {format(new Date(message.createdAt), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default Messages;