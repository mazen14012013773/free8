export interface User {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: 'client' | 'freelancer' | 'admin';
  profilePicture?: string;
  bio?: string;
  skills?: string[];
  languages?: { language: string; level: string }[];
  location?: { country?: string; city?: string; timezone?: string };
  portfolio?: PortfolioItem[];
  education?: Education[];
  experience?: Experience[];
  ratings?: {
    average: number;
    count: number;
  };
  earnings?: {
    total: number;
    pending: number;
    withdrawn: number;
  };
  wallet?: {
    balance: number;
  };
  memberSince?: string;
  lastActive?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface PortfolioItem {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  createdAt: string;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
}

export interface Experience {
  company: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Service {
  _id: string;
  title: string;
  description: string;
  freelancer: User;
  category: string;
  subcategory: string;
  tags: string[];
  images: string[];
  video?: string;
  packages: Package[];
  faq?: { question: string; answer: string }[];
  requirements?: string[];
  ratings: {
    average: number;
    count: number;
  };
  ordersCompleted: number;
  views: number;
  status: 'draft' | 'active' | 'paused' | 'suspended';
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  name: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  deliveryTime: number;
  revisions: number;
  features: string[];
}

export interface Order {
  _id: string;
  orderNumber: string;
  service: Service;
  package: Package;
  client: User;
  freelancer: User;
  requirements: string;
  attachments?: { filename: string; url: string; uploadedAt: string }[];
  status: 'pending' | 'active' | 'delivered' | 'revision' | 'completed' | 'cancelled' | 'disputed';
  price: number;
  deliveryDate: string;
  deliveredAt?: string;
  completedAt?: string;
  revisionsLeft: number;
  revisionHistory?: {
    requestedAt: string;
    reason: string;
    response?: string;
    respondedAt?: string;
  }[];
  deliveryNotes?: string;
  deliveredFiles?: { filename: string; url: string; uploadedAt: string }[];
  review?: Review;
  paymentStatus: 'pending' | 'held' | 'released' | 'refunded';
  platformFee: number;
  freelancerEarnings: number;
  messages?: OrderMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderMessage {
  sender: User;
  message: string;
  attachments?: { filename: string; url: string }[];
  sentAt: string;
}

export interface Review {
  _id: string;
  order: string;
  service: Service;
  reviewer: User;
  freelancer: User;
  rating: number;
  communication?: number;
  serviceQuality?: number;
  recommend: boolean;
  review: string;
  freelancerResponse?: {
    message: string;
    respondedAt: string;
  };
  helpful?: {
    count: number;
    users: string[];
  };
  isVisible: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  otherParticipant?: User;
  type: 'direct' | 'order';
  order?: Order;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  recipient: string;
  content: string;
  attachments?: {
    filename: string;
    url: string;
    type: 'image' | 'document' | 'audio' | 'video';
    size: number;
  }[];
  isRead: boolean;
  readAt?: string;
  replyTo?: Message;
  reactions?: {
    user: string;
    emoji: string;
  }[];
  createdAt: string;
}

export interface Report {
  _id: string;
  reporter: User;
  reported: User;
  type: 'user' | 'service' | 'order' | 'message' | 'review';
  target: string;
  reason: string;
  description?: string;
  evidence?: { filename: string; url: string }[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: User;
  resolution?: {
    action: 'none' | 'warning' | 'suspension' | 'ban' | 'content_removed' | 'refund_issued';
    notes: string;
    resolvedAt: string;
    resolvedBy: string;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  serviceCount?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  orders: {
    asClient: {
      total: number;
      active: number;
      completed: number;
    };
    asFreelancer: {
      total: number;
      active: number;
      completed: number;
    };
  };
  services: number;
  earnings: {
    total: number;
    pending: number;
    withdrawn: number;
  };
  wallet: {
    balance: number;
  };
}