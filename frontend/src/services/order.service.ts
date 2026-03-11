import api from './api';
import type { Order, Pagination } from '@/types';

interface CreateOrderData {
  serviceId: string;
  packageName: 'basic' | 'standard' | 'premium';
  requirements: string;
}

interface DeliverOrderData {
  deliveryNotes: string;
  deliverables?: File[];
}

interface SendMessageData {
  message: string;
  attachments?: File[];
}

export const orderService = {
  async getOrders(params: {
    status?: string;
    role?: 'client' | 'freelancer';
    page?: number;
    limit?: number;
  } = {}): Promise<{ orders: Order[]; pagination: Pagination }> {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getOrder(id: string): Promise<{ order: Order }> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async createOrder(data: CreateOrderData): Promise<{ message: string; order: Order }> {
    const response = await api.post('/orders', data);
    return response.data;
  },

  async acceptOrder(id: string): Promise<{ message: string; order: Order }> {
    const response = await api.put(`/orders/${id}/accept`);
    return response.data;
  },

  async deliverOrder(id: string, data: DeliverOrderData): Promise<{ message: string; order: Order }> {
    const formData = new FormData();
    formData.append('deliveryNotes', data.deliveryNotes);
    
    if (data.deliverables) {
      data.deliverables.forEach(file => {
        formData.append('deliverables', file);
      });
    }
    
    const response = await api.put(`/orders/${id}/deliver`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async requestRevision(id: string, reason: string): Promise<{ message: string; order: Order }> {
    const response = await api.put(`/orders/${id}/revision`, { reason });
    return response.data;
  },

  async completeOrder(id: string): Promise<{ message: string; order: Order }> {
    const response = await api.put(`/orders/${id}/complete`);
    return response.data;
  },

  async cancelOrder(id: string, reason: string): Promise<{ message: string; order: Order }> {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  async sendMessage(id: string, data: SendMessageData): Promise<{ message: string; orderMessage: any }> {
    const formData = new FormData();
    if (data.message) formData.append('message', data.message);
    
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.post(`/orders/${id}/message`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
