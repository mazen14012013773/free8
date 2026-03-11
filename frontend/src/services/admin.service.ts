import api from './api';
import type { User, Service, Order, Report, Pagination } from '@/types';

export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<any> {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Users
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ users: User[]; pagination: Pagination }> {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<{ message: string; user: User }> {
    const response = await api.put(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },

  async updateUserRole(id: string, role: 'client' | 'freelancer' | 'admin'): Promise<{ message: string; user: User }> {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  // Services
  async getServices(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  } = {}): Promise<{ services: Service[]; pagination: Pagination }> {
    const response = await api.get('/admin/services', { params });
    return response.data;
  },

  async updateServiceStatus(id: string, status: 'active' | 'paused' | 'suspended' | 'draft'): Promise<{ message: string; service: Service }> {
    const response = await api.put(`/admin/services/${id}/status`, { status });
    return response.data;
  },

  // Orders
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ orders: Order[]; pagination: Pagination }> {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  // Reports
  async getReports(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    type?: string;
  } = {}): Promise<{ reports: Report[]; pagination: Pagination }> {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },

  async assignReport(id: string): Promise<{ message: string; report: Report }> {
    const response = await api.put(`/admin/reports/${id}/assign`);
    return response.data;
  },

  async resolveReport(id: string, action: string, notes: string): Promise<{ message: string; report: Report }> {
    const response = await api.put(`/admin/reports/${id}/resolve`, { action, notes });
    return response.data;
  },

  async dismissReport(id: string, notes: string): Promise<{ message: string; report: Report }> {
    const response = await api.put(`/admin/reports/${id}/dismiss`, { notes });
    return response.data;
  },

  // Analytics
  async getAnalytics(period: number = 30): Promise<any> {
    const response = await api.get('/admin/analytics', { params: { period } });
    return response.data;
  }
};
