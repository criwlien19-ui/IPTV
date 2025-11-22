import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Tag, Sparkles, Menu, X, Tv, AlertTriangle, ChevronRight, UserPlus, LogOut, Shield, Loader2, Wifi } from 'lucide-react';
import { Subscriber, Offer, Status, User } from './types';
import * as Storage from './services/storageService';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './components/Dashboard';
import SubscribersList from './components/SubscribersList';
import OffersList from './components/OffersList';
import AIAssistant from './components/AIAssistant';
import Login from './components/Login';
import ResellersList from './components/ResellersList';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
        }`}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </Link>
    );
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // State pour stocker les infos des revendeurs
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  // Initial Load
  useEffect(() => {
    const init = async () => {
        const currentUser = Storage.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
        // Initial check and seed
        const connected = await Storage.checkConnection();
        setDbConnected(connected);
        if (connected) {
            await Storage.initDatabase();
        }
    };
    init();
  }, []);

  // Realtime Subscription & Initial Fetch
  useEffect(() => {
    if (!user || !dbConnected) return;

    // 1. Fetch initial data
    refreshData();

    // 2. Subscribe to realtime changes
    const unsubscribe = Storage.subscribeToDataChanges(() => {
       // When DB changes, re-fetch data
       refreshData(true); // Pass true to indicate background refresh
    });

    return () => {
        unsubscribe();
    };
  }, [user, dbConnected]);

  const refreshData = async (isBackground = false) => {
      if (!isBackground) setLoadingData(true);
      try {
        const [subs, offs] = await Promise.all([
            Storage.getSubscribers(),
            Storage.getOffers()
        ]);
        
        setOffers(offs);
        
        // Filter based on role
        if (user?.role === 'admin') {
            setSubscribers(subs);
            // L'admin a besoin de la liste des utilisateurs pour afficher les noms des revendeurs
            const usersList = await Storage.getUsers();
            setAllUsers(usersList);
        } else if (user) {
            setSubscribers(subs.filter(s => s.resellerId === user.id));
            setAllUsers([]);
        }
      } catch (e) {
          console.error("Failed to load data", e);
      } finally {
          if (!isBackground) setLoadingData(false);
      }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    Storage.logoutUser();
    setUser(null);
  };

  // CRUD Handlers
  // Note: We don't strictly need to call refreshData() here anymore because 
  // the Realtime subscription will catch the change and trigger it.
  // However, keeping it ensures instant UI updates even if realtime lags slightly.
  const handleAddSubscriber = async (sub: Subscriber) => {
    await Storage.saveSubscriber(sub);
    await refreshData();
  };

  const handleEditSubscriber = async (sub: Subscriber) => {
    await Storage.saveSubscriber(sub);
    await refreshData();
  };

  const handleDeleteSubscriber = async (id: string) => {
    await Storage.deleteSubscriber(id);
    await refreshData();
  };

  const handleSaveOffer = async (offer: Offer) => {
    await Storage.saveOffer(offer);
    // Fetch logic is inside refreshData which is triggered by realtime or manual call
    // But explicit call here for safety
    const offs = await Storage.getOffers();
    setOffers(offs);
  };

  const handleDeleteOffer = async (id: string) => {
    await Storage.deleteOffer(id);
    const offs = await Storage.getOffers();
    setOffers(offs);
  };


  // Notifications Logic
  const expiringCount = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return subscribers.filter(s => {
        const end = new Date(s.endDate);
        return s.status === Status.ACTIVE && end > now && end <= sevenDaysFromNow;
    }).length;
  }, [subscribers]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!dbConnected) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-6">
            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-xl max-w-md text-center">
                <AlertTriangle size={48} className="mx-auto text-rose-500 mb-4"/>
                <h1 className="text-2xl font-bold mb-2">Erreur de Connexion Supabase</h1>
                <p className="text-slate-300 mb-4">L'application n'arrive pas à se connecter à la base de données.</p>
                <p className="text-xs text-slate-500 font-mono bg-slate-900 p-2 rounded">
                    Veuillez vérifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans vos variables d'environnement.
                </p>
            </div>
        </div>
      )
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-2 rounded-lg">
             <Tv size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg">ALL IPTV</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 mb-2">
          <div className="bg-brand-600 p-2.5 rounded-xl shadow-lg shadow-brand-500/20">
            <Tv size={24} className="text-white" />
          </div>
          <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ALL IPTV</h1>
              <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Panel Admin</span>
          </div>
        </div>

        {/* User Profile Snippet */}
        <div className="mx-4 mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-4">Menu Principal</div>
          <NavItem 
            to="/" 
            icon={<LayoutDashboard size={20} />} 
            label="Tableau de Bord" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <NavItem 
            to="/subscribers" 
            icon={<Users size={20} />} 
            label="Abonnés" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <NavItem 
            to="/offers" 
            icon={<Tag size={20} />} 
            label="Offres & Plans" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          
          {user.role === 'admin' && (
            <>
                 <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-6">Administration</div>
                 <NavItem 
                    to="/resellers" 
                    icon={<UserPlus size={20} />} 
                    label="Revendeurs" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                 />
            </>
          )}

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-6">Outils</div>
          <NavItem 
            to="/ai-assistant" 
            icon={<Sparkles size={20} />} 
            label="Assistant IA" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-2 justify-center mb-4 text-xs text-slate-500">
               <span className="flex items-center gap-1"><Wifi size={12} className="text-emerald-500"/> DB Connecté & Live</span>
            </div>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
            >
                <LogOut size={20} />
                <span className="font-medium">Déconnexion</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-950 relative pt-16 md:pt-0">
        
        {/* Notification Banner */}
        {showNotification && expiringCount > 0 && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 text-amber-400">
                    <AlertTriangle size={18} className="animate-pulse" />
                    <span className="text-sm font-medium">
                        Attention : <span className="font-bold">{expiringCount}</span> abonnement(s) expirent dans les 7 prochains jours.
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/subscribers" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                        Voir la liste <ChevronRight size={14} />
                    </Link>
                    <button onClick={() => setShowNotification(false)} className="text-amber-400/60 hover:text-amber-400">
                        <X size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* Routes */}
        <div className="flex-1 overflow-hidden relative">
            {loadingData && (
                <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-slate-800 p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
                        <Loader2 className="animate-spin text-brand-500" />
                        <span className="font-medium">Chargement des données...</span>
                    </div>
                </div>
            )}
            <Routes>
            <Route path="/" element={<Dashboard subscribers={subscribers} offers={offers} />} />
            <Route 
                path="/subscribers" 
                element={
                <SubscribersList 
                    subscribers={subscribers} 
                    offers={offers} 
                    currentUser={user}
                    allUsers={allUsers}
                    onAdd={handleAddSubscriber} 
                    onEdit={handleEditSubscriber} 
                    onDelete={handleDeleteSubscriber} 
                />
                } 
            />
            <Route 
                path="/offers" 
                element={
                <OffersList 
                    offers={offers} 
                    userRole={user.role}
                    onSave={handleSaveOffer} 
                    onDelete={handleDeleteOffer} 
                />
                } 
            />
            <Route path="/ai-assistant" element={<AIAssistant subscribers={subscribers} offers={offers} />} />
            <Route 
                path="/resellers" 
                element={
                    user.role === 'admin' ? <ResellersList /> : <Navigate to="/" />
                } 
            />
            <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

export default App;