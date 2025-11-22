
import { createClient } from '@supabase/supabase-js';
import { Subscriber, Offer, Status, User } from '../types';

// Fonction sécurisée pour récupérer les variables d'environnement
// Empêche le crash si import.meta.env est indéfini
const getEnv = (key: string, defaultValue: string): string => {
  let value: string | undefined;

  try {
    // Essai via Vite (import.meta.env)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      value = import.meta.env[key];
    }
  } catch (e) {
    console.warn('Error accessing import.meta.env', e);
  }

  // Fallback via process.env (si injecté via vite.config.ts define)
  if (!value) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        value = process.env[key];
      }
    } catch (e) {
      // Ignore errors accessing process
    }
  }

  return value || defaultValue;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://yemkrwzlzlmuryfeycsv.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbWtyd3psemxtdXJ5ZmV5Y3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjE5NTAsImV4cCI6MjA3OTM5Nzk1MH0.bS9XphH4UIHCBFMezAzVlE7NzlieGXhddcBfjSjbXJQ');

// Initialisation du client, gestion du cas où les clés manquent ou sont invalides
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const CURRENT_USER_KEY = 'iptv_current_user';

// --- Mappers (DB Snake Case <-> App Camel Case) ---
const mapUserFromDB = (u: any): User => ({
  id: u.id,
  username: u.username,
  password: u.password,
  fullName: u.full_name,
  role: u.role as any,
});

const mapOfferFromDB = (o: any): Offer => ({
  id: o.id,
  name: o.name,
  price: o.price,
  durationMonths: o.duration_months,
  maxConnections: o.max_connections,
  description: o.description,
  imageUrl: o.image_url
});

const mapSubscriberFromDB = (s: any): Subscriber => ({
  id: s.id,
  fullName: s.full_name,
  email: s.email,
  phone: s.phone,
  offerId: s.offer_id,
  startDate: s.start_date,
  endDate: s.end_date,
  status: s.status as Status,
  notes: s.notes,
  macAddress: s.mac_address,
  resellerId: s.reseller_id
});

// --- Seed Data (Fallback) ---
const INITIAL_OFFERS = [
  { id: '1', name: 'Pack Basic', price: 6500, duration_months: 1, max_connections: 1, description: 'Accès SD/HD, 1 écran' },
  { id: '2', name: 'Pack Gold', price: 16500, duration_months: 3, max_connections: 2, description: 'Accès FHD/4K, 2 écrans, VOD incluse' },
  { id: '3', name: 'Pack Platinum', price: 52000, duration_months: 12, max_connections: 4, description: 'Accès VIP, 4 écrans, Séries+Films' },
];

const INITIAL_ADMIN = {
  id: 'admin',
  username: 'admin',
  password: 'admin',
  full_name: 'Administrateur Principal',
  role: 'admin'
};

// --- Service Methods ---

export const checkConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      return !error;
    } catch (e) {
      console.error("Connection check failed:", e);
      return false;
    }
};

export const initDatabase = async () => {
    if (!supabase) return;

    try {
      // Check if admin exists
      const { data: users } = await supabase.from('users').select('*').eq('username', 'admin');
      if (!users || users.length === 0) {
          await supabase.from('users').insert([INITIAL_ADMIN]);
          console.log('Admin user seeded');
      }

      // Check if offers exist
      const { data: offers } = await supabase.from('offers').select('*');
      if (!offers || offers.length === 0) {
          await supabase.from('offers').insert(INITIAL_OFFERS);
          console.log('Initial offers seeded');
      }
    } catch (e) {
      console.error("Error seeding database:", e);
    }
};

/**
 * Subscribes to realtime changes in the database
 * Triggers the callback whenever a change occurs in subscribers or offers
 */
export const subscribeToDataChanges = (callback: () => void) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('public-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
      },
      (payload) => {
        console.log('Realtime change received:', payload);
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// --- Users ---

export const getUsers = async (): Promise<User[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('users').select('*');
  if (error) { console.error(error); return []; }
  return data.map(mapUserFromDB);
};

export const saveUser = async (user: User): Promise<void> => {
  if (!supabase) return;
  const dbUser = {
      id: user.id,
      username: user.username,
      password: user.password,
      full_name: user.fullName,
      role: user.role
  };
  const { error } = await supabase.from('users').upsert(dbUser);
  if (error) console.error('Error saving user:', error);
};

export const deleteUser = async (id: string): Promise<void> => {
  if (!supabase || id === 'admin') return;
  await supabase.from('users').delete().eq('id', id);
};

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) return null;

  const user = mapUserFromDB(data);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// --- Offers ---

export const getOffers = async (): Promise<Offer[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('offers').select('*');
  if (error) { console.error(error); return []; }
  return data.map(mapOfferFromDB);
};

export const saveOffer = async (offer: Offer): Promise<void> => {
  if (!supabase) return;
  const dbOffer = {
    id: offer.id,
    name: offer.name,
    price: offer.price,
    duration_months: offer.durationMonths,
    max_connections: offer.maxConnections,
    description: offer.description,
    image_url: offer.imageUrl
  };
  const { error } = await supabase.from('offers').upsert(dbOffer);
  if (error) console.error('Error saving offer:', error);
};

export const deleteOffer = async (id: string): Promise<void> => {
  if (!supabase) return;
  await supabase.from('offers').delete().eq('id', id);
};

// --- Subscribers ---

export const getSubscribers = async (): Promise<Subscriber[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('subscribers').select('*');
  if (error) { console.error(error); return []; }
  return data.map(mapSubscriberFromDB);
};

export const saveSubscriber = async (sub: Subscriber): Promise<void> => {
  if (!supabase) return;
  const dbSub = {
    id: sub.id,
    full_name: sub.fullName,
    email: sub.email,
    phone: sub.phone,
    offer_id: sub.offerId,
    start_date: sub.startDate,
    end_date: sub.endDate,
    status: sub.status,
    notes: sub.notes,
    mac_address: sub.macAddress,
    reseller_id: sub.resellerId
  };
  const { error } = await supabase.from('subscribers').upsert(dbSub);
  if (error) console.error('Error saving subscriber:', error);
};

export const deleteSubscriber = async (id: string): Promise<void> => {
  if (!supabase) return;
  await supabase.from('subscribers').delete().eq('id', id);
};
