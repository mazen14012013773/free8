import api from './api';
import type { Conversation, Message, Pagination } from '@/types';

interface SendMessageData {
  recipientId: string;
  content: string;
  conversationId?: string;
  attachments?: File[];
}

export const messageService = {
  async getConversations(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ conversations: Conversation[]; pagination: Pagination }> {
    const response = await api.get('/messages/conversations', { params });
    return response.data;
  },

  async getConversation(conversationId: string): Promise<{ conversation: Conversation }> {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  async startConversation(recipientId: string): Promise<{ message: string; conversation: Conversation }> {
    const response = await api.post('/messages/conversations', { recipientId });
    return response.data;
  },

  async getMessages(conversationId: string, params: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ messages: Message[]; pagination: Pagination }> {
    const response = await api.get(`/messages/conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  async sendMessage(data: SendMessageData): Promise<{ message: string; messageData: Message }> {
    const formData = new FormData();
    formData.append('recipientId', data.recipientId);
    if (data.content) formData.append('content', data.content);
    if (data.conversationId) formData.append('conversationId', data.conversationId);
    
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.post('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async markAsRead(messageId: string): Promise<{ message: string }> {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },

  async deleteMessage(messageId: string): Promise<{ message: string }> {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },

  async addReaction(messageId: string, emoji: string): Promise<{ message: string; reactions: any[] }> {
    const response = await api.post(`/messages/${messageId}/reaction`, { emoji });
    return response.data;
  },

  async removeReaction(messageId: string): Promise<{ message: string; reactions: any[] }> {
    const response = await api.delete(`/messages/${messageId}/reaction`);
    return response.data;
  }
};
