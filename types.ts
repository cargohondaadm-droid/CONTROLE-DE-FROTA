
export enum VehicleStatus {
  AVAILABLE = 'Apto para uso',
  RESTRICTED = 'Apto com restrições',
  UNAVAILABLE = 'Inapto'
}

export enum ChecklistStatus {
  OK = 'OK',
  NOK = 'NOK',
  NA = 'N/A'
}

export type RecordType = 'CHECKLIST' | 'MAINTENANCE';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: string;
  unit?: string;
  sector?: string;
  code?: string; // patrimonio
  renavam?: string;
  lastLicensingDate?: string; // Format YYYY-MM
  licensingDocUrl?: string | null; // Base64 or URL
  status: VehicleStatus;
}

export interface Collaborator {
  id: string;
  name: string;
  registrationId: string; // Matrícula
  email: string;
  phone: string;
  jobTitle: string; // Função
  group: string; // Changed from union to string to support dynamic groups (stores group ID)
  password?: string;
  changePasswordOnFirstLogin?: boolean;
}

export type Permission = 
  | 'view_dashboard'
  | 'view_history'
  | 'manage_vehicles'
  | 'manage_collaborators'
  | 'manage_groups'
  | 'create_checklist'
  | 'manage_maintenance';

export interface AccessGroup {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean; // If true, cannot be deleted (e.g. Admin)
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  status?: ChecklistStatus;
  comment?: string;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  iconName: string; // key for lucide icons
  items: ChecklistItem[];
}

export interface PhotoEvidence {
  id: string;
  label: string;
  dataUrl: string | null; // base64
  required: boolean;
}

export interface Signature {
  role: 'Driver' | 'Supervisor';
  name: string;
  dataUrl: string;
  timestamp: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ChecklistRecord {
  id: string;
  recordType: RecordType; // Added type
  vehiclePlate: string;
  vehicleModel: string;
  vehicleCode?: string;
  driverName: string;
  unit: string;
  sector: string;
  odometer: number;
  date: string;
  status: VehicleStatus;
  location?: GeoLocation;
  items: Record<string, ChecklistStatus>; // map item_id -> status
  photos: PhotoEvidence[];
  observations: string;
  signatures: Signature[];
  synced: boolean;
}

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'OIL_CHANGE';

export interface MaintenanceRecord {
  id: string; // Service Order (O.S.) ID
  vehiclePlate: string;
  date: string;
  type: MaintenanceType;
  description: string;
  provider: string; // Mechanic or Shop name
  odometer: number;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  status: 'OPEN' | 'COMPLETED';
  observations?: string;
  osFileUrl?: string | null; // URL/Base64 of the Service Order file
  invoiceFileUrl?: string | null; // URL/Base64 of the Invoice (NF) file
  
  // Specific for Oil Change but available for all
  filters?: {
    oil: boolean;
    air: boolean;
    fuel: boolean;
    cabin: boolean;
  };
  
  replacedItems?: string; // Text field for other items replaced
  
  nextMaintenanceDate?: string; // Date string YYYY-MM-DD
  nextMaintenanceKm?: number; // Added for mileage based alert
}

export interface DashboardStats {
  totalInspections: number;
  vehiclesActive: number;
  vehiclesRepair: number;
  lastInspectionDate: string;
  maintenanceCost: number; // Added field
}

// New Types for Settings
export type SystemSettingType = 'UNITS' | 'SECTORS' | 'SUPPLIERS' | 'JOB_TITLES';

export interface SystemSettingItem {
  id: string;
  name: string;
  type: SystemSettingType;
}

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    checklists: ChecklistRecord[];
    vehicles: Vehicle[];
    collaborators: Collaborator[];
    accessGroups: AccessGroup[];
    maintenance: MaintenanceRecord[];
    systemSettings: SystemSettingItem[];
  };
}