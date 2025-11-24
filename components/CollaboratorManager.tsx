
import React, { useState, useEffect } from 'react';
import { Collaborator, AccessGroup, SystemSettingItem } from '../types';
import { getCollaborators, saveCollaborator, deleteCollaborator, getAccessGroups, getSettingsByType } from '../services/storageService';
import { Plus, Edit2, Trash2, Search, X, Users, Save, Mail, Phone, Hash, Briefcase, Shield, Lock } from 'lucide-react';

const CollaboratorManager: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [jobTitles, setJobTitles] = useState<SystemSettingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Collaborator>>({
    name: '',
    registrationId: '',
    email: '',
    phone: '',
    jobTitle: '',
    group: 'Motorista',
    password: '',
    changePasswordOnFirstLogin: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCollaborators(getCollaborators());
    setGroups(getAccessGroups());
    setJobTitles(getSettingsByType('JOB_TITLES'));
  };

  const handleOpenModal = (collaborator?: Collaborator) => {
    if (collaborator) {
      setEditingId(collaborator.id);
      setFormData({ ...collaborator });
    } else {
      setEditingId(null);
      setFormData({
        id: crypto.randomUUID(),
        name: '',
        registrationId: '',
        email: '',
        phone: '',
        jobTitle: '',
        group: 'Motorista',
        password: '',
        changePasswordOnFirstLogin: true
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o colaborador "${name}"?\n\nEsta ação não poderá ser desfeita.`)) {
      deleteCollaborator(id);
      loadData();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.registrationId) {
      alert("Nome e Matrícula são obrigatórios");
      return;
    }

    const collaboratorToSave: Collaborator = {
      id: editingId || crypto.randomUUID(),
      name: formData.name!,
      registrationId: formData.registrationId!,
      email: formData.email || '',
      phone: formData.phone || '',
      jobTitle: formData.jobTitle || '',
      group: formData.group || 'Motorista',
      password: formData.password || '',
      changePasswordOnFirstLogin: formData.changePasswordOnFirstLogin
    };

    saveCollaborator(collaboratorToSave);
    loadData();
    setIsModalOpen(false);
  };

  const filteredList = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupName = (groupId: string) => {
      const g = groups.find(g => g.id === groupId);
      return g ? g.name : groupId;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Colaboradores</h1>
          <p className="text-slate-500 text-sm">Gerencie a equipe e níveis de acesso</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          Novo Colaborador
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar por nome, matrícula ou função..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <span className="text-sm text-slate-500 hidden md:block">
            {collaborators.length} colaboradores
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Colaborador</th>
                <th className="px-6 py-3">Matrícula</th>
                <th className="px-6 py-3">Função</th>
                <th className="px-6 py-3">Contato</th>
                <th className="px-6 py-3">Grupo de Acesso</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                     Nenhum colaborador encontrado.
                   </td>
                </tr>
              ) : (
                filteredList.map((collab) => (
                  <tr key={collab.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4 font-bold text-slate-700">
                        {collab.name}
                        <div className="text-xs text-slate-400 font-normal">{collab.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{collab.registrationId}</td>
                    <td className="px-6 py-4 text-slate-600">{collab.jobTitle}</td>
                    <td className="px-6 py-4 text-slate-600">{collab.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        collab.group === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                        collab.group === 'Gestor' ? 'bg-blue-100 text-blue-700' :
                        collab.group === 'Supervisor' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {getGroupName(collab.group)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(collab)}
                          className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition shadow-sm"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(collab.id, collab.name)}
                          className="p-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition shadow-sm"
                          title="Excluir Colaborador"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Users className="text-blue-600" />
                {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome do colaborador"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Hash size={14} /> Matrícula *
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.registrationId}
                    onChange={(e) => setFormData({...formData, registrationId: e.target.value})}
                    placeholder="ID ou Matrícula"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Briefcase size={14} /> Função / Cargo
                  </label>
                  {jobTitles.length > 0 ? (
                      <select
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                      >
                        <option value="">Selecione...</option>
                        {jobTitles.map((item) => (
                            <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                  ) : (
                      <>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                            placeholder="Ex: Motorista III"
                        />
                        <p className="text-xs text-orange-500 mt-1">
                            Nenhuma função cadastrada em Configurações.
                        </p>
                      </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Mail size={14} /> E-mail
                  </label>
                  <input 
                    type="email" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Phone size={14} /> Celular
                  </label>
                  <input 
                    type="tel" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(99) 99999-9999"
                  />
                </div>

                <div className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                          <Lock size={14} /> Senha de Acesso
                        </label>
                        <input 
                          type="password" 
                          className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                          value={formData.password || ''}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="******"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input 
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={formData.changePasswordOnFirstLogin || false}
                              onChange={(e) => setFormData({...formData, changePasswordOnFirstLogin: e.target.checked})}
                           />
                           <span className="text-sm text-slate-700">Exigir alteração de senha no primeiro acesso</span>
                        </label>
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Shield size={14} /> Grupo de Acesso
                  </label>
                  <select
                     className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                     value={formData.group}
                     onChange={(e) => setFormData({...formData, group: e.target.value})}
                  >
                    {groups.map(g => (
                         <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Define as permissões do usuário no sistema.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                  <Save size={16} />
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaboratorManager;
