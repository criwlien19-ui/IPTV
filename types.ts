export enum Status {
  ACTIVE = 'Active',
  EXPIRED = 'Expiré',
  PENDING = 'En attente',
  TRIAL = 'Essai'
}

export type UserRole = 'admin' | 'reseller';

export interface User {
  id: string;
  username: string;
  password: string; // Stocké en clair pour cette démo (à ne pas faire en prod)
  fullName: string;
  role: UserRole;
  credits?: number; // Pour une future évolution
}

export interface Offer {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  maxConnections: number;
  description: string;
  imageUrl?: string;
}

export interface Subscriber {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  offerId: string;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  status: Status;
  notes?: string;
  macAddress?: string;
  resellerId: string; // ID de l'utilisateur qui a créé l'abonné
}

export interface DashboardStats {
  totalRevenue: number;
  activeSubscribers: number;
  expiringSoon: number; // Expires within 7 days
  churnRate: number;
}

export type Tab = 'dashboard' | 'subscribers' | 'offers' | 'ai-assistant' | 'resellers';