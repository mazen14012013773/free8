import api from './api';
import type { Review, Pagination } from '@/types';

interface CreateReviewData {
  orderId: string;
  rating: number;
  review: string;
  communication?: number;
  serviceQuality?: number;
  recommend?: boolean;
}

interface AddResponseData {
  message: string;
}

export const reviewService = {
  async getReviews(params: {
    serviceId?: string;
    freelancerId?: string;
    page?: number;
    limit?: number;
    minRating?: number;
    maxRating?: number;
    sortBy?: string;
  } = {}): Promise<{ reviews: Review[]; ratingDistribution: any[]; pagination: Pagination }> {
    const response = await api.get('/reviews', { params });
    return response.data;
  },

  async getReview(id: string): Promise<{ review: Review }> {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  async createReview(data: CreateReviewData): Promise<{ message: string; review: Review }> {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  async addResponse(id: string, data: AddResponseData): Promise<{ message: string; review: Review }> {
    const response = await api.put(`/reviews/${id}/response`, data);
    return response.data;
  },

  async markHelpful(id: string): Promise<{ message: string; helpfulCount: number }> {
    const response = await api.post(`/reviews/${id}/helpful`);
    return response.data;
  },

  async removeHelpful(id: string): Promise<{ message: string; helpfulCount: number }> {
    const response = await api.delete(`/reviews/${id}/helpful`);
    return response.data;
  },

  async getFreelancerStats(freelancerId: string): Promise<{ stats: any; ratingDistribution: any[] }> {
    const response = await api.get(`/reviews/freelancer/${freelancerId}/stats`);
    return response.data;
  }
};
