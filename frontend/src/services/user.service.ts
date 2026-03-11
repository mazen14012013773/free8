import api from './api';
import type { User, Pagination } from '@/types';

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  skills?: string[];
  languages?: { language: string; level: string }[];
  location?: { country?: string; city?: string; timezone?: string };
}

interface PortfolioItemData {
  title: string;
  description?: string;
  link?: string;
  portfolioImage?: File;
}

export const userService = {
  async getProfile(username: string): Promise<{ user: User; reviews: any[]; moreServices: any[] }> {
    const response = await api.get(`/users/profile/${username}`);
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: User }> {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  async uploadProfilePicture(file: File): Promise<{ message: string; profilePicture: string; user: User }> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await api.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async addPortfolioItem(data: PortfolioItemData): Promise<{ message: string; portfolio: any[] }> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.link) formData.append('link', data.link);
    if (data.portfolioImage) formData.append('portfolioImage', data.portfolioImage);
    
    const response = await api.post('/users/portfolio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deletePortfolioItem(itemId: string): Promise<{ message: string; portfolio: any[] }> {
    const response = await api.delete(`/users/portfolio/${itemId}`);
    return response.data;
  },

  async getFreelancers(params: {
    page?: number;
    limit?: number;
    skill?: string;
    minRating?: number;
    search?: string;
    sortBy?: string;
  } = {}): Promise<{ freelancers: User[]; pagination: Pagination }> {
    const response = await api.get('/users/freelancers', { params });
    return response.data;
  },

  async getStats(): Promise<any> {
    const response = await api.get('/users/stats');
    return response.data;
  },

  async switchRole(role: 'client' | 'freelancer'): Promise<{ message: string; user: User }> {
    const response = await api.put('/users/role', { role });
    return response.data;
  }
};
