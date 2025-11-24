
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Check, X, ChevronRight, ChevronLeft, Camera, Upload, 
  MapPin, User, Car, AlertTriangle, Save, Loader2, Search, QrCode 
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { CHECKLIST_SCHEMA, REQUIRED_PHOTOS } from '../constants';
import { ChecklistRecord, ChecklistStatus, VehicleStatus, PhotoEvidence, ChecklistItem, GeoLocation, Vehicle } from '../types';
import { saveChecklist, getVehicleByPlate, getVehicles, getVehicleByCode } from '../services/storageService';
import { extractPlateFromImage } from '../services/geminiService';
import { Logo } from './Logo';

interface ChecklistFormProps {
  onCancel: () => void;
  onComplete: () => void;
}

const steps = ['Identificação', 'Inspeção Técnica', 'Fotos', 'Finalização'];

const ChecklistForm: React.FC<ChecklistFormProps> = ({ onCancel, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyzingPlate, setAnalyzingPlate] = useState(false);
  const [registeredVehicles, setRegisteredVehicles] = useState<Vehicle[]>([]);
  
  // QR Scanner State
  const [showQrScanner, setShowQrScanner] = useState(false);
  const scannerRef = useRef<any>(null); // html5-qrcode instance

  // Form State
  const [formData, setFormData] = useState<Partial<ChecklistRecord>>({
    id: crypto.randomUUID(),
    recordType: 'CHECKLIST',
    date: new Date().toISOString(),
    items: {},
    photos: JSON.parse(JSON.stringify(REQUIRED_PHOTOS)),
    status: VehicleStatus.AVAILABLE,
    observations: '',
    synced: true,
    unit: '',
    sector: ''
  });
  
  // Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            }
          }));
        },
        (err) => console.error("Geo error", err)
      );
    }
    // Load vehicles for autocomplete
    setRegisteredVehicles(getVehicles());
  }, []);

  // Handle QR Scanner Lifecycle
  useEffect(() => {
    if (showQrScanner) {
      // Small delay to ensure DOM element exists
      const timer = setTimeout(() => {
        // Access global Html5QrcodeScanner
        const html5QrCode = new (window as any).Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText: string) => {
             // Success callback
             handleQrSuccess(decodedText);
          },
          (errorMessage: any) => {
             // ignore errors
          }
        ).catch((err: any) => {
          console.error("Error starting QR scanner", err);
          alert("Erro ao iniciar câmera. Verifique permissões.");
          setShowQrScanner(false);
        });

      }, 100);

      return () => clearTimeout(timer);
    } else {
       if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
             scannerRef.current.clear();
             scannerRef.current = null;
          }).catch((err: any) => console.error("Failed to stop scanner", err));
       }
    }
  }, [showQrScanner]);

  const handleQrSuccess = (decodedText: string) => {
      console.log("QR Code Scanned:", decodedText);
      // Attempt to find vehicle by code
      const vehicle = getVehicleByCode(decodedText);
      
      if (vehicle) {
          setFormData(prev => ({
              ...prev,
              vehicleCode: decodedText,
              vehiclePlate: vehicle.plate,
              vehicleModel: vehicle.model,
              unit: vehicle.unit || prev.unit,
              sector: vehicle.sector || prev.sector,
          }));
          alert(`Veículo encontrado: ${vehicle.model} (${vehicle.plate})`);
          setShowQrScanner(false);
      } else {
          // If not found, just fill the code field so user can register manually if needed
          setFormData(prev => ({ ...prev, vehicleCode: decodedText }));
          alert(`Código ${decodedText} lido, mas veículo não encontrado na base.`);
          setShowQrScanner(false);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill logic when plate changes
    if (name === 'vehiclePlate') {
        const found = getVehicleByPlate(value);
        if (found) {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                vehicleModel: found.model,
                vehicleCode: found.code || '',
                unit: found.unit || prev.unit,
                sector: found.sector || prev.sector,
                status: found.status // Optional: inherit status or keep default
            }));
        }
    }
  };

  // Helper for item status toggle
  const handleItemStatus = (itemId: string, ChecklistStatus: any) => {
    setFormData(prev => ({
      ...prev,
      items: { ...prev.items, [itemId]: ChecklistStatus }
    }));
  };

  // Photo Handling
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoId: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Update photos array
        setFormData(prev => ({
          ...prev,
          photos: prev.photos?.map(p => p.id === photoId ? { ...p, dataUrl: base64 } : p)
        }));

        // OCR Feature Trigger (If it's the front photo or we have a specific button)
        if (photoId === 'photo_front' && !formData.vehiclePlate) {
          setAnalyzingPlate(true);
          const plate = await extractPlateFromImage(base64);
          if (plate) {
             const found = getVehicleByPlate(plate);
             setFormData(prev => ({ 
                 ...prev, 
                 vehiclePlate: plate,
                 // Autofill if found via OCR
                 vehicleModel: found?.model || prev.vehicleModel,
                 vehicleCode: found?.code || prev.vehicleCode,
                 unit: found?.unit || prev.unit,
                 sector: found?.sector || prev.sector,
             }));
          }
          setAnalyzingPlate(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    if (!formData.vehiclePlate || !formData.driverName) {
        alert("Preencha a identificação.");
        return;
    }
    
    setLoading(true);
    // Simulate save delay
    setTimeout(() => {
        saveChecklist(formData as ChecklistRecord);
        setLoading(false);
        onComplete();
    }, 1000);
  };

  // --- Step Components ---

  const renderStep1_Identification = () => (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Car className="text-blue-600" /> Identificação do Veículo
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Placa</label>
          <div className="flex gap-2 relative">
            <input 
              name="vehiclePlate"
              list="registered-plates"
              value={formData.vehiclePlate || ''}
              onChange={handleInputChange}
              type="text" 
              className="mt-1 block w-full border border-slate-300 rounded-md p-2 uppercase focus:ring-blue-500 focus:border-blue-500 bg-white text-black pl-10" 
              placeholder="Buscar placa..."
            />
            <Search className="absolute left-3 top-1/2 -translate-y-[calc(50%-2px)] text-slate-400" size={18} />
             {analyzingPlate && <Loader2 className="animate-spin text-blue-600 self-center" />}
             
             <datalist id="registered-plates">
                {registeredVehicles.map(v => (
                    <option key={v.id} value={v.plate}>{v.model} - {v.unit}</option>
                ))}
             </datalist>
          </div>
          <p className="text-xs text-slate-500 mt-1">Digite a placa ou carregue a foto frontal na etapa 3.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Modelo / Marca / Ano</label>
          <input 
            name="vehicleModel"
            value={formData.vehicleModel || ''}
            onChange={handleInputChange}
            type="text" 
            className="mt-1 block w-full border border-slate-300 rounded-md p-2 bg-slate-100 text-black" 
            placeholder="Preenchimento automático"
            readOnly={!!getVehicleByPlate(formData.vehiclePlate || '')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Hodômetro (Km)</label>
          <input 
            name="odometer"
            value={formData.odometer || ''}
            onChange={handleInputChange}
            type="number" 
            className="mt-1 block w-full border border-slate-300 rounded-md p-2 bg-white text-black" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Código Patrimônio</label>
          <div className="relative">
             <input 
                name="vehicleCode"
                value={formData.vehicleCode || ''}
                onChange={handleInputChange}
                type="text" 
                className="mt-1 block w-full border border-slate-300 rounded-md p-2 bg-white text-black pr-10" 
             />
             <button 
                onClick={() => setShowQrScanner(true)}
                className="absolute right-2 top-1/2 -translate-y-[calc(50%-2px)] text-slate-500 hover:text-blue-600 transition"
                title="Ler QR Code"
             >
                <QrCode size={20} />
             </button>
          </div>
        </div>
        <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                <User size={18} /> Condutor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Nome do Motorista</label>
                    <input 
                        name="driverName"
                        value={formData.driverName || ''}
                        onChange={handleInputChange}
                        type="text" 
                        className="mt-1 block w-full border border-slate-300 rounded-md p-2 bg-white text-black" 
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Unidade</label>
                    <input 
                        name="unit"
                        value={formData.unit || ''}
                        onChange={handleInputChange}
                        type="text" 
                        className="mt-1 block w-full border border-slate-300 rounded-md p-2 bg-white text-black" 
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Setor</label>
                    <input 
                        name="sector"
                        value={formData.sector || ''}
                        onChange={handleInputChange}
                        type="text" 
                        className="mt-1 block w-full border border-slate-300 rounded-md p-2 bg-white text-black" 
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderStep2_Checklist = () => (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-xl font-bold text-slate-800">Inspeção Técnica</h2>
      <p className="text-sm text-slate-500 mb-4">Marque o estado de cada item.</p>

      {CHECKLIST_SCHEMA.map((category) => {
        // Dynamic Icon lookup
        const IconComponent = (Icons as any)[category.iconName] || Icons.Circle;
        
        return (
          <div key={category.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <IconComponent className="text-blue-600" size={20} />
              <h3 className="font-semibold text-slate-800">{category.title}</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {category.items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <div className="flex gap-2 self-start md:self-auto">
                    <button
                      onClick={() => handleItemStatus(item.id, ChecklistStatus.OK)}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                        formData.items?.[item.id] === ChecklistStatus.OK 
                          ? 'bg-green-50 border-green-500 text-white' 
                          : 'bg-white border-slate-200 text-slate-300 hover:border-green-400 hover:text-green-400'
                      }`}
                      title="Conforme"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => handleItemStatus(item.id, ChecklistStatus.NOK)}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                        formData.items?.[item.id] === ChecklistStatus.NOK 
                          ? 'bg-red-50 border-red-500 text-white' 
                          : 'bg-white border-slate-200 text-slate-300 hover:border-red-400 hover:text-red-400'
                      }`}
                      title="Não Conforme"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => handleItemStatus(item.id, ChecklistStatus.NA)}
                      className={`p-2 w-[44px] flex items-center justify-center rounded-lg border-2 transition-all duration-200 ${
                        formData.items?.[item.id] === ChecklistStatus.NA 
                          ? 'bg-red-50 border-red-500 text-white' 
                          : 'bg-white border-slate-200 text-slate-300 hover:border-red-400 hover:text-red-400'
                      }`}
                      title="Não se Aplica"
                    >
                      <span className="font-black text-xs">N/A</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStep3_Photos = () => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Camera className="text-blue-600" /> Registro Fotográfico
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.photos?.map((photo) => (
                <div key={photo.id} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
                    <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm text-slate-700">{photo.label} {photo.required && <span className="text-red-500">*</span>}</span>
                    </div>
                    <label className="cursor-pointer block relative aspect-video bg-slate-100 rounded-md overflow-hidden border-2 border-dashed border-slate-300 hover:border-blue-400 transition group">
                        {photo.dataUrl ? (
                            <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <Upload size={24} className="mb-2 group-hover:text-blue-500" />
                                <span className="text-xs">Clique para adicionar</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(e, photo.id)}
                        />
                    </label>
                </div>
            ))}
        </div>
    </div>
  );

  const renderStep4_Finish = () => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Save className="text-blue-600" /> Finalização
        </h2>

        {/* Status Selection */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">Status Final do Veículo</label>
            <div className="flex flex-col sm:flex-row gap-3">
                {[VehicleStatus.AVAILABLE, VehicleStatus.RESTRICTED, VehicleStatus.UNAVAILABLE].map(status => (
                    <button
                        key={status}
                        onClick={() => setFormData(prev => ({...prev, status}))}
                        className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition flex items-center justify-center gap-2
                            ${formData.status === status 
                                ? status === VehicleStatus.AVAILABLE ? 'bg-green-50 border-green-500 text-green-700'
                                : status === VehicleStatus.RESTRICTED ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                                : 'bg-red-50 border-red-500 text-red-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                        `}
                    >
                        {status === VehicleStatus.AVAILABLE && <Check size={16} />}
                        {status === VehicleStatus.RESTRICTED && <AlertTriangle size={16} />}
                        {status === VehicleStatus.UNAVAILABLE && <Icons.Ban size={16} />}
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* Observations */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
             <label className="block text-sm font-medium text-slate-700 mb-2">Observações Gerais / Avarias</label>
             <textarea 
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-md p-3 h-32 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                placeholder="Descreva detalhes adicionais, incidentes ou observações sobre a manutenção..."
             />
        </div>

        {/* Signature Placeholder */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
             <label className="block text-sm font-medium text-slate-700 mb-2">Assinatura Digital</label>
             <div className="h-32 bg-slate-50 border border-dashed border-slate-300 rounded-md flex items-center justify-center text-slate-400">
                <span className="text-sm italic">(Espaço para componente Canvas de Assinatura)</span>
             </div>
             <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <MapPin size={12} />
                Localização capturada: {formData.location ? `${formData.location.latitude.toFixed(5)}, ${formData.location.longitude.toFixed(5)}` : 'Aguardando GPS...'}
             </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto bg-slate-50 min-h-screen flex flex-col relative">
      {/* QR Scanner Modal/Overlay */}
      {showQrScanner && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
             <div className="bg-white rounded-xl overflow-hidden w-full max-w-sm relative">
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><QrCode size={20}/> Escanear Código</h3>
                    <button onClick={() => setShowQrScanner(false)}><X size={24} /></button>
                </div>
                <div id="reader" className="w-full bg-black min-h-[300px]"></div>
                <div className="p-4 text-center text-sm text-slate-600">
                    Aponte a câmera para o QR Code do Patrimônio
                </div>
             </div>
        </div>
      )}

      {/* Stepper Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
                <button onClick={onCancel} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-2" onClick={onCancel} role="button" title="Voltar ao Painel">
                   <Logo className="h-12 w-auto shrink-0 cursor-pointer" />
                   <div className="h-4 w-px bg-slate-300 mx-1"></div>
                   <h1 className="font-bold text-lg text-slate-800 leading-none cursor-pointer">Checklist</h1>
                </div>
            </div>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {currentStep + 1} / {steps.length}
            </span>
        </div>
        <div className="h-1 bg-slate-100">
            <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out" 
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-8">
        {currentStep === 0 && renderStep1_Identification()}
        {currentStep === 1 && renderStep2_Checklist()}
        {currentStep === 2 && renderStep3_Photos()}
        {currentStep === 3 && renderStep4_Finish()}
      </div>

      {/* Footer Controls */}
      <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-10 flex justify-between items-center">
        <button 
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
            <ChevronLeft size={18} /> Anterior
        </button>

        {currentStep < steps.length - 1 ? (
             <button 
                onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                className="flex items-center gap-1 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
            >
                Próximo <ChevronRight size={18} />
            </button>
        ) : (
            <button 
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-md transition disabled:opacity-70"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Finalizar Checklist
            </button>
        )}
      </div>
    </div>
  );
};

export default ChecklistForm;
