
import React, { useState, useEffect } from 'react';
import { AccessGroup, Permission } from '../types';
import { getAccessGroups, saveAccessGroup, deleteAccessGroup } from '../services/storageService';
import { Plus, Edit2, Trash2, Search, X, Shield, Save, CheckSquare, Square, Info } from 'lucide-react';

const PERMISSIONS_CONFIG: { id: Permission; label: string; description: string }[] = [
  { id: 'view_dashboard', label: 'Visualizar Painel', description: 'Acesso aos indicadores principais e gráficos.' },
  { id: 'view_history', label: 'Visualizar Histórico', description: 'Acesso ao histórico completo de operações.' },
  { id: 'create_checklist', label: 'Criar Checklist', description: 'Permissão para realizar novas inspeções.' },
  { id: 'manage_vehicles', label: 'Gerenciar Veículos', description: 'Adicionar, editar e excluir veículos.' },
  { id: 'manage_collaborators', label: 'Gerenciar Colaboradores', description: 'Adicionar e editar membros da equipe.' },
  { id: 'manage_groups', label: 'Gerenciar Grupos', description: 'Criar e editar níveis de acesso.' },
  { id: 'manage_maintenance', label: 'Gerenciar Manutenção', description: 'Controle de ordens de serviço e manutenção.' },
];

const GroupManager: React.FC = () => {
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccessGroup | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<AccessGroup>>({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    setGroups(getAccessGroups());
  };

  const handleOpenModal = (group?: AccessGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ ...group });
    } else {
      setEditingGroup(null);
      setFormData({
        id: crypto.randomUUID(),
        name: '',
        description: '',
        permissions: [],
        isSystem: false
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${name}"?\n\nUsuários associados a ele perderão as permissões.`)) {
      try {
        deleteAccessGroup(id);
        loadGroups();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const togglePermission = (permId: Permission) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(permId)) {
        return { ...prev, permissions: current.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...current, permId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Nome do grupo é obrigatório");
      return;
    }

    const groupToSave: AccessGroup = {
      id: editingGroup ? editingGroup.id : crypto.randomUUID(),
      name: formData.name,
      description: formData.description || '',
      permissions: formData.permissions || [],
      isSystem: editingGroup?.isSystem || false
    };

    saveAccessGroup(groupToSave);
    loadGroups();
    setIsModalOpen(false);
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Grupos de Acesso</h1>
          <p className="text-slate-500 text-sm">Defina permissões e níveis de acesso ao sistema</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          Novo Grupo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar grupo..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <span className="text-sm text-slate-500 hidden md:block">
            {groups.length} grupos cadastrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Nome do Grupo</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Permissões</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                     Nenhum grupo encontrado.
                   </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4 font-bold text-slate-700">
                        {group.name}
                        {group.isSystem && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                Sistema
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{group.description}</td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.permissions.length} acessos
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(group)}
                          className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition shadow-sm"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!group.isSystem && (
                            <button 
                            onClick={() => handleDelete(group.id, group.name)}
                            className="p-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition shadow-sm"
                            title="Excluir"
                            >
                            <Trash2 size={16} />
                            </button>
                        )}
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
                <Shield className="text-blue-600" />
                {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Grupo *</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Visitante"
                    required
                    disabled={editingGroup?.isSystem}
                  />
                  {editingGroup?.isSystem && <p className="text-xs text-orange-500 mt-1">Nomes de grupos do sistema não podem ser alterados.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição breve das responsabilidades"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <CheckSquare size={18} className="text-slate-500" /> Permissões do Sistema
                </h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid gap-3">
                    {PERMISSIONS_CONFIG.map((perm) => {
                        const isChecked = formData.permissions?.includes(perm.id);
                        return (
                            <div 
                                key={perm.id} 
                                className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                onClick={() => togglePermission(perm.id)}
                            >
                                <div className={`mt-0.5 text-blue-600`}>
                                    {isChecked ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-300" />}
                                </div>
                                <div>
                                    <div className={`text-sm font-semibold ${isChecked ? 'text-blue-800' : 'text-slate-700'}`}>
                                        {perm.label}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {perm.description}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                  Salvar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManager;
