import { ChecklistCategory, PhotoEvidence } from './types';

export const COMPANY_LOGO = "./logo.png";

export const CHECKLIST_SCHEMA: ChecklistCategory[] = [
  {
    id: 'mechanics',
    title: 'Mecânica',
    iconName: 'Wrench',
    items: [
      { id: 'mec_oil', label: 'Nível de óleo do motor', category: 'mechanics' },
      { id: 'mec_water', label: 'Nível da água / Arrefecimento', category: 'mechanics' },
      { id: 'mec_brake_fluid', label: 'Fluido de freio', category: 'mechanics' },
      { id: 'mec_steering', label: 'Fluido da direção hidráulica', category: 'mechanics' },
      { id: 'mec_leaks', label: 'Vazamentos visíveis', category: 'mechanics' },
      { id: 'mec_noise', label: 'Ruídos anormais', category: 'mechanics' },
      { id: 'mec_belts', label: 'Correias e mangueiras', category: 'mechanics' },
    ]
  },
  {
    id: 'tires',
    title: 'Pneus',
    iconName: 'CircleDashed',
    items: [
      { id: 'tire_pressure', label: 'Calibração', category: 'tires' },
      { id: 'tire_state', label: 'Estado geral (desgaste/bolhas)', category: 'tires' },
      { id: 'tire_step', label: 'Step em condições', category: 'tires' },
      { id: 'tire_tools', label: 'Chave de roda e macaco', category: 'tires' },
    ]
  },
  {
    id: 'electric',
    title: 'Elétrica',
    iconName: 'Zap',
    items: [
      { id: 'elec_highbeam', label: 'Farol alto e baixo', category: 'electric' },
      { id: 'elec_tail', label: 'Lanternas e Setas', category: 'electric' },
      { id: 'elec_brake_light', label: 'Luz de freio e ré', category: 'electric' },
      { id: 'elec_panel', label: 'Painel e indicadores', category: 'electric' },
      { id: 'elec_horn', label: 'Buzina', category: 'electric' },
    ]
  },
  {
    id: 'safety',
    title: 'Segurança',
    iconName: 'ShieldAlert',
    items: [
      { id: 'safe_seatbelt', label: 'Cinto de segurança', category: 'safety' },
      { id: 'safe_extinguisher', label: 'Extintor (validade)', category: 'safety' },
      { id: 'safe_triangle', label: 'Triângulo', category: 'safety' },
      { id: 'safe_firstaid', label: 'Kit primeiros socorros', category: 'safety' },
    ]
  },
  {
    id: 'body',
    title: 'Lataria',
    iconName: 'Car',
    items: [
      { id: 'body_trunk', label: 'Porta-malas', category: 'body' },
      { id: 'body_glass', label: 'Vidros (trincas)', category: 'body' },
      { id: 'body_bumpers', label: 'Para-choques', category: 'body' },
      { id: 'body_doors', label: 'Portas e fechaduras', category: 'body' },
    ]
  },
  {
    id: 'interior',
    title: 'Interior',
    iconName: 'Armchair',
    items: [
      { id: 'int_seats', label: 'Bancos', category: 'interior' },
      { id: 'int_ac', label: 'Ar-condicionado', category: 'interior' },
      { id: 'int_smell', label: 'Odores / Limpeza', category: 'interior' },
    ]
  }
];

export const REQUIRED_PHOTOS: PhotoEvidence[] = [
  { id: 'photo_front', label: 'Frente do Veículo', dataUrl: null, required: true },
  { id: 'photo_back', label: 'Traseira do Veículo', dataUrl: null, required: true },
  { id: 'photo_side_left', label: 'Lateral Esquerda', dataUrl: null, required: true },
  { id: 'photo_side_right', label: 'Lateral Direita', dataUrl: null, required: true },
  { id: 'photo_odometer', label: 'Hodômetro', dataUrl: null, required: true },
  { id: 'photo_damage', label: 'Avarias (se houver)', dataUrl: null, required: false },
];