
import React, { useState, useEffect } from 'react';
import { getChecklists, exportToCSV } from '../services/storageService';
import { ChecklistRecord, VehicleStatus } from '../types';
import { Search, Calendar, Filter, Eye, ClipboardList, Wrench, FileDown, X } from 'lucide-react';

const History: React.FC = () => {
  const [records, setRecords] = useState<ChecklistRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ChecklistRecord[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CHECKLIST' | 'MAINTENANCE'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    plate: '',
    unit: '',
    sector: '',
    driverName: ''
  });

  useEffect(() => {
    const data = getChecklists();
    setRecords(data);
    setFilteredRecords(data);
  }, []);

  useEffect(() => {
    let result = records;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.vehiclePlate.toLowerCase().includes(term) ||
        r.vehicleModel.toLowerCase().includes(term) ||
        r.driverName.toLowerCase().includes(term)
      );
    }

    if (dateFilter) {
      result = result.filter(r => r.date.startsWith(dateFilter));
    }

    if (typeFilter !== 'ALL') {
      result = result.filter(r => {
        const type = r.recordType || 'CHECKLIST'; // Default to checklist for old records
        return type === typeFilter;
      });
    }

    setFilteredRecords(result);
  }, [records, searchTerm, dateFilter, typeFilter]);

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.AVAILABLE: return 'text-green-600 bg-green-100';
      case VehicleStatus.RESTRICTED: return 'text-yellow-600 bg-yellow-100';
      case VehicleStatus.UNAVAILABLE: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleExport = () => {
    exportToCSV({
        startDate: exportFilters.startDate,
        endDate: exportFilters.endDate,
        vehiclePlate: exportFilters.plate,
        unit: exportFilters.unit,
        sector: exportFilters.sector,
        driverName: exportFilters.driverName
    });
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Histórico de Operações</h1>
          <p className="text-slate-500 text-sm">Consulte checklists e registros de manutenção</p>
        </div>
        <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition bg-white"
        >
            <FileDown size={18} />
            <span>Exportar Relatório</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar placa, modelo ou motorista..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
         </div>
         
         <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
             />
         </div>

         <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 appearance-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
            >
                <option value="ALL">Todos os Tipos</option>
                <option value="CHECKLIST">Checklists</option>
                <option value="MAINTENANCE">Manutenções</option>
            </select>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Data / Hora</th>
                <th className="px-6 py-3">Veículo</th>
                <th className="px-6 py-3">Responsável</th>
                <th className="px-6 py-3">Status Final</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                     Nenhum registro encontrado com os filtros atuais.
                   </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4">
                        {record.recordType === 'MAINTENANCE' ? (
                             <div className="flex items-center gap-2 text-orange-600 font-medium">
                                <Wrench size={16} /> Manutenção
                             </div>
                        ) : (
                             <div className="flex items-center gap-2 text-blue-600 font-medium">
                                <ClipboardList size={16} /> Checklist
                             </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium text-slate-800">{new Date(record.date).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-slate-400">{new Date(record.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{record.vehiclePlate}</div>
                      <div className="text-xs text-slate-500">{record.vehicleModel}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{record.driverName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Ver Detalhes"
                        onClick={() => alert(`Detalhes do ID: ${record.id}`)}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <FileDown size={20} className="text-blue-600" />
                Exportar Relatório
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Inicial</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg p-2 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={exportFilters.startDate}
                      onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Final</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg p-2 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={exportFilters.endDate}
                      onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Placa (Opcional)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Ex: ABC-1234"
                    className="w-full border border-slate-300 rounded-lg p-2 pl-9 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                    value={exportFilters.plate}
                    onChange={(e) => setExportFilters({...exportFilters, plate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Matriz"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={exportFilters.unit}
                      onChange={(e) => setExportFilters({...exportFilters, unit: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Setor (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Logística"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={exportFilters.sector}
                      onChange={(e) => setExportFilters({...exportFilters, sector: e.target.value})}
                    />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motorista (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Nome do condutor"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={exportFilters.driverName}
                    onChange={(e) => setExportFilters({...exportFilters, driverName: e.target.value})}
                  />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 sticky bottom-0">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <FileDown size={16} />
                Baixar CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
