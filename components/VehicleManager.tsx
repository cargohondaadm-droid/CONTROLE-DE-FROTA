
import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { getVehicles, saveVehicle, deleteVehicle } from '../services/storageService';
import { Plus, Edit2, Trash2, Search, X, Car, Save, FileText, Upload, AlertCircle, Calendar } from 'lucide-react';

const VehicleManager: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    model: '',
    brand: '',
    year: '',
    unit: '',
    sector: '',
    code: '',
    renavam: '',
    lastLicensingDate: '',
    licensingDocUrl: null,
    status: VehicleStatus.AVAILABLE
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setVehicles(getVehicles());
  };

  const checkLicensingStatus = (dateStr?: string) => {
      if (!dateStr) return 'UNKNOWN';
      
      const lastDate = new Date(`${dateStr}-01T00:00:00`); // Add day and time to avoid timezone issues
      const nextDue = new Date(lastDate);
      nextDue.setFullYear(lastDate.getFullYear() + 1);
      
      const today = new Date();
      
      if (today > nextDue) return 'EXPIRED';
      
      // Warning if less than 30 days
      const diffTime = Math.abs(nextDue.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays <= 30) return 'WARNING';
      
      return 'OK';
  };

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
          ...vehicle, 
          renavam: vehicle.renavam || '',
          lastLicensingDate: vehicle.lastLicensingDate || '',
          licensingDocUrl: vehicle.licensingDocUrl || null
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        id: crypto.randomUUID(),
        plate: '',
        model: '',
        brand: '',
        year: '',
        unit: '',
        sector: '',
        code: '',
        renavam: '',
        lastLicensingDate: '',
        licensingDocUrl: null,
        status: VehicleStatus.AVAILABLE
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, plate: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o veículo placa ${plate}?\n\nEsta ação não poderá ser desfeita.`)) {
      deleteVehicle(id);
      loadVehicles();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, licensingDocUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.model) {
      alert("Placa e Modelo são obrigatórios");
      return;
    }

    const vehicleToSave: Vehicle = {
      id: editingVehicle ? editingVehicle.id : crypto.randomUUID(),
      plate: formData.plate.toUpperCase(),
      model: formData.model,
      brand: formData.brand || '',
      year: formData.year || '',
      unit: formData.unit || '',
      sector: formData.sector || '',
      code: formData.code || '',
      renavam: formData.renavam || '',
      lastLicensingDate: formData.lastLicensingDate || '',
      licensingDocUrl: formData.licensingDocUrl || null,
      status: formData.status || VehicleStatus.AVAILABLE
    };

    saveVehicle(vehicleToSave);
    loadVehicles();
    setIsModalOpen(false);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Veículos</h1>
          <p className="text-slate-500 text-sm">Cadastre e gerencie a frota da empresa</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          Novo Veículo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar por placa ou modelo..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <span className="text-sm text-slate-500 hidden md:block">
            {vehicles.length} veículos cadastrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Placa</th>
                <th className="px-6 py-3">Modelo / Marca</th>
                <th className="px-6 py-3">Licenciamento</th>
                <th className="px-6 py-3">Unidade / Setor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                     Nenhum veículo encontrado.
                   </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const licStatus = checkLicensingStatus(vehicle.lastLicensingDate);
                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-4 font-bold text-slate-700">{vehicle.plate}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{vehicle.model}</div>
                        <div className="text-xs text-slate-500">{vehicle.brand}</div>
                      </td>
                      <td className="px-6 py-4">
                        {vehicle.lastLicensingDate ? (
                             <div className="flex items-center gap-2">
                                <span className="text-slate-600">
                                    {new Date(vehicle.lastLicensingDate + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
                                </span>
                                {licStatus === 'EXPIRED' && (
                                    <span className="text-red-500" title="Licenciamento Vencido"><AlertCircle size={16} /></span>
                                )}
                                {licStatus === 'WARNING' && (
                                    <span className="text-yellow-500" title="Vence em breve"><AlertCircle size={16} /></span>
                                )}
                             </div>
                        ) : (
                            <span className="text-slate-400 italic">Não informado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>{vehicle.unit}</div>
                        <div className="text-xs text-slate-400">{vehicle.sector}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          vehicle.status === VehicleStatus.AVAILABLE ? 'bg-green-100 text-green-700' :
                          vehicle.status === VehicleStatus.RESTRICTED ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(vehicle)}
                            className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition shadow-sm"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(vehicle.id, vehicle.plate)}
                            className="p-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                <Car className="text-blue-600" />
                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placa *</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.plate}
                    onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                    placeholder="ABC-1234"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código / Patrimônio</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Renavam</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.renavam}
                    onChange={(e) => setFormData({...formData, renavam: e.target.value})}
                    placeholder="00000000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Ex: Fiat Strada"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Ex: Fiat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    placeholder="Ex: 2023"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Atual</label>
                  <select
                     className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                     value={formData.status}
                     onChange={(e) => setFormData({...formData, status: e.target.value as VehicleStatus})}
                  >
                    <option value={VehicleStatus.AVAILABLE}>{VehicleStatus.AVAILABLE}</option>
                    <option value={VehicleStatus.RESTRICTED}>{VehicleStatus.RESTRICTED}</option>
                    <option value={VehicleStatus.UNAVAILABLE}>{VehicleStatus.UNAVAILABLE}</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2"><FileText size={18} /> Documentação</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Último Licenciamento</label>
                        <div className="relative">
                            <input 
                                type="month" 
                                className="w-full border border-slate-300 rounded-lg p-2 pl-9 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                                value={formData.lastLicensingDate}
                                onChange={(e) => setFormData({...formData, lastLicensingDate: e.target.value})}
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Validade estimada: 1 ano após a data.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Documento Digital</label>
                        <label className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-lg p-2 cursor-pointer hover:bg-slate-50 transition">
                             <Upload size={18} className="text-blue-600" />
                             <span className="text-sm text-slate-600 truncate">
                                {formData.licensingDocUrl ? "Documento Carregado (Alterar)" : "Importar PDF/Imagem"}
                             </span>
                             <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                        </label>
                        {formData.licensingDocUrl && (
                             <div className="mt-2">
                                <a href={formData.licensingDocUrl} download="licenciamento" className="text-xs text-blue-600 hover:underline">Download Documento</a>
                             </div>
                        )}
                      </div>
                  </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-medium text-slate-700 mb-3">Alocação</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            placeholder="Ex: Matriz"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Setor / Centro de Custo</label>
                        <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                            value={formData.sector}
                            onChange={(e) => setFormData({...formData, sector: e.target.value})}
                            placeholder="Ex: Operacional"
                        />
                    </div>
                  </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
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
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManager;
