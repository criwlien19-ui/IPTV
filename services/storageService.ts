import { Subscriber, Offer, Status, User } from '../types';

const SUBS_KEY = 'iptv_subscribers';
const OFFERS_KEY = 'iptv_offers';
const USERS_KEY = 'iptv_users';
const CURRENT_USER_KEY = 'iptv_current_user';

// Initial Data Seeding
// Conversion approximative : 10€ ~ 6500 XOF
const INITIAL_OFFERS: Offer[] = [
  { id: '1', name: 'Pack Basic', price: 6500, durationMonths: 1, maxConnections: 1, description: 'Accès SD/HD, 1 écran' },
  { id: '2', name: 'Pack Gold', price: 16500, durationMonths: 3, maxConnections: 2, description: 'Accès FHD/4K, 2 écrans, VOD incluse' },
  { id: '3', name: 'Pack Platinum', price: 52000, durationMonths: 12, maxConnections: 4, description: 'Accès VIP, 4 écrans, Séries+Films' },
];

// Initial Admin User
const INITIAL_ADMIN: User = {
  id: 'admin',
  username: 'admin',
  password: 'admin', // Mot de passe par défaut
  fullName: 'Administrateur Principal',
  role: 'admin'
};

const INITIAL_SUBS: Subscriber[] = [
  { 
    id: '101', 
    fullName: 'Jean Dupont', 
    email: 'jean.d@example.com', 
    offerId: '2', 
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), 
    status: Status.ACTIVE,
    macAddress: '00:1A:2B:3C:4D:5E',
    resellerId: 'admin'
  },
  { 
    id: '102', 
    fullName: 'Marie Curier', 
    email: 'marie.c@example.com', 
    offerId: '1', 
    startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
    status: Status.ACTIVE, // Expires soon
    notes: 'Client fidèle, proposer promo',
    resellerId: 'admin'
  },
  { 
    id: '103', 
    fullName: 'Paul Martin', 
    email: 'paul.m@example.com', 
    offerId: '3', 
    startDate: new Date(Date.now() - 370 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    status: Status.EXPIRED,
    resellerId: 'admin'
  }
];

// --- Users ---

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify([INITIAL_ADMIN]));
    return [INITIAL_ADMIN];
  }
  return JSON.parse(data);
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const deleteUser = (id: string): void => {
  if (id === 'admin') return; // Cannot delete main admin
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const loginUser = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// --- Offers ---

export const getOffers = (): Offer[] => {
  const data = localStorage.getItem(OFFERS_KEY);
  if (!data) {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(INITIAL_OFFERS));
    return INITIAL_OFFERS;
  }
  return JSON.parse(data);
};

export const saveOffer = (offer: Offer): void => {
  const offers = getOffers();
  const existingIndex = offers.findIndex(o => o.id === offer.id);
  if (existingIndex >= 0) {
    offers[existingIndex] = offer;
  } else {
    offers.push(offer);
  }
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
};

export const deleteOffer = (id: string): void => {
  const offers = getOffers().filter(o => o.id !== id);
  localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
};

export const getOfferById = (id: string): Offer | undefined => {
  return getOffers().find(o => o.id === id);
};

// --- Subscribers ---

export const getSubscribers = (): Subscriber[] => {
  const data = localStorage.getItem(SUBS_KEY);
  let subs: Subscriber[] = [];
  
  if (!data) {
    localStorage.setItem(SUBS_KEY, JSON.stringify(INITIAL_SUBS));
    subs = INITIAL_SUBS;
  } else {
    subs = JSON.parse(data);
  }

  // Migration logic: ensure all subs have a resellerId if old data exists
  let modified = false;
  subs = subs.map(s => {
      if (!s.resellerId) {
          modified = true;
          return { ...s, resellerId: 'admin' };
      }
      return s;
  });
  
  if (modified) {
      localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
  }

  return subs;
};

export const saveSubscriber = (sub: Subscriber): void => {
  const subs = getSubscribers();
  const existingIndex = subs.findIndex(s => s.id === sub.id);
  if (existingIndex >= 0) {
    subs[existingIndex] = sub;
  } else {
    subs.push(sub);
  }
  localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
};

export const deleteSubscriber = (id: string): void => {
  const subs = getSubscribers().filter(s => s.id !== id);
  localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
};