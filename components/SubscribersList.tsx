import React, { useState } from 'react';
import { Subscriber, Offer, Status, User } from '../types';
import { Search, Plus, Edit2, Trash2, Mail, CheckCircle, XCircle, Clock, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { generateRenewalEmail } from '../services/geminiService';

interface SubscribersListProps {
  subscribers: Subscriber[];
  offers: Offer[];
  currentUser: User;
  allUsers: User[]; // Liste de tous les revendeurs pour l'admin
  onAdd: (sub: Subscriber) => Promise<void>;
  onEdit: (sub: Subscriber) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const SubscribersList: React.FC<SubscribersListProps> = ({ subscribers, offers, currentUser, allUsers, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);
  const [emailDraft, setEmailDraft] = useState<{subId: string, content: string} | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Subscriber>>({
    status: Status.ACTIVE,
    startDate: new Date().toISOString().split('T')[0],
    offerId: offers[0]?.id || ''
  });

  const findOffer = (id: string) => offers.find(o => o.id === id);

  // Helper to get reseller username
  const getResellerName = (resellerId: string) => {
      if (resellerId === 'admin') return 'Admin';
      const reseller = allUsers.find(u => u.id === resellerId);
      return reseller ? reseller.username : resellerId;
  };

  // Filter subs
  const filteredSubs = subscribers.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (sub?: Subscriber) => {
    if (sub) {
      setEditingSub(sub);
      setFormData({
          ...sub,
          startDate: sub.startDate.split('T')[0],
          endDate: sub.endDate.split('T')[0]
      });
    } else {
      setEditingSub(null);
      const start = new Date();
      const offer = offers[0];
      const end = new Date(start);
      if (offer) end.setMonth(end.getMonth() + offer.durationMonths);
      
      setFormData({
        status: Status.ACTIVE,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        offerId: offer?.id || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const resellerId = editingSub ? editingSub.resellerId : currentUser.id;

    const newSub: Subscriber = {
      id: editingSub ? editingSub.id : crypto.randomUUID(), // Use UUID for Supabase
      fullName: formData.fullName || '',
      email: formData.email || '',
      offerId: formData.offerId || '',
      startDate: new Date(formData.startDate!).toISOString(),
      endDate: new Date(formData.endDate!).toISOString(),
      status: formData.status || Status.ACTIVE,
      macAddress: formData.macAddress || '',
      phone: formData.phone || '',
      resellerId: resellerId
    };

    try {
        if (editingSub) {
            await onEdit(newSub);
        } else {
            await onAdd(newSub);
        }
        setIsModalOpen(false);
    } catch (e) {
        setErrorMsg("Erreur lors de la sauvegarde.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
      if(window.confirm("Êtes-vous sûr ?")) {
          try {
              await onDelete(id);
          } catch(e) {
              setErrorMsg("Erreur lors de la suppression.");
          }
      }
  }

  const handleOfferChange = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    const start = new Date(formData.startDate || Date.now());
    if (offer) {
        const end = new Date(start);
        end.setMonth(end.getMonth() + offer.durationMonths);
        setFormData({ ...formData, offerId, endDate: end.toISOString().split('T')[0] });
    } else {
        setFormData({ ...formData, offerId });
    }
  };

  const handleGenerateEmail = async (sub: Subscriber) => {
    const offer = offers.find(o => o.id === sub.offerId);
    if (!offer) {
        setErrorMsg("Impossible de trouver l'offre associée à cet abonné.");
        setTimeout(() => setErrorMsg(null), 4000);
        return;
    }
    
    setLoadingEmail(true);
    setEmailDraft(null);
    setErrorMsg(null);

    const content = await generateRenewalEmail(sub, offer);
    
    if (content.startsWith("Erreur")) {
        setErrorMsg(content);
        setTimeout(() => setErrorMsg(null), 4000);
    } else {
        setEmailDraft({ subId: sub.id, content });
    }
    
    setLoadingEmail(false);
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.ACTIVE: return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Actif</span>;
      case Status.EXPIRED: return <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> Expiré</span>;
      case Status.PENDING: return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> En attente</span>;
      default: return <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded-full text-xs">Inconnu</span>;
    }
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden relative">
       {/* Error Toast */}
       {errorMsg && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-rose-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
            <AlertTriangle size={20} />
            <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Gestion des Abonnés</h2>
            {currentUser.role === 'admin' && (
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-medium">
                    Vue Globale Admin
                </span>
            )}
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Nouveau Client
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex-1 flex flex-col min-h-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou email..." 
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-slate-400 font-medium text-sm">Nom</th>
                <th className="p-3 text-slate-400 font-medium text-sm hidden md:table-cell">Offre</th>
                <th className="p-3 text-slate-400 font-medium text-sm">Expiration</th>
                {currentUser.role === 'admin' && (
                    <th className="p-3 text-slate-400 font-medium text-sm">Revendeur</th>
                )}
                <th className="p-3 text-slate-400 font-medium text-sm">Statut</th>
                <th className="p-3 text-slate-400 font-medium text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredSubs.map(sub => {
                const offer = findOffer(sub.offerId);
                return (
                  <React.Fragment key={sub.id}>
                  <tr className="hover:bg-slate-700/30 transition-colors group">
                    <td className="p-3">
                      <div className="font-medium text-slate-200">{sub.fullName}</div>
                      <div className="text-xs text-slate-500">{sub.email}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm text-slate-300">{offer?.name || 'Offre supprimée'}</span>
                    </td>
                    <td className="p-3 text-sm text-slate-300">
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    {currentUser.role === 'admin' && (
                        <td className="p-3">
                           {sub.resellerId === 'admin' ? (
                               <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">Admin</span>
                           ) : (
                               <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 flex items-center gap-1 w-fit">
                                  <Shield size={10} className="text-brand-400" />
                                  {getResellerName(sub.resellerId)}
                               </span>
                           )}
                        </td>
                    )}
                    <td className="p-3">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleGenerateEmail(sub)} title="Générer Email Relance" className="p-1.5 hover:bg-brand-500/20 text-brand-400 rounded transition-colors">
                          <Mail size={16} />
                        </button>
                        <button onClick={() => handleOpenModal(sub)} className="p-1.5 hover:bg-slate-600 text-slate-400 rounded transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                   {/* AI Email Draft Area */}
                   {emailDraft && emailDraft.subId === sub.id && (
                      <tr>
                        <td colSpan={currentUser.role === 'admin' ? 6 : 5} className="p-3 bg-slate-900/50 border-b border-slate-700">
                           <div className="bg-slate-800 p-3 rounded border border-brand-500/30">
                              <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold text-brand-400 uppercase">Brouillon Gemini AI</span>
                                <button onClick={() => setEmailDraft(null)} className="text-slate-400 hover:text-white"><XCircle size={14}/></button>
                              </div>
                              <textarea 
                                readOnly 
                                className="w-full h-32 bg-slate-900 text-sm text-slate-300 p-2 rounded border border-slate-700 focus:outline-none"
                                value={emailDraft.content}
                              />
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredSubs.length === 0 && (
                <tr>
                  <td colSpan={currentUser.role === 'admin' ? 6 : 5} className="p-8 text-center text-slate-500">
                    Aucun abonné trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {editingSub ? 'Modifier Abonné' : 'Nouvel Abonné'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nom Complet</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                  value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input required type="email" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                  value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Offre</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none"
                        value={formData.offerId} onChange={e => handleOfferChange(e.target.value)}
                    >
                        {offers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.price.toLocaleString()} XOF)</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Statut</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none"
                        value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})}
                    >
                        {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Début</label>
                    <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                        value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Fin</label>
                    <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                        value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                 </div>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Adresse MAC (Optionnel)</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                  placeholder="00:1A:..."
                  value={formData.macAddress || ''} onChange={e => setFormData({...formData, macAddress: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Annuler</button>
                 <button disabled={isSaving} type="submit" className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Sauvegarder'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loadingEmail && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
              <div className="bg-slate-800 p-4 rounded-lg shadow-xl flex items-center gap-3 border border-brand-500/50">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                  <span className="text-white">Gemini rédige votre email...</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default SubscribersList;