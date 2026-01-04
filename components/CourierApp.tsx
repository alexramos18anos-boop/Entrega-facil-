
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Courier, Order } from '../types';
import { ALERT_SOUND_URL } from '../constants';
import { optimizeRouteAI } from '../services/geminiService';

interface CourierAppProps {
  courier: Courier;
  activeOrders: Order[];
  onAcceptOrder: (orderId: string) => void;
  onCompleteDelivery: (orderId: string) => void;
  onRequestAdvance: (value: number) => void;
  activeTab: string;
}

const CourierApp: React.FC<CourierAppProps> = ({ courier, activeOrders, onAcceptOrder, onCompleteDelivery, onRequestAdvance, activeTab }) => {
  const [isOnline, setIsOnline] = useState(courier.status !== 'OFFLINE');
  const [routeOptimization, setRouteOptimization] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [advanceValue, setAdvanceValue] = useState<string>('');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pendingOrders = activeOrders.filter(o => o.status === 'PENDING' || o.status === 'ACCEPTED');
  const inRouteOrders = activeOrders.filter(o => o.status === 'IN_ROUTE');

  const sortedInRoute = useMemo(() => {
    if (routeOptimization && routeOptimization.orderedIds) {
      return [...inRouteOrders].sort((a, b) => {
        const indexA = routeOptimization.orderedIds.indexOf(a.id);
        const indexB = routeOptimization.orderedIds.indexOf(b.id);
        return indexA - indexB;
      });
    }
    return inRouteOrders;
  }, [inRouteOrders, routeOptimization]);

  useEffect(() => {
    if (pendingOrders.length > 0 && isOnline) {
      if (!audioRef.current) {
        audioRef.current = new Audio(ALERT_SOUND_URL);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 400]);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [pendingOrders.length, isOnline]);

  useEffect(() => {
    const fetchOptimization = async () => {
      if (inRouteOrders.length > 1) {
        setIsOptimizing(true);
        try {
          const res = await optimizeRouteAI(courier.location, inRouteOrders);
          setRouteOptimization(res);
        } catch (e) {
          console.error("Optimization failed", e);
        } finally {
          setIsOptimizing(false);
        }
      } else if (inRouteOrders.length === 1) {
        setRouteOptimization({
          orderedIds: [inRouteOrders[0].id],
          totalKm: inRouteOrders[0].aiDistance || "Calculando...",
          totalTimeMinutes: 15,
          aiAdvice: "Rota direta ao cliente."
        });
      } else {
        setRouteOptimization(null);
      }
    };
    fetchOptimization();
  }, [inRouteOrders.length, courier.location]);

  const openWaze = (lat: number, lng: number) => {
    if (navigator.vibrate) navigator.vibrate(20);
    window.open(`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  const handleAcceptAndNavigate = (order: Order) => {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    onAcceptOrder(order.id);
    setTimeout(() => openWaze(order.location.lat, order.location.lng), 500);
  };

  const handleCompleteWithHaptics = (orderId: string) => {
    if (navigator.vibrate) navigator.vibrate(100);
    onCompleteDelivery(orderId);
  };

  const handleSubmitAdvance = () => {
    const val = parseFloat(advanceValue);
    if (!isNaN(val) && val > 0 && val <= courier.walletBalance) {
      if (navigator.vibrate) navigator.vibrate(30);
      onRequestAdvance(val);
      setShowAdvanceModal(false);
      setAdvanceValue('');
    } else {
      alert("Valor inválido ou acima do saldo disponível.");
    }
  };

  if (pendingOrders.length > 0 && isOnline) {
    const currentOrder = pendingOrders[0];
    return (
      <div className="fixed inset-0 z-[200] bg-[#ea1d2c] flex flex-col items-center justify-center p-10 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/10 to-transparent animate-pulse"></div>
        <div className="relative z-10 text-center space-y-10 w-full">
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <i className="fa-solid fa-motorcycle text-[#ea1d2c] text-5xl"></i>
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter">NOVO PEDIDO</h2>
            <p className="text-white/80 font-black uppercase text-[12px] tracking-[0.3em]">Coleta Imediata</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white font-black text-3xl">#{currentOrder.orderNumber}</p>
              <span className="bg-white text-[#ea1d2c] px-3 py-1 rounded-lg text-[10px] font-black uppercase">FOGUETE</span>
            </div>
            <div className="text-left border-t border-white/10 pt-4">
              <p className="text-white/90 font-black text-lg uppercase leading-none">{currentOrder.clientName}</p>
              <p className="text-white/60 text-xs mt-2 line-clamp-2">{currentOrder.address}</p>
            </div>
          </div>
          <button 
            onClick={() => handleAcceptAndNavigate(currentOrder)}
            className="w-full bg-white text-[#ea1d2c] font-black py-7 rounded-[32px] text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 transition-all uppercase tracking-tighter"
          >
            Aceitar e Pilotar
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === 'PROFILE') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    return (
      <div className="space-y-6 pb-32 animate-in fade-in duration-500">
        <div className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/30 rounded-full blur-3xl"></div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Carteira Digital</p>
          <h3 className="text-5xl font-black relative z-10 tracking-tighter">R$ {courier.walletBalance.toFixed(2)}</h3>
          
          {courier.pendingAdvanceValue ? (
            <div className="mt-8 bg-orange-500/10 border border-orange-500/30 p-5 rounded-[28px] flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-clock text-orange-500 animate-spin-slow"></i>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Saque Solicitado</p>
                <p className="text-sm font-bold text-white/90">Aguardando Aprovação Admin</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => { if(navigator.vibrate) navigator.vibrate(5); setShowAdvanceModal(true); }}
              className="w-full mt-8 bg-[#ea1d2c] text-white py-5 rounded-[28px] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 active:scale-95 transition-all"
            >
              Antecipar Ganhos
            </button>
          )}
        </div>

        {/* GUIA DE INSTALAÇÃO MOBILE */}
        <div className="bg-white p-8 rounded-[40px] border-2 border-[#ea1d2c]/10 shadow-sm space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ea1d2c] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-mobile-button text-xl"></i>
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase">App na Tela Inicial</p>
              <p className="text-[9px] font-black text-[#ea1d2c] uppercase tracking-widest">Instale agora mesmo</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-[28px] space-y-4">
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">Tenha o aplicativo na sua tela de apps sem ocupar memória:</p>
            {isIOS ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-800 uppercase">
                  <span className="w-6 h-6 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#ea1d2c]">1</span>
                  <span>Toque no botão <i className="fa-solid fa-share-from-square text-[#ea1d2c] mx-1"></i> do Safari</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-800 uppercase">
                  <span className="w-6 h-6 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#ea1d2c]">2</span>
                  <span>"Adicionar à Tela de Início"</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-800 uppercase">
                  <span className="w-6 h-6 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#ea1d2c]">1</span>
                  <span>Toque nos <i className="fa-solid fa-ellipsis-vertical mx-1"></i> 3 pontos do Chrome</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-800 uppercase">
                  <span className="w-6 h-6 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#ea1d2c]">2</span>
                  <span>Toque em "Instalar Aplicativo"</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Entregas</p>
              <p className="text-2xl font-black text-slate-800">24</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Avaliação</p>
              <div className="flex items-center justify-center gap-1 text-orange-500">
                <i className="fa-solid fa-star text-xs"></i>
                <p className="text-2xl font-black text-slate-800">4.9</p>
              </div>
           </div>
        </div>

        {showAdvanceModal && (
          <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-md flex items-end justify-center">
            <div className="bg-white w-full rounded-t-[48px] p-10 pb-[calc(env(safe-area-inset-bottom)+40px)] animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 text-2xl tracking-tighter uppercase">Valor do Saque</h3>
                <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              
              <div className="relative mb-8">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">R$</span>
                <input 
                  type="number"
                  placeholder="0,00"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] pl-20 pr-8 py-7 outline-none focus:border-[#ea1d2c] transition-all font-black text-4xl text-slate-800"
                  value={advanceValue}
                  onChange={(e) => setAdvanceValue(e.target.value)}
                  autoFocus
                />
              </div>

              <button 
                onClick={handleSubmitAdvance}
                className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-2xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em]"
              >
                Confirmar Saque IA
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      {/* Switch Online/Offline Mobile Friendly */}
      <div className={`rounded-[40px] p-8 shadow-sm flex justify-between items-center border-2 transition-all ${isOnline ? 'bg-white border-emerald-50' : 'bg-slate-100 border-slate-200 opacity-80'}`}>
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner transition-all ${isOnline ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-white text-slate-300'}`}>
            <i className={`fa-solid ${isOnline ? 'fa-motorcycle' : 'fa-moon'} text-2xl`}></i>
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-none">{isOnline ? 'Online' : 'Offline'}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sinal GPS Forte</p>
          </div>
        </div>
        <button 
          onClick={() => { if(navigator.vibrate) navigator.vibrate(10); setIsOnline(!isOnline); }} 
          className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all shadow-inner ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-xl transition-all ${isOnline ? 'translate-x-11' : 'translate-x-1'}`} />
        </button>
      </div>

      {routeOptimization && sortedInRoute.length > 0 && (
        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] mb-1">Rota Otimizada IA</p>
              <h3 className="text-2xl font-black tracking-tighter">{routeOptimization.totalKm} • {routeOptimization.totalTimeMinutes} min</h3>
            </div>
            {isOptimizing ? (
              <div className="animate-spin text-[#ea1d2c] text-2xl"><i className="fa-solid fa-circle-notch"></i></div>
            ) : (
              <div className="bg-red-500/20 text-red-500 p-3 rounded-2xl border border-red-500/30">
                <i className="fa-solid fa-bolt-lightning text-lg"></i>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-4 italic leading-relaxed">"{routeOptimization.aiAdvice}"</p>
        </div>
      )}

      {sortedInRoute.length > 0 ? (
        <div className="space-y-6">
          {sortedInRoute.map((order, index) => (
            <div key={order.id} className={`bg-white border rounded-[48px] shadow-sm overflow-hidden border-slate-100 transition-all ${index === 0 ? 'ring-4 ring-[#ea1d2c]/10 scale-[1.03]' : 'opacity-60 grayscale'}`}>
              <div className={`p-5 flex justify-between items-center px-8 ${index === 0 ? 'bg-[#ea1d2c] text-white' : 'bg-slate-100 text-slate-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {index === 0 ? 'PRÓXIMO DESTINO' : 'NA FILA'}
                </span>
                <span className="text-[10px] font-black opacity-60">#{order.orderNumber}</span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{order.clientName}</h4>
                    <p className="text-[13px] text-slate-500 mt-2 font-medium leading-snug">{order.address}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase">{order.aiDistance}</span>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase">Ganho R$ {order.orderPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {index === 0 && (
                    <button 
                      onClick={() => openWaze(order.location.lat, order.location.lng)}
                      className="bg-blue-500 text-white w-20 h-20 rounded-[28px] shadow-[0_15px_30px_rgba(59,130,246,0.3)] flex items-center justify-center animate-bounce transition-transform active:scale-90"
                    >
                      <i className="fa-brands fa-waze text-3xl"></i>
                    </button>
                  )}
                </div>

                {index === 0 && (
                  <button 
                    onClick={() => handleCompleteWithHaptics(order.id)}
                    className="w-full bg-slate-900 text-white font-black py-6 rounded-[28px] text-[12px] shadow-2xl active:scale-95 transition-all uppercase tracking-[0.3em]"
                  >
                    Confirmar Entrega
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-6">
          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mx-auto border-4 border-dashed border-slate-200">
            <i className="fa-solid fa-satellite-dish text-slate-300 text-4xl animate-pulse"></i>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.3em]">Buscando Pedidos...</p>
            <p className="text-slate-300 text-[10px] font-medium">Aqueça os motores, você é o próximo!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierApp;
