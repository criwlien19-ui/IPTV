import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Plus, Edit2, Trash2, UserCheck, Shield } from 'lucide-react';
import * as Storage from '../services/storageService';

const ResellersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    role: 'reseller'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(Storage.getUsers());
  };

  const handleDelete = (id: string) => {
    if (id === 'admin') return; // Protection
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce revendeur ? Ses abonnés ne seront pas supprimés mais devront être réassignés.')) {
        Storage.deleteUser(id);
        loadUsers();
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        role: 'reseller',
        username: '',
        password: '',
        fullName: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) return;

    const newUser: User = {
      id: editingUser ? editingUser.id : Date.now().toString(),
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName || 'Revendeur',
      role: formData.role || 'reseller'
    };

    Storage.saveUser(newUser);
    loadUsers();
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Gestion des Revendeurs</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Ajouter un Revendeur
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="p-4 text-slate-400 font-medium text-sm">Nom Complet</th>
              <th className="p-4 text-slate-400 font-medium text-sm">Identifiant</th>
              <th className="p-4 text-slate-400 font-medium text-sm">Rôle</th>
              <th className="p-4 text-slate-400 font-medium text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-slate-200">{user.fullName}</div>
                </td>
                <td className="p-4 text-slate-300 font-mono text-sm">
                  {user.username}
                </td>
                <td className="p-4">
                  {user.role === 'admin' ? (
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Shield size={12} /> Admin
                     </span>
                  ) : (
                     <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
                        <UserCheck size={12} /> Revendeur
                     </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenModal(user)} className="p-2 hover:bg-slate-600 text-slate-400 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    {user.id !== 'admin' && (
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors">
                        <Trash2 size={16} />
                        </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {editingUser ? 'Modifier Utilisateur' : 'Nouveau Revendeur'}
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
                <label className="block text-sm font-medium text-slate-400 mb-1">Identifiant (Username)</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                  value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Mot de passe</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none" 
                  value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Rôle</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-brand-500 focus:outline-none"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}
                    disabled={editingUser?.id === 'admin'}
                >
                    <option value="reseller">Revendeur</option>
                    <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Annuler</button>
                 <button type="submit" className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellersList;