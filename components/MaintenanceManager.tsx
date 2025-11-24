
import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, MaintenanceType, Vehicle } from '../types';
import { getMaintenances, saveMaintenance, deleteMaintenance, getVehicles } from '../services/storageService';
import { Plus, Edit2, Trash2, Search, X, Wrench, Save, DollarSign, Calendar, FileText, Briefcase, Upload, Paperclip, Download, Droplet, Filter, Gauge, CheckSquare, List } from 'lucide-react';

const MaintenanceManager: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    vehiclePlate: '',
    date: new Date().toISOString().split('T')[0],
    type: 'PREVENTIVE',
    description: '',
    provider: '',
    odometer: 0,
    partsCost: 0,
    laborCost: 0,
    status: 'OPEN',
    observations: '',
    osFileUrl: null,
    invoiceFileUrl: null,
    filters: { oil: false, air: false, fuel: false, cabin: false },
    replacedItems: '',
    nextMaintenanceDate: '',
    nextMaintenanceKm: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRecords(getMaintenances());
    setVehicles(getVehicles());
  };

  const handleOpenModal = (record?: MaintenanceRecord) => {
    if (record) {
      setEditingId(record.id);
      setFormData({ 
        ...record,
        filters: record.filters || { oil: false, air: false, fuel: false, cabin: false },
        replacedItems: record.replacedItems || '',
        nextMaintenanceDate: record.nextMaintenanceDate || '',
        nextMaintenanceKm: record.nextMaintenanceKm || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        id: crypto.randomUUID(),
        vehiclePlate: '',
        date: new Date().toISOString().split('T')[0],
        type: 'PREVENTIVE',
        description: '',
        provider: '',
        odometer: 0,
        partsCost: 0,
        laborCost: 0,
        totalCost: 0,
        status: 'OPEN',
        observations: '',
        osFileUrl: null,
        invoiceFileUrl: null,
        filters: { oil: false, air: false, fuel: false, cabin: false },
        replacedItems: '',
        nextMaintenanceDate: '',
        nextMaintenanceKm: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, description: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a Ordem de Serviço "${description}"?\n\nEsta ação não poderá ser desfeita.`)) {
      deleteMaintenance(id);
      loadData();
    }
  };

  const calculateTotal = (parts: number, labor: number) => {
      return (Number(parts) || 0) + (Number(labor) || 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'osFileUrl' | 'invoiceFileUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFilterChange = (key: 'oil' | 'air' | 'fuel' | 'cabin') => {
      setFormData(prev => ({
          ...prev,
          filters: {
              ...prev.filters!,
              [key]: !prev.filters![key]
          }
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehiclePlate || !formData.description || !formData.provider) {
      alert("Preencha a placa, descrição e o prestador do serviço.");
      return;
    }

    const total = calculateTotal(formData.partsCost || 0, formData.laborCost || 0);

    const recordToSave: MaintenanceRecord = {
      id: editingId || crypto.randomUUID(),
      vehiclePlate: formData.vehiclePlate,
      date: formData.date!,
      type: formData.type as MaintenanceType,
      description: formData.description,
      provider: formData.provider,
      odometer: Number(formData.odometer),
      partsCost: Number(formData.partsCost),
      laborCost: Number(formData.laborCost),
      totalCost: total,
      status: formData.status as 'OPEN' | 'COMPLETED',
      observations: formData.observations || '',
      osFileUrl: formData.osFileUrl || null,
      invoiceFileUrl: formData.invoiceFileUrl || null,
      filters: formData.filters,
      replacedItems: formData.replacedItems || '',
      nextMaintenanceDate: formData.nextMaintenanceDate,
      nextMaintenanceKm: Number(formData.nextMaintenanceKm) || undefined
    };

    saveMaintenance(recordToSave);
    loadData();
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredRecords = records.filter(r => 
    r.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manutenção da Frota</h1>
          <p className="text-slate-500 text-sm">Controle de O.S., custos e histórico de serviços</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          Nova Manutenção
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar por placa, serviço ou prestador..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <span className="text-sm text-slate-500 hidden md:block">
            {records.length} ordens de serviço
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">O.S. / Data</th>
                <th className="px-6 py-3">Veículo</th>
                <th className="px-6 py-3">Serviço / Prestador</th>
                <th className="px-6 py-3">Documentos</th>
                <th className="px-6 py-3">Custo Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                     Nenhum registro de manutenção encontrado.
                   </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-400 mb-1">#{rec.id.slice(0, 8)}</div>
                        <div className="text-slate-700 font-medium">{new Date(rec.date).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{rec.vehiclePlate}</td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{rec.description}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            {rec.type === 'OIL_CHANGE' ? <Droplet size={12} className="text-orange-500"/> : <Briefcase size={12} />}
                            {rec.provider}
                        </div>
                        {/* Display Filters if any */}
                        {rec.filters && (Object.values(rec.filters).some(Boolean)) && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {rec.filters.oil && <span className="text-[10px] bg-slate-100 px-1 rounded border">Óleo</span>}
                                {rec.filters.air && <span className="text-[10px] bg-slate-100 px-1 rounded border">Ar</span>}
                                {rec.filters.fuel && <span className="text-[10px] bg-slate-100 px-1 rounded border">Comb.</span>}
                                {rec.filters.cabin && <span className="text-[10px] bg-slate-100 px-1 rounded border">Cab.</span>}
                            </div>
                        )}
                        {/* Display items if any */}
                        {rec.replacedItems && (
                            <div className="text-[10px] text-slate-500 mt-1 italic truncate max-w-[150px]" title={rec.replacedItems}>
                                + {rec.replacedItems}
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex gap-2">
                           {rec.osFileUrl && (
                               <span title="O.S. Anexada" className="text-blue-600"><FileText size={18} /></span>
                           )}
                           {rec.invoiceFileUrl && (
                               <span title="Nota Fiscal Anexada" className="text-green-600"><Paperclip size={18} /></span>
                           )}
                           {!rec.osFileUrl && !rec.invoiceFileUrl && (
                               <span className="text-slate-300">-</span>
                           )}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                       <div className="flex flex-col">
                           <span>{formatCurrency(rec.totalCost)}</span>
                           <span className="text-xs text-slate-400 font-normal">
                               {rec.type === 'PREVENTIVE' ? 'Preventiva' : rec.type === 'OIL_CHANGE' ? 'Troca de Óleo' : 'Corretiva'}
                           </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          rec.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.status === 'COMPLETED' ? 'Concluída' : 'Aberta'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(rec)}
                          className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition shadow-sm"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(rec.id, rec.description)}
                          className="p-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition shadow-sm"
                          title="Excluir"
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
                <Wrench className="text-blue-600" />
                {editingId ? 'Editar Ordem de Serviço' : 'Nova Manutenção'}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Veículo *</label>
                  <input 
                    list="vehicles-list"
                    className="w-full border border-slate-300 rounded-lg p-2 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({...formData, vehiclePlate: e.target.value})}
                    placeholder="Buscar placa..."
                    required
                  />
                  <datalist id="vehicles-list">
                      {vehicles.map(v => (
                          <option key={v.id} value={v.plate}>{v.model}</option>
                      ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data do Serviço *</label>
                  <div className="relative">
                    <input 
                        type="date" 
                        className="w-full border border-slate-300 rounded-lg p-2 pl-9 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>

                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Serviço *</label>
                   <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Ex: Troca de Óleo e Filtros"
                        required
                    />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Prestador (Oficina/Mecânico) *</label>
                   <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.provider}
                        onChange={(e) => setFormData({...formData, provider: e.target.value})}
                        placeholder="Nome da empresa"
                        required
                    />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Manutenção</label>
                   <select 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as MaintenanceType})}
                   >
                       <option value="PREVENTIVE">Preventiva</option>
                       <option value="CORRECTIVE">Corretiva</option>
                       <option value="OIL_CHANGE">Troca de Óleo</option>
                   </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hodômetro (Km)</label>
                    <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.odometer}
                        onChange={(e) => setFormData({...formData, odometer: Number(e.target.value)})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as 'OPEN' | 'COMPLETED'})}
                    >
                        <option value="OPEN">Aberta</option>
                        <option value="COMPLETED">Concluída</option>
                    </select>
                </div>
              </div>
              
              {/* MAINTENANCE DETAILS (FOR ALL TYPES) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 animate-fade-in">
                 <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <List size={18} className="text-slate-500"/> Itens e Próxima Manutenção (Opcional)
                 </h4>
                 
                 <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Checklist Rápido (Filtros)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-blue-400 transition">
                             <input type="checkbox" checked={formData.filters?.oil} onChange={() => handleFilterChange('oil')} className="text-blue-600 rounded focus:ring-blue-500" />
                             <span className="text-sm font-medium text-slate-700">Óleo Motor</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-blue-400 transition">
                             <input type="checkbox" checked={formData.filters?.air} onChange={() => handleFilterChange('air')} className="text-blue-600 rounded focus:ring-blue-500" />
                             <span className="text-sm font-medium text-slate-700">Filtro Ar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-blue-400 transition">
                             <input type="checkbox" checked={formData.filters?.fuel} onChange={() => handleFilterChange('fuel')} className="text-blue-600 rounded focus:ring-blue-500" />
                             <span className="text-sm font-medium text-slate-700">Filtro Comb.</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-blue-400 transition">
                             <input type="checkbox" checked={formData.filters?.cabin} onChange={() => handleFilterChange('cabin')} className="text-blue-600 rounded focus:ring-blue-500" />
                             <span className="text-sm font-medium text-slate-700">Filtro Cabine</span>
                        </label>
                    </div>

                    <label className="block text-xs font-semibold text-slate-500 mb-1">Outros Itens Substituídos / Verificados</label>
                    <input 
                        type="text"
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                        value={formData.replacedItems}
                        onChange={(e) => setFormData({...formData, replacedItems: e.target.value})}
                        placeholder="Ex: Pastilhas de freio, Disco, Fluido de radiador..."
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Manutenção (Data)</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                className="w-full border border-slate-300 rounded-lg p-2 pl-9 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                                value={formData.nextMaintenanceDate}
                                onChange={(e) => setFormData({...formData, nextMaintenanceDate: e.target.value})}
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Manutenção (Km)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded-lg p-2 pl-9 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                                value={formData.nextMaintenanceKm || ''}
                                onChange={(e) => setFormData({...formData, nextMaintenanceKm: Number(e.target.value)})}
                                placeholder="Ex: 50000"
                            />
                            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                     </div>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <DollarSign size={18} /> Custos
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Valor Peças (R$)</label>
                          <input 
                            type="number"
                            step="0.01"
                            className="w-full border border-slate-300 rounded-lg p-2 text-right font-mono"
                            value={formData.partsCost}
                            onChange={(e) => setFormData({...formData, partsCost: Number(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Valor Mão de Obra (R$)</label>
                          <input 
                            type="number"
                            step="0.01"
                            className="w-full border border-slate-300 rounded-lg p-2 text-right font-mono"
                            value={formData.laborCost}
                            onChange={(e) => setFormData({...formData, laborCost: Number(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Total Estimado</label>
                          <div className="w-full bg-slate-200 rounded-lg p-2 text-right font-bold text-slate-800">
                             {formatCurrency(calculateTotal(formData.partsCost || 0, formData.laborCost || 0))}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <FileText size={18} /> Documentação
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ordem de Serviço (O.S.)</label>
                        <label className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition bg-white">
                             <Upload size={18} className="text-blue-600" />
                             <span className="text-sm text-slate-600 truncate flex-1">
                                {formData.osFileUrl ? "Documento Anexado (Alterar)" : "Importar O.S. (PDF/Img)"}
                             </span>
                             <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'osFileUrl')} />
                        </label>
                        {formData.osFileUrl && (
                             <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-green-600 font-medium">O.S. carregada</span>
                                <a href={formData.osFileUrl} download={`os_${formData.id}.pdf`} className="text-blue-600 hover:underline flex items-center gap-1">
                                    <Download size={12}/> Baixar
                                </a>
                             </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nota Fiscal (NF)</label>
                        <label className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition bg-white">
                             <Paperclip size={18} className="text-green-600" />
                             <span className="text-sm text-slate-600 truncate flex-1">
                                {formData.invoiceFileUrl ? "Documento Anexado (Alterar)" : "Importar Nota Fiscal"}
                             </span>
                             <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'invoiceFileUrl')} />
                        </label>
                        {formData.invoiceFileUrl && (
                             <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-green-600 font-medium">NF carregada</span>
                                <a href={formData.invoiceFileUrl} download={`nf_${formData.id}.pdf`} className="text-blue-600 hover:underline flex items-center gap-1">
                                    <Download size={12}/> Baixar
                                </a>
                             </div>
                        )}
                      </div>
                  </div>
              </div>

              <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Observações Adicionais</label>
                   <textarea 
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900 h-24"
                        value={formData.observations}
                        onChange={(e) => setFormData({...formData, observations: e.target.value})}
                        placeholder="Detalhes sobre peças trocadas, garantia, etc."
                    />
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
                  Salvar O.S.
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManager;
