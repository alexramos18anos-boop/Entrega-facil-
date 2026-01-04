
import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  setRole: (role: UserRole) => void;
  title: string;
  canSwitch: boolean;
  isImpersonating?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, role, setRole, title, canSwitch, isImpersonating, activeTab, onTabChange 
}) => {
  const navItems = role === 'ADMIN' 
    ? [
        { id: 'HOME', label: 'Mapa', icon: 'fa-map-location-dot' },
        { id: 'ORDERS', label: 'Pedidos', icon: 'fa-clipboard-list' },
        { id: 'STORES', label: 'Lojas', icon: 'fa-shop' },
        { id: 'STOCK', label: 'Estoque IA', icon: 'fa-boxes-stacked' },
        { id: 'PROFILE', label: 'Gestão', icon: 'fa-sliders' },
      ]
    : [
        { id: 'HOME', label: 'Entregas', icon: 'fa-motorcycle' },
        { id: 'PROFILE', label: 'Carteira', icon: 'fa-wallet' },
      ];

  React.useEffect(() => {
    const isValidTab = navItems.find(item => item.id === activeTab);
    if (!isValidTab) {
      onTabChange('HOME');
    }
  }, [role, activeTab, onTabChange, navItems]);

  return (
    <div className="flex flex-col h-[100svh] w-full max-w-2xl mx-auto bg-white relative overflow-hidden">
      {/* Header Mobile Otimizado */}
      <header className={`pt-[env(safe-area-inset-top)] pb-4 px-6 shadow-lg sticky top-0 z-50 flex justify-between items-center border-b transition-colors duration-500 ${isImpersonating && role === 'COURIER' ? 'bg-slate-900 border-slate-800' : 'bg-[#ea1d2c] border-red-500'}`}>
        <div className="flex items-center gap-3 pt-2">
          <div className={`${isImpersonating && role === 'COURIER' ? 'bg-orange-500/20' : 'bg-white/20'} p-2 rounded-xl`}>
            <i className={`fa-solid ${role === 'ADMIN' ? 'fa-tower-observation' : 'fa-user-ninja'} text-sm ${isImpersonating && role === 'COURIER' ? 'text-orange-500' : 'text-white'}`}></i>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-[11px] uppercase tracking-[0.1em] text-white leading-none">{title}</h1>
            {isImpersonating && role === 'COURIER' && (
              <span className="text-[8px] font-black uppercase text-orange-500 tracking-tighter mt-1">Modo Admin Ativo</span>
            )}
          </div>
        </div>
        
        {canSwitch && (
          <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              const nextRole = role === 'ADMIN' ? 'COURIER' : 'ADMIN';
              setRole(nextRole);
            }}
            className={`${isImpersonating && role === 'COURIER' ? 'bg-orange-500 text-white' : 'bg-white text-[#ea1d2c]'} px-4 py-2 rounded-2xl text-[10px] font-black transition-all active:scale-90 shadow-md uppercase border border-white/10 mt-2`}
          >
            {role === 'ADMIN' ? 'App Boy' : 'Admin'}
          </button>
        )}
      </header>

      {/* Área de Conteúdo principal com scroll suave e bounce desativado */}
      <main className="flex-1 overflow-y-auto bg-slate-50/80 overscroll-none">
        <div className="p-5 pb-32">
          {children}
        </div>
      </main>

      {/* Navegação Inferior Estilo App Nativo (iOS/Android) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-start pt-4 pb-[calc(env(safe-area-inset-bottom)+12px)] z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] rounded-t-[40px]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(5);
              onTabChange(item.id);
            }}
            className={`flex flex-col items-center gap-2 transition-all duration-300 relative px-4 ${
              activeTab === item.id ? 'text-[#ea1d2c]' : 'text-slate-300'
            }`}
          >
            {activeTab === item.id && (
              <div className="absolute -top-4 w-12 h-1 bg-[#ea1d2c] rounded-full animate-in fade-in zoom-in"></div>
            )}
            <i className={`fa-solid ${item.icon} ${activeTab === item.id ? 'text-2xl' : 'text-xl'}`}></i>
            <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
