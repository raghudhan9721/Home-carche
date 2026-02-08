// User Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  location: string;
  role: 'customer';
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  services: string[];
  experience: string;
  address: string;
  availability: string;
  pricing: string;
  photo: string;
  idProof: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  role: 'partner';
  totalEarnings: number;
  pendingEarnings: number;
  createdAt: string;
}

export type User = Customer | Partner;

// Booking Types
export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  partnerId: string;
  partnerName: string;
  service: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  amount: number;
  platformFee: number;
  partnerAmount: number;
  paymentStatus: 'pending' | 'completed';
  createdAt: string;
}

// Service Category
export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalBookings: number;
  pendingRequests: number;
  completedBookings: number;
  totalEarnings: number;
  pendingEarnings: number;
  rating: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  phone: string;
  email: string;
  password: string;
  location: string;
  services: string[];
  experience: string;
  address: string;
  availability: string;
  pricing: string;
}

export interface BookingForm {
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes: string;
}
