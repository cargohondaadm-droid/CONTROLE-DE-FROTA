
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Car, Settings as SettingsIcon, LogOut, Menu, X, Users, Wrench, ChevronDown, ChevronRight, PlusCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ChecklistForm from './components/ChecklistForm';
import VehicleManager from './components/VehicleManager';
import CollaboratorManager from './components/CollaboratorManager';
import GroupManager from './components/GroupManager';
import MaintenanceManager from './components/MaintenanceManager';
import History from './components/History';
import Settings from './components/Settings';
import { Logo } from './components/Logo';

// Simple Navigation Component
const Sidebar = ({ mobileOpen, setMobileOpen, onNewChecklist }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void, onNewChecklist: () => void }) => {
    const location = useLocation();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    
    const menuItems = [
        { icon: LayoutDashboard, label: 'Painel', path: '/' },
        { icon: ClipboardList, label: 'Histórico', path: '/historico' },
        { icon: Car, label: 'Veículos', path: '/veiculos' },
        { 
            icon: Users, 
            label: 'Equipe', 
            subItems: [
                { label: 'Colaboradores', path: '/colaboradores' },
                { label: 'Grupos de Acesso', path: '/grupos' }
            ]
        },
        { icon: Wrench, label: 'Manutenção', path: '/manutencao' },
    ];

    const toggleMenu = (label: string) => {
        setExpandedMenu(prev => prev === label ? null : label);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`
                fixed top-0 left-0 z-30 h-full w-64 bg-slate-900 text-slate-100 transform transition-transform duration-300 ease-in-out border-r border-slate-800
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col shadow-xl
            `}>
                <div className="h-28 flex items-center justify-center px-4 border-b border-slate-800 bg-white flex-none">
                    <Link to="/" onClick={() => setMobileOpen(false)} title="Ir para o Painel" className="text-slate-900">
                        <Logo className="h-16 w-auto max-w-full hover:opacity-90 transition-opacity" />
                    </Link>
                </div>

                <div className="p-4 pb-0">
                    <button 
                        onClick={() => {
                            onNewChecklist();
                            setMobileOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-900/50 transform active:scale-95"
                    >
                        <PlusCircle size={20} />
                        <span>Novo Checklist</span>
                    </button>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        if (item.subItems) {
                             const isExpanded = expandedMenu === item.label;
                             const isActiveParent = item.subItems.some(sub => sub.path === location.pathname && sub.path !== '#');
                             
                             return (
                                <div key={item.label}>
                                    <button 
                                        onClick={() => toggleMenu(item.label)}
                                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${isActiveParent ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={20} />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                    
                                    {isExpanded && (
                                        <div className="mt-1 space-y-1 pl-10 border-l-2 border-slate-700 ml-5">
                                            {item.subItems.map(sub => (
                                                <Link 
                                                    key={sub.label}
                                                    to={sub.path}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={`block py-2 text-sm transition-colors ${location.pathname === sub.path && sub.path !== '#' ? 'text-blue-400 font-bold' : 'text-slate-500 hover:text-white'}`}
                                                >
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                             );
                        }

                        const active = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.label}
                                to={item.path!}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-white text-slate-900 shadow-md font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2 flex-none bg-slate-900">
                    <Link 
                        to="/configuracoes"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/configuracoes' ? 'bg-white text-slate-900 shadow-md font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <SettingsIcon size={20} />
                        <span className="font-medium">Configurações</span>
                    </Link>

                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors text-left">
                        <LogOut size={20} />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

const App: React.FC = () => {
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If in Checklist mode, render the full screen wizard
  if (isChecklistMode) {
    return (
        <ChecklistForm 
            onCancel={() => setIsChecklistMode(false)}
            onComplete={() => setIsChecklistMode(false)}
        />
    );
  }

  return (
    <HashRouter>
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar 
                mobileOpen={mobileMenuOpen} 
                setMobileOpen={setMobileMenuOpen} 
                onNewChecklist={() => setIsChecklistMode(true)}
            />
            
            <main className="flex-1 overflow-y-auto h-screen">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between sticky top-0 z-10 text-slate-800">
                    <div className="flex items-center gap-2">
                         <Link to="/">
                            <Logo className="h-10 w-auto shrink-0" />
                         </Link>
                    </div>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600">
                        <Menu size={24} />
                    </button>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard onNewChecklist={() => setIsChecklistMode(true)} />} />
                        <Route path="/historico" element={<History />} />
                        <Route path="/veiculos" element={<VehicleManager />} />
                        <Route path="/colaboradores" element={<CollaboratorManager />} />
                        <Route path="/grupos" element={<GroupManager />} />
                        <Route path="/manutencao" element={<MaintenanceManager />} />
                        <Route path="/configuracoes" element={<Settings />} />
                    </Routes>
                </div>
            </main>
        </div>
    </HashRouter>
  );
};

export default App;
