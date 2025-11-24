
import React, { useEffect, useState } from 'react';
import { getStats, getChecklists, getVehicles, getMaintenances } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PlusCircle, History, CheckCircle, AlertTriangle, XCircle, Search, FileWarning, ArrowRight, DollarSign, Droplet, FileText, Calendar, Gauge, Wrench } from 'lucide-react';
import { VehicleStatus, Vehicle, MaintenanceRecord } from '../types';

interface DashboardProps {
  onNewChecklist: () => void;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

interface OilStatus {
    vehicle: Vehicle;
    lastChangeDate?: string;
    nextChangeDate?: string;
    nextChangeKm?: number;
    currentKm: number;
    status: 'OK' | 'WARNING' | 'EXPIRED' | 'UNKNOWN';
    message: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewChecklist }) => {
  const [stats, setStats] = useState(getStats());
  const [recent, setRecent] = useState(getChecklists().slice(0, 5));
  const [searchTerm, setSearchTerm] = useState('');
  const [expiredVehicles, setExpiredVehicles] = useState<Vehicle[]>([]);
  const [licensingStats, setLicensingStats] = useState({ ok: 0, warning: 0, expired: 0, total: 0 });
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<{vehicle: Vehicle, date?: string, status: 'EXPIRED' | 'WARNING', reason: string, type: string}[]>([]);
  const [oilStatuses, setOilStatuses] = useState<OilStatus[]>([]);
  
  // Refresh stats on mount
  useEffect(() => {
    setStats(getStats());
    setRecent(getChecklists().slice(0, 5));
    checkExpiredLicensing();
    checkMaintenanceAlerts();
    checkOilStatus();
  }, []);

  const getLatestOdometer = (plate: string) => {
    const checklists = getChecklists();
    const maintenances = getMaintenances();
    
    const maxChecklist = checklists
        .filter(c => c.vehiclePlate === plate)
        .reduce((max, c) => c.odometer > max ? c.odometer : max, 0);
        
    const maxMaintenance = maintenances
        .filter(m => m.vehiclePlate === plate)
        .reduce((max, m) => m.odometer > max ? m.odometer : max, 0);
        
    return Math.max(maxChecklist, maxMaintenance);
  };

  const checkExpiredLicensing = () => {
      const vehicles = getVehicles();
      const today = new Date();
      let ok = 0;
      let warning = 0;
      let expired = 0;
      const expiredList: Vehicle[] = [];

      vehicles.forEach(v => {
          if (!v.lastLicensingDate) {
              ok++; // Treat as ok/unknown if not set
              return;
          }
          const lastDate = new Date(`${v.lastLicensingDate}-01T00:00:00`);
          const nextDue = new Date(lastDate);
          nextDue.setFullYear(lastDate.getFullYear() + 1);
          
          const diffTime = nextDue.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (today > nextDue) {
              expired++;
              expiredList.push(v);
          } else if (diffDays <= 30) {
              warning++;
          } else {
              ok++;
          }
      });
      setExpiredVehicles(expiredList);
      setLicensingStats({ ok, warning, expired, total: vehicles.length });
  };

  const checkOilStatus = () => {
      const vehicles = getVehicles();
      const maintenances = getMaintenances();
      const today = new Date();
      const statuses: OilStatus[] = [];

      vehicles.forEach(vehicle => {
          const currentKm = getLatestOdometer(vehicle.plate);
          // Find last OIL_CHANGE
          const oilRecords = maintenances
            .filter(m => m.vehiclePlate === vehicle.plate && m.type === 'OIL_CHANGE')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (oilRecords.length === 0) {
              statuses.push({
                  vehicle,
                  currentKm,
                  status: 'UNKNOWN',
                  message: 'Sem registro de troca'
              });
              return;
          }

          const lastRecord = oilRecords[0];
          let status: 'OK' | 'WARNING' | 'EXPIRED' = 'OK';
          let message = 'Em dia';

          // Check Date
          if (lastRecord.nextMaintenanceDate) {
              const nextDate = new Date(`${lastRecord.nextMaintenanceDate}T00:00:00`);
              const diffTime = nextDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (today > nextDate) {
                  status = 'EXPIRED';
                  message = `Venceu em ${new Date(nextDate).toLocaleDateString('pt-BR')}`;
              } else if (diffDays <= 30) {
                  status = 'WARNING';
                  message = `Vence em ${diffDays} dias`;
              }
          }

          // Check KM (Overrides date if worse)
          if (lastRecord.nextMaintenanceKm) {
              const remainingKm = lastRecord.nextMaintenanceKm - currentKm;
              
              if (currentKm >= lastRecord.nextMaintenanceKm) {
                  status = 'EXPIRED';
                  message = `Excedeu ${Math.abs(remainingKm)} km`;
              } else if (remainingKm <= 1000) {
                  if (status !== 'EXPIRED') {
                      status = 'WARNING';
                      message = `Restam ${remainingKm} km`;
                  }
              }
          }

          statuses.push({
              vehicle,
              lastChangeDate: lastRecord.date,
              nextChangeDate: lastRecord.nextMaintenanceDate,
              nextChangeKm: lastRecord.nextMaintenanceKm,
              currentKm,
              status,
              message
          });
      });

      // Sort: Expired -> Warning -> Unknown -> OK
      statuses.sort((a, b) => {
          const priority = { 'EXPIRED': 0, 'WARNING': 1, 'UNKNOWN': 2, 'OK': 3 };
          return priority[a.status] - priority[b.status];
      });

      setOilStatuses(statuses);
  };

  const checkMaintenanceAlerts = () => {
      const vehicles = getVehicles();
      const maintenances = getMaintenances();
      const today = new Date();
      const alerts: {vehicle: Vehicle, date?: string, status: 'EXPIRED' | 'WARNING', reason: string, type: string}[] = [];
      const maintenanceTypes = ['PREVENTIVE', 'CORRECTIVE']; // Oil change handled separately now

      vehicles.forEach(vehicle => {
          const vehicleMaintenances = maintenances.filter(m => m.vehiclePlate === vehicle.plate);
          const currentKm = getLatestOdometer(vehicle.plate);

          maintenanceTypes.forEach(type => {
             const typeRecords = vehicleMaintenances
                .filter(m => m.type === type)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
             
             if (typeRecords.length > 0) {
                 const lastRecord = typeRecords[0];
                 let isExpired = false;
                 let isWarning = false;
                 let reason = '';
                 
                 if (lastRecord.nextMaintenanceDate || lastRecord.nextMaintenanceKm) {
                    if (lastRecord.nextMaintenanceDate) {
                        const nextDate = new Date(`${lastRecord.nextMaintenanceDate}T00:00:00`);
                        if (today > nextDate) {
                            isExpired = true;
                            reason = 'Data Vencida';
                        } else {
                            const diffTime = Math.abs(nextDate.getTime() - today.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                            if (diffDays <= 30) {
                                isWarning = true;
                                reason = 'Data Próxima';
                            }
                        }
                    }

                    if (!isExpired && lastRecord.nextMaintenanceKm) {
                        if (currentKm > 0) {
                            if (currentKm >= lastRecord.nextMaintenanceKm) {
                                isExpired = true;
                                reason = reason ? `${reason} e Km Excedido` : `Km Excedido (${currentKm}km)`;
                            } else if (lastRecord.nextMaintenanceKm - currentKm <= 1000) {
                                if (!isExpired) {
                                    isWarning = true;
                                    reason = reason ? `${reason} e Km Próximo` : `Km Próximo (${lastRecord.nextMaintenanceKm - currentKm}km restantes)`;
                                }
                            }
                        }
                    }

                    if (isExpired) {
                        alerts.push({ 
                            vehicle, 
                            date: lastRecord.nextMaintenanceDate, 
                            status: 'EXPIRED', 
                            reason,
                            type: type === 'PREVENTIVE' ? 'Preventiva' : 'Corretiva'
                        });
                    } else if (isWarning) {
                        alerts.push({ 
                            vehicle, 
                            date: lastRecord.nextMaintenanceDate, 
                            status: 'WARNING', 
                            reason,
                            type: type === 'PREVENTIVE' ? 'Preventiva' : 'Corretiva'
                        });
                    }
                 }
             }
          });
      });
      setMaintenanceAlerts(alerts);
  };

  const pieData = [
    { name: 'Aptos', value: stats.vehiclesActive },
    { name: 'Em Manutenção', value: stats.vehiclesRepair },
    { name: 'Com Restrições', value: Math.max(0, stats.totalInspections - stats.vehiclesActive - stats.vehiclesRepair) }
  ];

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.AVAILABLE: return 'text-green-600 bg-green-100';
      case VehicleStatus.RESTRICTED: return 'text-yellow-600 bg-yellow-100';
      case VehicleStatus.UNAVAILABLE: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel de Controle</h1>
          <p className="text-slate-500 text-sm">Visão geral da frota e inspeções recentes</p>
        </div>
      </div>

      {/* ALERT: Expired Licensing */}
      {expiredVehicles.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-pulse">
             <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                 <FileWarning size={24} />
             </div>
             <div className="flex-1">
                 <h3 className="font-bold text-red-800">Atenção: Licenciamento Vencido</h3>
                 <p className="text-sm text-red-600 mt-1">
                     {expiredVehicles.length} veículo(s) estão com o licenciamento anual vencido. Verifique a documentação urgentemente.
                 </p>
                 <div className="mt-2 flex flex-wrap gap-2">
                     {expiredVehicles.map(v => (
                         <span key={v.id} className="inline-flex items-center px-2 py-1 bg-white border border-red-200 rounded text-xs font-bold text-red-700">
                             {v.plate} ({v.model})
                         </span>
                     ))}
                 </div>
             </div>
          </div>
      )}

      {/* ALERT: General Maintenance Due */}
      {maintenanceAlerts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
             <div className="p-2 bg-orange-100 rounded-full text-orange-600 shrink-0">
                 <Wrench size={24} />
             </div>
             <div className="flex-1">
                 <h3 className="font-bold text-orange-800">Atenção: Manutenção Geral Necessária</h3>
                 <p className="text-sm text-orange-600 mt-1">
                     Existem veículos com revisões preventivas/corretivas vencidas ou próximas.
                 </p>
                 <div className="mt-2 flex flex-col gap-2">
                     {maintenanceAlerts.map((alert, idx) => (
                         <div key={idx} className="flex items-center gap-2 text-sm flex-wrap bg-white/50 p-1 rounded">
                             <span className="font-bold text-slate-700">{alert.vehicle.plate}</span>
                             <span className="text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-1 rounded">{alert.type}</span>
                             <span className="text-slate-500">
                                {alert.date ? `Prev: ${new Date(alert.date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                                {alert.date && alert.reason.includes('Km') ? ' - ' : ''}
                                {alert.reason}
                             </span>
                             {alert.status === 'EXPIRED' ? (
                                 <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">VENCIDO</span>
                             ) : (
                                 <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">PRÓXIMO</span>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
          </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <History size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Inspeções</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalInspections}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Veículos Aptos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.vehiclesActive}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <XCircle size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Inaptos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.vehiclesRepair}</p>
        </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Manutenção</span>
          </div>
          <p className="text-lg font-bold text-slate-800 truncate" title={formatCurrency(stats.maintenanceCost)}>
              {formatCurrency(stats.maintenanceCost)}
          </p>
        </div>
        
        {/* Licensing KPI */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${licensingStats.expired > 0 ? 'bg-red-100 text-red-600' : licensingStats.warning > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
              <FileText size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Licenciamento</span>
          </div>
          <div className="flex flex-col">
             <span className={`text-xl font-bold ${licensingStats.expired > 0 ? 'text-red-600' : licensingStats.warning > 0 ? 'text-orange-600' : 'text-slate-800'}`}>
                 {licensingStats.expired > 0 ? `${licensingStats.expired} Vencidos` : licensingStats.warning > 0 ? `${licensingStats.warning} Alertas` : 'Em Dia'}
             </span>
             <span className="text-xs text-slate-500">
                 {licensingStats.ok} de {licensingStats.total} regulares
             </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4">Volume de Inspeções (Simulado)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Seg', uv: 4 },
                        { name: 'Ter', uv: 3 },
                        { name: 'Qua', uv: 2 },
                        { name: 'Qui', uv: 7 },
                        { name: 'Sex', uv: 5 },
                        { name: 'Sab', uv: 1 },
                        { name: 'Dom', uv: 0 },
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="uv" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Checklists */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-700">Checklists Recentes</h3>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar placa..." 
                        className="pl-8 pr-4 py-1 text-sm border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Veículo</th>
                        <th className="px-6 py-3">Motorista</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {recent.length === 0 ? (
                        <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            Nenhum checklist realizado ainda.
                        </td>
                        </tr>
                    ) : (
                        recent
                        .filter(r => r.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 text-slate-600">
                            {new Date(record.date).toLocaleDateString('pt-BR')} <br/>
                            <span className="text-xs text-slate-400">{new Date(record.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            </td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{record.vehiclePlate}</div>
                            <div className="text-xs text-slate-500">{record.odometer.toLocaleString()} km</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{record.driverName}</td>
                            <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                                {record.status}
                            </span>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>

        {/* Right Column: Oil & Fleet Status */}
        <div className="space-y-6">
             {/* OIL CHANGE MONITOR */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <Droplet className="text-orange-500" size={20} />
                    <h3 className="font-semibold text-slate-800">Monitoramento de Troca de Óleo</h3>
                 </div>
                 <div className="max-h-[400px] overflow-y-auto">
                    {oilStatuses.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">
                            Nenhum veículo cadastrado.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {oilStatuses.map((item, index) => (
                                <div key={index} className="p-4 hover:bg-slate-50 transition">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-slate-700">{item.vehicle.plate}</div>
                                        {item.status === 'EXPIRED' && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">VENCIDO</span>}
                                        {item.status === 'WARNING' && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">PRÓXIMO</span>}
                                        {item.status === 'OK' && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">OK</span>}
                                        {item.status === 'UNKNOWN' && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">-</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mb-2">{item.vehicle.model}</div>
                                    
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1 text-slate-600" title="Quilometragem Atual">
                                            <Gauge size={14} />
                                            {item.currentKm.toLocaleString()} km
                                        </div>
                                        {item.nextChangeKm && (
                                            <div className={`flex items-center gap-1 font-medium ${item.status === 'EXPIRED' ? 'text-red-600' : 'text-slate-500'}`} title="Próxima Troca (Km)">
                                                <ArrowRight size={12} />
                                                {item.nextChangeKm.toLocaleString()} km
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs">
                                         <span className={`${item.status === 'EXPIRED' ? 'text-red-600 font-bold' : item.status === 'WARNING' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                                            {item.message}
                                         </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
                 <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
                     <button onClick={() => window.location.hash = '#/manutencao'} className="text-xs text-blue-600 font-medium hover:underline">
                         Gerenciar Manutenções
                     </button>
                 </div>
            </div>

            {/* Fleet Status Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4">Status da Frota</h3>
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '12px'}}/>
                    </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                        <span className="text-xl font-bold text-slate-700">{stats.totalInspections}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
