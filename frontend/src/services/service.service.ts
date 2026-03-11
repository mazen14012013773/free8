import api from './api';
import type { Service, Category, Pagination } from '@/types';

interface CreateServiceData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  packages: any[];
  faq?: { question: string; answer: string }[];
  requirements?: string[];
  serviceImages?: File[];
}

interface UpdateServiceData extends Partial<CreateServiceData> {
  keepExistingImages?: string;
}

export const serviceService = {
  async getServices(params: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    deliveryTime?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    freelancerId?: string;
  } = {}): Promise<{ services: Service[]; pagination: Pagination }> {
    const response = await api.get('/services', { params });
    return response.data;
  },

  async getCategories(): Promise<{ categories: Category[] }> {
    const response = await api.get('/services/categories');
    return response.data;
  },

  async getFeaturedServices(limit: number = 8): Promise<{ services: Service[] }> {
    const response = await api.get('/services/featured', { params: { limit } });
    return response.data;
  },

  async getService(id: string): Promise<{ service: Service; reviews: any[]; moreServices: any[] }> {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  async createService(data: CreateServiceData): Promise<{ message: string; service: Service }> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('subcategory', data.subcategory);
    formData.append('tags', JSON.stringify(data.tags));
    formData.append('packages', JSON.stringify(data.packages));
    
    if (data.faq) formData.append('faq', JSON.stringify(data.faq));
    if (data.requirements) formData.append('requirements', JSON.stringify(data.requirements));
    
    if (data.serviceImages) {
      data.serviceImages.forEach(image => {
        formData.append('serviceImages', image);
      });
    }
    
    const response = await api.post('/services', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async updateService(id: string, data: UpdateServiceData): Promise<{ message: string; service: Service }> {
    const formData = new FormData();
    
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.subcategory) formData.append('subcategory', data.subcategory);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.packages) formData.append('packages', JSON.stringify(data.packages));
    if (data.faq) formData.append('faq', JSON.stringify(data.faq));
    if (data.requirements) formData.append('requirements', JSON.stringify(data.requirements));
    if (data.keepExistingImages) formData.append('keepExistingImages', data.keepExistingImages);
    
    if (data.serviceImages) {
      data.serviceImages.forEach(image => {
        formData.append('serviceImages', image);
      });
    }
    
    const response = await api.put(`/services/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteService(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  async updateServiceStatus(id: string, status: 'active' | 'paused' | 'draft'): Promise<{ message: string; service: Service }> {
    const response = await api.put(`/services/${id}/status`, { status });
    return response.data;
  }
};
