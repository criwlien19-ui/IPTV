import React, { useState } from 'react';
import { Offer, UserRole } from '../types';
import { Plus, Edit2, Trash2, Package, Sparkles, Loader, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { generateOfferImage } from '../services/geminiService';

interface OffersListProps {
  offers: Offer[];
  userRole: UserRole;
  onSave: (offer: Offer) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const OffersList: React.FC<OffersListProps> = ({ offers, userRole, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<Partial<Offer>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = userRole === 'admin';

  const handleOpenModal = (offer?: Offer) => {
    if (!isAdmin) return;

    if (offer) {
      setEditingOffer(offer);
      setFormData(offer);
    } else {
      setEditingOffer(null);
      setFormData({
        name: '',
        price: 0,
        durationMonths: 1,
        maxConnections: 1,
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newOffer: Offer = {
      id: editingOffer ? editingOffer.id : crypto.randomUUID(), // UUID for DB
      name: formData.name || 'Nouvelle Offre',
      price: Number(formData.price),
      durationMonths: Number(formData.durationMonths),
      maxConnections: Number(formData.maxConnections),
      description: formData.description || '',
      imageUrl: formData.imageUrl || editingOffer?.imageUrl
    };
    
    try {
        await onSave(newOffer);
        setIsModalOpen(false);
    } catch (e) {
        setErrorMsg("Erreur de sauvegarde");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
          await onDelete(id);
      }
  }

  const handleGenerateImage = async (offer: Offer) => {
    if (!isAdmin) return;
    if (generatingId) return; // Prevent multiple clicks
    
    setGeneratingId(offer.id);
    setErrorMsg(null);
    
    const imageUrl = await generateOfferImage(offer.name, offer.description);
    
    if (imageUrl) {
        await onSave({ ...offer, imageUrl });
    } else {
        setErrorMsg(`Échec de la génération pour ${offer.name}. Vérifiez votre connexion ou réessayez.`);
        setTimeout(() => setErrorMsg(null), 5000); // Auto hide error
    }
    
    setGeneratingId(null);
  };

  return (
    <div className="p-6 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Plans & Offres</h2>
        {isAdmin && (
            <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
            <Plus size={18} /> Créer une Offre
            </button>
        )}
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-rose-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce-in">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => (
          <div key={offer.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-brand-500/50 transition-colors shadow-lg relative group flex flex-col">
            
            {/* Image Area */}
            <div className="h-48 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="flex flex-col items-center text-slate-600">
                        <Package size={48} />
                        <span className="text-xs mt-2">Pas d'image</span>
                    </div>
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>

                {/* Generation Button */}
                {isAdmin && (
                    <div className="absolute top-3 right-3 z-10">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateImage(offer);
                            }}
                            disabled={generatingId === offer.id}
                            className="p-2 bg-black/40 hover:bg-brand-600 text-white backdrop-blur-md rounded-full shadow-lg border border-white/10 transition-all disabled:cursor-not-allowed disabled:opacity-70"
                            title="Générer une image avec Gemini IA"
                        >
                            {generatingId === offer.id ? (
                                <Loader size={16} className="animate-spin text-brand-300" />
                            ) : (
                                <Sparkles size={16} className="text-brand-300" />
                            )}
                        </button>
                    </div>
                )}
                
                {/* Price Badge */}
                <div className="absolute bottom-3 right-3">
                     <div className="text-right">
                        <span className="block text-2xl font-bold text-white drop-shadow-md">{offer.price.toLocaleString()} XOF</span>
                        <span className="text-xs text-slate-300 drop-shadow-md">/ {offer.durationMonths} mois</span>
                     </div>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">{offer.name}</h3>
              <p className="text-slate-400 text-sm mb-6 min-h-[3rem] flex-1">{offer.description}</p>

              <div className="flex items-center text-sm text-slate-300 mb-6">
                <span className="bg-slate-700 px-2 py-1 rounded text-xs mr-2 border border-slate-600">{offer.maxConnections} Écran(s)</span>
              </div>

              <div className="flex gap-2 mt-auto">
                {isAdmin ? (
                    <>
                        <button 
                            onClick={() => handleOpenModal(offer)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 transition-colors text-sm font-medium"
                        >
                            <Edit2 size={16} /> Éditer
                        </button>
                        <button 
                            onClick={() => handleDelete(offer.id)}
                            className="w-10 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg flex justify-center items-center transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                ) : (
                    <button 
                        disabled
                        className="flex-1 bg-slate-800/50 border border-slate-700 text-slate-500 py-2 rounded-lg flex justify-center items-center gap-2 text-sm cursor-not-allowed"
                    >
                        <Lock size={14} /> Lecture seule
                    </button>
                )}
              </div>
            </div>
            {/* Decorative Bottom Border */}
            <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-purple-500"></div>
          </div>
        ))}
      </div>

       {/* Modal */}
       {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {editingOffer ? 'Modifier l\'Offre' : 'Nouvelle Offre'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nom de l'offre</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                  value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Prix (XOF)</label>
                    <input required type="number" step="100" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                    value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Durée (Mois)</label>
                    <input required type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                    value={formData.durationMonths} onChange={e => setFormData({...formData, durationMonths: Number(e.target.value)})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Max Connexions</label>
                <input required type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                  value={formData.maxConnections} onChange={e => setFormData({...formData, maxConnections: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none h-24" 
                  value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Annuler</button>
                 <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors flex items-center justify-center">
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Sauvegarder'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersList;