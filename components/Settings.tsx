
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Mail, Phone, Save, Building, Briefcase, Truck, Users, Trash2, Plus, Info, Edit2, Check, X, Database, Download, Upload, AlertTriangle } from 'lucide-react';
import { getAccessGroups, getMockUserRole, setMockUserRole, getSettingsByType, saveSystemSetting, deleteSystemSetting, createBackup, restoreBackup, getStorageUsage } from '../services/storageService';
import { SystemSettingItem, SystemSettingType, AccessGroup } from '../types';

const ADMIN_ROLES = ['Administrador', 'Gestor', 'Supervisor'];

const Settings: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<string>(getMockUserRole());
  const [activeTab, setActiveTab] = useState<'personal' | 'admin' | 'database'>('personal');
  const [adminTab, setAdminTab] = useState<SystemSettingType>('UNITS');
  const [allGroups, setAllGroups] = useState<AccessGroup[]>([]);
  
  // Storage Stats
  const [storageStats, setStorageStats] = useState({ used: 0, limit: 0, percentage: 0 });
  
  // Personal Form State
  const [personalData, setPersonalData] = useState({
      email: 'usuario@empresa.com',
      phone: '(11) 99999-0000',
      password: '',
      confirmPassword: ''
  });

  // Admin Data State
  const [settingsList, setSettingsList] = useState<SystemSettingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const isAdmin = ADMIN_ROLES.includes(currentRole);

  useEffect(() => {
    setAllGroups(getAccessGroups());
    if (!isAdmin) {
        setActiveTab('personal');
    }
  }, [currentRole, isAdmin]);

  useEffect(() => {
      if (activeTab === 'admin') {
          loadSettings(adminTab);
          cancelEditing(); // Reset editing when changing tabs
      } else if (activeTab === 'database') {
          setStorageStats(getStorageUsage());
      }
  }, [activeTab, adminTab]);

  const loadSettings = (type: SystemSettingType) => {
      setSettingsList(getSettingsByType(type));
  };

  const handleRoleChange = (roleId: string) => {
      setMockUserRole(roleId);
      setCurrentRole(roleId);
      // Reset to personal tab if new role is not admin
      if (!ADMIN_ROLES.includes(roleId)) {
          setActiveTab('personal');
      }
  };

  const handleSavePersonal = (e: React.FormEvent) => {
      e.preventDefault();
      if (personalData.password && personalData.password !== personalData.confirmPassword) {
          alert("As senhas não conferem.");
          return;
      }
      alert("Dados atualizados com sucesso! (Simulação)");
      setPersonalData({...personalData, password: '', confirmPassword: ''});
  };

  const handleAddSystemItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newItemName.trim()) return;

      const newItem: SystemSettingItem = {
          id: crypto.randomUUID(),
          name: newItemName.trim(),
          type: adminTab
      };

      saveSystemSetting(newItem);
      setNewItemName('');
      loadSettings(adminTab);
  };

  const handleDeleteSystemItem = (id: string) => {
      const item = settingsList.find(i => i.id === id);
      const name = item ? item.name : 'este item';

      if (window.confirm(`Tem certeza que deseja excluir "${name}"?\n\nEsta ação não poderá ser desfeita.`)) {
          deleteSystemSetting(id);
          loadSettings(adminTab);
          if (editingId === id) cancelEditing();
      }
  };

  // Edit Logic
  const startEditing = (item: SystemSettingItem) => {
      setEditingId(item.id);
      setEditingText(item.name);
  };

  const cancelEditing = () => {
      setEditingId(null);
      setEditingText('');
  };

  const saveEditing = (id: string) => {
      if (!editingText.trim()) return;
      
      const updatedItem: SystemSettingItem = {
          id: id,
          name: editingText.trim(),
          type: adminTab
      };

      saveSystemSetting(updatedItem);
      loadSettings(adminTab);
      cancelEditing();
  };

  // Backup & Restore Handlers
  const handleBackup = () => {
      const backupData = createBackup();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_fleetguard_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const backup = JSON.parse(json);
          
          if (confirm("ATENÇÃO: A restauração irá substituir TODOS os dados atuais do sistema (veículos, checklists, colaboradores, etc). Deseja continuar?")) {
              const success = restoreBackup(backup);
              if (success) {
                  alert("Dados restaurados com sucesso! A página será recarregada.");
                  window.location.reload();
              } else {
                  alert("Erro ao processar o arquivo de backup. Verifique se o arquivo é válido.");
              }
          }
        } catch (err) {
          console.error(err);
          alert("Arquivo inválido ou corrompido.");
        }
        // Reset input
        e.target.value = '';
      };
      reader.readAsText(file);
  };

  const renderAdminHeader = () => {
      const tabs: {id: SystemSettingType, label: string, icon: any}[] = [
          { id: 'UNITS', label: 'Unidades', icon: Building },
          { id: 'SECTORS', label: 'Setores', icon: Users },
          { id: 'JOB_TITLES', label: 'Funções', icon: Briefcase },
          { id: 'SUPPLIERS', label: 'Fornecedores', icon: Truck },
      ];

      return (
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-2">
              {tabs.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                          adminTab === tab.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                      <tab.icon size={16} />
                      {tab.label}
                  </button>
              ))}
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      
      {/* Simulation Bar */}
      <div className="bg-slate-800 border border-slate-700 text-slate-200 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-2">
              <Info size={20} className="text-blue-400" />
              <div>
                  <h3 className="font-bold text-sm">Simulação de Perfil</h3>
                  <p className="text-xs text-slate-400">Alterne o grupo de acesso para testar as permissões desta tela.</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Logado como:</span>
              <select 
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                  value={currentRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
              >
                  {allGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
              </select>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <SettingsIcon className="text-slate-800" /> Configurações
          </h1>
          <p className="text-slate-500 text-sm">Gerencie seus dados e as definições do sistema</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-slate-200 flex gap-6 flex-wrap">
          <button 
              onClick={() => setActiveTab('personal')}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
              Minha Conta
          </button>
          {isAdmin && (
              <>
                <button 
                    onClick={() => setActiveTab('admin')}
                    className={`pb-3 text-sm font-medium border-b-2 transition ${
                        activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Administração do Sistema
                </button>
                <button 
                    onClick={() => setActiveTab('database')}
                    className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'database' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Database size={16} /> Banco de Dados
                </button>
              </>
          )}
      </div>

      {activeTab === 'personal' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600" /> Dados Pessoais
              </h2>
              <form onSubmit={handleSavePersonal} className="space-y-4 max-w-lg">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                          <Mail size={16} /> E-mail
                      </label>
                      <input 
                          type="email" 
                          className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={personalData.email}
                          onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                          <Phone size={16} /> Celular
                      </label>
                      <input 
                          type="tel" 
                          className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={personalData.phone}
                          onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                      />
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4">
                      <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <Lock size={18} /> Alterar Senha
                      </h3>
                      <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                            <input 
                                type="password" 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={personalData.password}
                                onChange={(e) => setPersonalData({...personalData, password: e.target.value})}
                                placeholder="Deixe em branco para não alterar"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={personalData.confirmPassword}
                                onChange={(e) => setPersonalData({...personalData, confirmPassword: e.target.value})}
                            />
                        </div>
                      </div>
                  </div>

                  <div className="pt-4">
                      <button 
                          type="submit" 
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                          <Save size={18} /> Salvar Alterações
                      </button>
                  </div>
              </form>
          </div>
      )}

      {activeTab === 'admin' && isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fade-in">
              {renderAdminHeader()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 border-r border-slate-100 pr-0 md:pr-6">
                      <h3 className="font-bold text-slate-700 mb-2">Novo Cadastro</h3>
                      <p className="text-xs text-slate-500 mb-4">Adicione uma nova opção para {
                          adminTab === 'UNITS' ? 'Unidades' : 
                          adminTab === 'SECTORS' ? 'Setores' :
                          adminTab === 'SUPPLIERS' ? 'Fornecedores' : 'Funções'
                      }.</p>
                      
                      <form onSubmit={handleAddSystemItem} className="space-y-3">
                          <input 
                              type="text"
                              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder={`Nome do ${adminTab === 'JOB_TITLES' ? 'Cargo/Função' : 'Item'}`}
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              autoFocus
                          />
                          <button 
                              type="submit"
                              disabled={!newItemName.trim()}
                              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              <Plus size={18} /> Adicionar
                          </button>
                      </form>
                  </div>

                  <div className="md:col-span-2">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                          <span>Registros Cadastrados</span>
                          <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{settingsList.length} itens</span>
                      </h3>
                      
                      {settingsList.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              Nenhum registro encontrado.
                          </div>
                      ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                              {settingsList.map(item => (
                                  <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition group">
                                      {editingId === item.id ? (
                                          <div className="flex items-center gap-2 w-full animate-fade-in">
                                              <input 
                                                  type="text"
                                                  className="flex-1 border border-blue-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                  value={editingText}
                                                  onChange={(e) => setEditingText(e.target.value)}
                                                  autoFocus
                                              />
                                              <button 
                                                  onClick={() => saveEditing(item.id)}
                                                  className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition"
                                                  title="Salvar"
                                              >
                                                  <Check size={16} />
                                              </button>
                                              <button 
                                                  onClick={cancelEditing}
                                                  className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition"
                                                  title="Cancelar"
                                              >
                                                  <X size={16} />
                                              </button>
                                          </div>
                                      ) : (
                                          <>
                                            <span className="text-slate-700 font-medium">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => startEditing(item)}
                                                    className="text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 p-2 rounded-lg transition shadow-sm flex items-center justify-center"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteSystemItem(item.id)}
                                                    className="p-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition shadow-sm flex items-center justify-center"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                          </>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'database' && isAdmin && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Database size={20} className="text-blue-600" /> Armazenamento Local
                  </h2>
                  <div className="space-y-2">
                      <div className="flex justify-between text-sm text-slate-600">
                          <span>Uso do Navegador</span>
                          <span className="font-bold">{storageStats.percentage.toFixed(2)}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                              className={`h-full rounded-full transition-all duration-500 ${storageStats.percentage > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                              style={{ width: `${storageStats.percentage}%` }}
                          ></div>
                      </div>
                      <p className="text-xs text-slate-400">
                          ~{(storageStats.used / 1024).toFixed(2)} KB usados de aproximadamente {(storageStats.limit / 1024 / 1024).toFixed(0)} MB disponíveis.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Backup Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                      <div>
                          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-2">
                              <Download size={20} className="text-blue-600" /> Fazer Backup
                          </h3>
                          <p className="text-sm text-slate-500 mb-4">
                              Baixe um arquivo contendo todos os dados do sistema (veículos, colaboradores, checklists, manutenções, etc). Salve este arquivo em um local seguro.
                          </p>
                      </div>
                      <button 
                          onClick={handleBackup}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 shadow-sm"
                      >
                          <Download size={18} /> Baixar Backup Completo
                      </button>
                  </div>

                  {/* Restore Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                      <div>
                          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-2">
                              <Upload size={20} className="text-orange-600" /> Restaurar Dados
                          </h3>
                          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-4">
                             <div className="flex gap-2 text-orange-700 text-sm font-semibold mb-1">
                                 <AlertTriangle size={16} /> Atenção
                             </div>
                             <p className="text-xs text-orange-600 leading-relaxed">
                                 Ao restaurar um arquivo, <strong>todos os dados atuais serão substituídos</strong>. Esta ação é irreversível.
                             </p>
                          </div>
                      </div>
                      <label className="w-full py-3 bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50 text-slate-600 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer">
                          <Upload size={18} /> Selecionar Arquivo (.json)
                          <input 
                              type="file" 
                              accept=".json" 
                              className="hidden" 
                              onChange={handleRestore}
                          />
                      </label>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
