import React, { useMemo } from 'react';
import { Subscriber, Offer, Status } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  subscribers: Subscriber[];
  offers: Offer[];
}

const Dashboard: React.FC<DashboardProps> = ({ subscribers, offers }) => {

  // Helper to replace the removed imported service
  const findOffer = (id: string) => offers.find(o => o.id === id);

  const stats = useMemo(() => {
    const active = subscribers.filter(s => s.status === Status.ACTIVE).length;
    const expired = subscribers.filter(s => s.status === Status.EXPIRED).length;
    
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const expiringSoon = subscribers.filter(s => {
      const end = new Date(s.endDate);
      return s.status === Status.ACTIVE && end > now && end <= sevenDaysFromNow;
    }).length;

    const revenue = subscribers.reduce((acc, sub) => {
      const offer = findOffer(sub.offerId);
      return acc + (offer ? offer.price : 0);
    }, 0);

    return { active, expired, expiringSoon, revenue };
  }, [subscribers, offers]);

  const offerDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    subscribers.forEach(sub => {
      const offer = findOffer(sub.offerId);
      const name = offer ? offer.name : 'Inconnu';
      dist[name] = (dist[name] || 0) + 1;
    });
    return Object.keys(dist).map(key => ({ name: key, value: dist[key] }));
  }, [subscribers, offers]);

  const statusDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    subscribers.forEach(sub => {
        dist[sub.status] = (dist[sub.status] || 0) + 1;
    });
    return Object.keys(dist).map(key => ({ name: key, value: dist[key] }));
  }, [subscribers]);

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
      <h2 className="text-2xl font-bold text-white mb-6">Tableau de Bord</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Abonnés Actifs</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Revenu Estimé</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.revenue.toLocaleString()} XOF</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Expire Bientôt</p>
              <p className="text-2xl font-bold text-amber-400">{stats.expiringSoon}</p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Expirés</p>
              <p className="text-2xl font-bold text-rose-400">{stats.expired}</p>
            </div>
            <div className="p-3 bg-rose-500/20 rounded-lg text-rose-400">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Offers Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Répartition par Offre</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={offerDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">État des Abonnements</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {statusDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center text-xs text-slate-300">
                      <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length]}}></span>
                      {entry.name}
                  </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;