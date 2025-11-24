
import { ChecklistRecord, VehicleStatus, Vehicle, Collaborator, AccessGroup, Permission, MaintenanceRecord, SystemSettingItem, SystemSettingType, BackupData } from '../types';

const KEY_CHECKLISTS = 'fleetguard_checklists';
const KEY_VEHICLES = 'fleetguard_vehicles';
const KEY_COLLABORATORS = 'fleetguard_collaborators';
const KEY_ACCESS_GROUPS = 'fleetguard_access_groups';
const KEY_MAINTENANCE = 'fleetguard_maintenance';
const KEY_SYSTEM_SETTINGS = 'fleetguard_system_settings';
const KEY_CURRENT_USER_ROLE = 'fleetguard_mock_role'; // For simulation purposes

// --- CHECKLISTS ---

export const saveChecklist = (checklist: ChecklistRecord): void => {
  const existing = getChecklists();
  const updated = [checklist, ...existing];
  localStorage.setItem(KEY_CHECKLISTS, JSON.stringify(updated));
  
  // Also update the vehicle status in the vehicle registry if it exists
  const vehicles = getVehicles();
  const vehicleIndex = vehicles.findIndex(v => v.plate === checklist.vehiclePlate);
  if (vehicleIndex >= 0) {
      vehicles[vehicleIndex].status = checklist.status;
      localStorage.setItem(KEY_VEHICLES, JSON.stringify(vehicles));
  }
};

export const getChecklists = (): ChecklistRecord[] => {
  const data = localStorage.getItem(KEY_CHECKLISTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse checklists', e);
    return [];
  }
};

// --- VEHICLES ---

export const getVehicles = (): Vehicle[] => {
    const data = localStorage.getItem(KEY_VEHICLES);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

export const saveVehicle = (vehicle: Vehicle): void => {
    const vehicles = getVehicles();
    const index = vehicles.findIndex(v => v.id === vehicle.id);
    
    if (index >= 0) {
        vehicles[index] = vehicle;
    } else {
        vehicles.push(vehicle);
    }
    
    localStorage.setItem(KEY_VEHICLES, JSON.stringify(vehicles));
};

export const deleteVehicle = (id: string): void => {
    const vehicles = getVehicles();
    const updated = vehicles.filter(v => v.id !== id);
    localStorage.setItem(KEY_VEHICLES, JSON.stringify(updated));
};

export const getVehicleByPlate = (plate: string): Vehicle | undefined => {
    const vehicles = getVehicles();
    // Normalize plate for comparison (remove generic chars if needed, but assuming standard format)
    return vehicles.find(v => v.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
}

export const getVehicleByCode = (code: string): Vehicle | undefined => {
    const vehicles = getVehicles();
    // Case insensitive comparison for code
    return vehicles.find(v => v.code && v.code.toUpperCase() === code.toUpperCase());
}

// --- MAINTENANCE ---

export const getMaintenances = (): MaintenanceRecord[] => {
  const data = localStorage.getItem(KEY_MAINTENANCE);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const saveMaintenance = (record: MaintenanceRecord): void => {
  const list = getMaintenances();
  const index = list.findIndex(m => m.id === record.id);
  
  if (index >= 0) {
      list[index] = record;
  } else {
      list.unshift(record); // Add to top
  }
  
  localStorage.setItem(KEY_MAINTENANCE, JSON.stringify(list));
};

export const deleteMaintenance = (id: string): void => {
  const list = getMaintenances();
  const updated = list.filter(m => m.id !== id);
  localStorage.setItem(KEY_MAINTENANCE, JSON.stringify(updated));
};

// --- ACCESS GROUPS ---

const DEFAULT_GROUPS: AccessGroup[] = [
  {
    id: 'Administrador', // Using name as ID for backward compatibility
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    isSystem: true,
    permissions: ['view_dashboard', 'view_history', 'manage_vehicles', 'manage_collaborators', 'manage_groups', 'create_checklist', 'manage_maintenance']
  },
  {
    id: 'Gestor',
    name: 'Gestor',
    description: 'Gerenciamento de frota e relatórios',
    isSystem: true,
    permissions: ['view_dashboard', 'view_history', 'manage_vehicles', 'manage_collaborators', 'manage_maintenance']
  },
  {
    id: 'Supervisor',
    name: 'Supervisor',
    description: 'Supervisão de manutenção e veículos',
    isSystem: true,
    permissions: ['view_dashboard', 'view_history', 'manage_vehicles', 'manage_maintenance', 'create_checklist']
  },
  {
    id: 'Motorista',
    name: 'Motorista',
    description: 'Apenas realização de checklists',
    isSystem: true,
    permissions: ['create_checklist']
  },
  {
    id: 'Mecânico',
    name: 'Mecânico',
    description: 'Realização de checklists e manutenção',
    isSystem: true,
    permissions: ['create_checklist', 'manage_maintenance']
  }
];

export const getAccessGroups = (): AccessGroup[] => {
  const data = localStorage.getItem(KEY_ACCESS_GROUPS);
  if (!data) {
    // Initialize default groups if none exist
    localStorage.setItem(KEY_ACCESS_GROUPS, JSON.stringify(DEFAULT_GROUPS));
    return DEFAULT_GROUPS;
  }
  try {
    const groups = JSON.parse(data);
    if (groups.length === 0) {
       localStorage.setItem(KEY_ACCESS_GROUPS, JSON.stringify(DEFAULT_GROUPS));
       return DEFAULT_GROUPS;
    }
    return groups;
  } catch (e) {
    return DEFAULT_GROUPS;
  }
};

export const saveAccessGroup = (group: AccessGroup): void => {
  const list = getAccessGroups();
  const index = list.findIndex(g => g.id === group.id);
  
  if (index >= 0) {
      list[index] = group;
  } else {
      list.push(group);
  }
  
  localStorage.setItem(KEY_ACCESS_GROUPS, JSON.stringify(list));
};

export const deleteAccessGroup = (id: string): void => {
  const list = getAccessGroups();
  const group = list.find(g => g.id === id);
  if (group && group.isSystem) {
    throw new Error("Grupos de sistema não podem ser excluídos.");
  }
  const updated = list.filter(g => g.id !== id);
  localStorage.setItem(KEY_ACCESS_GROUPS, JSON.stringify(updated));
};

// --- COLLABORATORS ---

export const getCollaborators = (): Collaborator[] => {
  const data = localStorage.getItem(KEY_COLLABORATORS);
  if (!data) return [];
  try {
      return JSON.parse(data);
  } catch (e) {
      return [];
  }
};

export const saveCollaborator = (collaborator: Collaborator): void => {
  const list = getCollaborators();
  const index = list.findIndex(c => c.id === collaborator.id);
  
  if (index >= 0) {
      list[index] = collaborator;
  } else {
      list.push(collaborator);
  }
  
  localStorage.setItem(KEY_COLLABORATORS, JSON.stringify(list));
};

export const deleteCollaborator = (id: string): void => {
  const list = getCollaborators();
  const updated = list.filter(c => c.id !== id);
  localStorage.setItem(KEY_COLLABORATORS, JSON.stringify(updated));
};

// --- SYSTEM SETTINGS (Units, Sectors, etc) ---

export const getSystemSettings = (): SystemSettingItem[] => {
    const data = localStorage.getItem(KEY_SYSTEM_SETTINGS);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

export const saveSystemSetting = (item: SystemSettingItem): void => {
    const list = getSystemSettings();
    const index = list.findIndex(i => i.id === item.id);
    if (index >= 0) {
        list[index] = item;
    } else {
        list.push(item);
    }
    localStorage.setItem(KEY_SYSTEM_SETTINGS, JSON.stringify(list));
};

export const deleteSystemSetting = (id: string): void => {
    const list = getSystemSettings();
    const updated = list.filter(i => i.id !== id);
    localStorage.setItem(KEY_SYSTEM_SETTINGS, JSON.stringify(updated));
};

export const getSettingsByType = (type: SystemSettingType): SystemSettingItem[] => {
    const list = getSystemSettings();
    return list.filter(i => i.type === type).sort((a,b) => a.name.localeCompare(b.name));
};

// --- AUTH MOCK ---

export const getMockUserRole = (): string => {
    return localStorage.getItem(KEY_CURRENT_USER_ROLE) || 'Administrador';
};

export const setMockUserRole = (roleId: string) => {
    localStorage.setItem(KEY_CURRENT_USER_ROLE, roleId);
};

// --- STATS & EXPORTS ---

export const getStats = () => {
  const list = getChecklists();
  const total = list.length;
  // Use current vehicle status from registry if available, otherwise fallback to checklist history
  const vehicles = getVehicles();
  const maintenance = getMaintenances();
  
  let active = 0;
  let repair = 0;

  if (vehicles.length > 0) {
     active = vehicles.filter(v => v.status !== VehicleStatus.UNAVAILABLE).length;
     repair = vehicles.filter(v => v.status === VehicleStatus.UNAVAILABLE).length;
  } else {
     // Fallback if no vehicles registered
     active = list.filter(c => c.status !== VehicleStatus.UNAVAILABLE).length;
     repair = list.filter(c => c.status === VehicleStatus.UNAVAILABLE).length;
  }

  const lastDate = list.length > 0 ? new Date(list[0].date).toLocaleDateString('pt-BR') : '-';
  
  const totalMaintenanceCost = maintenance.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  return {
    totalInspections: total,
    vehiclesActive: active,
    vehiclesRepair: repair,
    lastInspectionDate: lastDate,
    maintenanceCost: totalMaintenanceCost
  };
};

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  vehiclePlate?: string;
  unit?: string;
  sector?: string;
  driverName?: string;
}

export const exportToCSV = (filters?: ExportFilters) => {
    let list = getChecklists();

    if (filters) {
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            list = list.filter(c => new Date(c.date) >= start);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            list = list.filter(c => new Date(c.date) <= end);
        }
        if (filters.vehiclePlate && filters.vehiclePlate.trim() !== '') {
            const term = filters.vehiclePlate.toLowerCase().trim();
            list = list.filter(c => c.vehiclePlate.toLowerCase().includes(term));
        }
        if (filters.unit && filters.unit.trim() !== '') {
            const term = filters.unit.toLowerCase().trim();
            list = list.filter(c => (c.unit || '').toLowerCase().includes(term));
        }
        if (filters.sector && filters.sector.trim() !== '') {
            const term = filters.sector.toLowerCase().trim();
            list = list.filter(c => (c.sector || '').toLowerCase().includes(term));
        }
        if (filters.driverName && filters.driverName.trim() !== '') {
            const term = filters.driverName.toLowerCase().trim();
            list = list.filter(c => (c.driverName || '').toLowerCase().includes(term));
        }
    }

    if (list.length === 0) {
        alert("Nenhum registro encontrado para os filtros selecionados.");
        return;
    }

    const headers = ['ID', 'Data', 'Placa', 'Motorista', 'Status', 'Km', 'Unidade', 'Setor'];
    const rows = list.map(c => [
        c.id,
        new Date(c.date).toLocaleString(),
        c.vehiclePlate,
        c.driverName,
        c.status,
        c.odometer,
        c.unit,
        c.sector || ''
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + "\n" + rows.join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_frota_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- BACKUP & RESTORE ---

export const getStorageUsage = () => {
  let total = 0;
  for (let x in localStorage) {
    if (localStorage.hasOwnProperty(x)) {
      total += ((localStorage[x].length + x.length) * 2);
    }
  }
  // Approximate 5MB limit for most browsers = 5 * 1024 * 1024 bytes
  // Multiply by 2 because JS strings are UTF-16 (2 bytes per char) roughly
  const limit = 5 * 1024 * 1024; 
  return {
    used: total,
    limit: limit,
    percentage: Math.min((total / limit) * 100, 100)
  };
};

export const createBackup = (): BackupData => {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      checklists: getChecklists(),
      vehicles: getVehicles(),
      collaborators: getCollaborators(),
      accessGroups: getAccessGroups(),
      maintenance: getMaintenances(),
      systemSettings: getSystemSettings(),
    }
  };
};

export const restoreBackup = (backup: BackupData): boolean => {
  try {
    if (!backup.data) throw new Error("Formato de backup inválido");
    
    // Validate core structure
    if (!Array.isArray(backup.data.checklists)) throw new Error("Checklists inválidos");
    
    // Clear and Replace
    if (backup.data.checklists) localStorage.setItem(KEY_CHECKLISTS, JSON.stringify(backup.data.checklists));
    if (backup.data.vehicles) localStorage.setItem(KEY_VEHICLES, JSON.stringify(backup.data.vehicles));
    if (backup.data.collaborators) localStorage.setItem(KEY_COLLABORATORS, JSON.stringify(backup.data.collaborators));
    if (backup.data.accessGroups) localStorage.setItem(KEY_ACCESS_GROUPS, JSON.stringify(backup.data.accessGroups));
    if (backup.data.maintenance) localStorage.setItem(KEY_MAINTENANCE, JSON.stringify(backup.data.maintenance));
    if (backup.data.systemSettings) localStorage.setItem(KEY_SYSTEM_SETTINGS, JSON.stringify(backup.data.systemSettings));
    
    return true;
  } catch (e) {
    console.error("Erro ao restaurar backup:", e);
    return false;
  }
};
