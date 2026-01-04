
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MOCK_PRODUCTS, PAYMENT_NOTIFICATION_SOUND } from '../constants';
import { Order, Courier, Prediction, Location, Store } from '../types';
import { predictInventoryNeedsAI, processVoiceCommandAI } from '../services/geminiService';
import MapMonitor from './MapMonitor';

interface AdminDashboardProps {
  orders: Order[];
  couriers: Courier[];
  stores: Store[];
  onManualDispatch: (orderId: string, courierId: string) => void;
  onUpdatePayment: (courierId: string, type: 'PERCENTAGE' | 'FIXED', value: number) => void;
  onUpdateCourierName: (courierId: string, newName: string) => void;
  onDeleteCourier: (courierId: string) => void;
  onUpdateWallet?: (courierId: string, amount: number) => void;
  onApproveAdvance?: (courierId: string, approve: boolean) => void;
  onImpersonate?: (courierId: string) => void;
  onAddStore: (name: string, address: string) => void;
  onToggleStoreLink: (storeId: string) => void;
  activeTab: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, 
  couriers, 
  stores,
  onManualDispatch, 
  onUpdatePayment,
  onUpdateCourierName,
  onDeleteCourier,
  onUpdateWallet, 
  onApproveAdvance, 
  onImpersonate,
  onAddStore,
  onToggleStoreLink,
  activeTab 
}) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState<string | null>(null);
  const [editingCourierId, setEditingCourierId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<Location | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showAddStore, setShowAddStore] = useState(false);
  
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddr, setNewStoreAddr] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const couriersWithPendingAdvance = couriers.filter(c => c.pendingAdvanceValue);

  const zoneStats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
    const total = activeOrders.length || 1;
    const zones = stores.map(store => {
      const count = activeOrders.filter(o => o.storeId === store.id).length;
      const percentage = Math.round((count / total) * 100);
      return { name: store.name, percentage, count, id: store.id };
    }).sort((a, b) => b.percentage - a.percentage);
    return zones;
  }, [orders, stores]);

  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const revenue = todayOrders.reduce((acc, o) => acc + o.orderPrice, 0);
    const active = couriers.filter(c => c.status !== 'OFFLINE').length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    return { revenue, active, pending };
  }, [orders, couriers]);

  useEffect(() => {
    const fetchAI = async () => {
      setLoadingAI(true);
      try {
        const pred = await predictInventoryNeedsAI(MOCK_PRODUCTS);
        setPredictions(pred);
      } catch (e) { console.error(e); } finally { setLoadingAI(false); }
    };
    fetchAI();
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceFeedback(`IA: "${transcript}"...`);
        setIsListening(false);
        try {
          const pendingOrders = orders.filter(o => o.status === 'PENDING');
          const onlineCouriers = couriers.filter(c => c.status === 'ONLINE');
          const result = await processVoiceCommandAI(transcript, pendingOrders, onlineCouriers);
          if (result.success) {
            onManualDispatch(result.orderId, result.courierId);
            setVoiceFeedback("Despachado!");
          } else { setVoiceFeedback(result.message); }
        } catch (error) { setVoiceFeedback("Erro na IA"); }
        setTimeout(() => setVoiceFeedback(null), 3000);
      };
      recognitionRef.current.onerror = () => { setIsListening(false); setVoiceFeedback(null); };
    }
  }, [orders, couriers, onManualDispatch]);

  const handleAddStoreSubmit = () => {
    if (newStoreName && newStoreAddr) {
      onAddStore(newStoreName, newStoreAddr);
      setNewStoreName('');
      setNewStoreAddr('');
      setShowAddStore(false);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED');

  if (activeTab === 'STORES') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-24">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Lojas iFood Vinculadas</h2>
          <button 
            onClick={() => setShowAddStore(true)}
            className="bg-[#ea1d2c] text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            <span className="text-[10px] font-black uppercase">Vincular iFood</span>
          </button>
        </div>

        <div className="space-y-4">
          {stores.map(store => (
            <div key={store.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors ${store.isLinked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <i className="fa-solid fa-shop text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase leading-none">{store.name}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Merchant ID: {store.merchantId || '---'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${store.isLinked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{store.isLinked ? 'Integração Ativa' : 'Desconectado'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onToggleStoreLink(store.id)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${store.isLinked ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}
              >
                {store.isLinked ? 'Pausar' : 'Ativar'}
              </button>
            </div>
          ))}
        </div>

        {showAddStore && (
          <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-md flex items-end justify-center">
            <div className="bg-white w-full rounded-t-[48px] p-10 pb-[calc(env(safe-area-inset-bottom)+40px)] animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 text-2xl tracking-tighter uppercase">Nova Loja iFood</h3>
                <button onClick={() => setShowAddStore(false)} className="text-slate-400 bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <input 
                  type="text" placeholder="Nome do Restaurante" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-black"
                  value={newStoreName} onChange={e => setNewStoreName(e.target.value)}
                />
                <input 
                  type="text" placeholder="Endereço / Link Google Maps" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-black"
                  value={newStoreAddr} onChange={e => setNewStoreAddr(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAddStoreSubmit}
                className="w-full bg-[#ea1d2c] text-white font-black py-6 rounded-[32px] shadow-2xl active:scale-95 transition-all uppercase text-[12px] tracking-[0.2em]"
              >
                Autorizar no iFood
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'STOCK') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Inventário iFood IA</h2>
          <div className="bg-purple-100 text-purple-700 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Predição Ativa</div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {predictions.map(pred => {
            const p = MOCK_PRODUCTS.find(prod => prod.id === pred.productId);
            const critical = pred.estimatedDaysRemaining <= 3;
            return (
              <div key={pred.productId} className={`bg-white p-6 rounded-[32px] border-2 shadow-sm space-y-4 ${critical ? 'border-red-100 bg-red-50/10' : 'border-slate-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-800 text-sm block">{p?.name}</span>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${critical ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {pred.estimatedDaysRemaining} dias
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${critical ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (p!.stock/p!.minThreshold)*100)}%` }}></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-500 italic font-medium">"{pred.reasoning}"</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'PROFILE') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-24">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gestão Operacional</h2>
        </div>
        
        {/* GUIA DE INSTALAÇÃO MOBILE */}
        <div className="bg-white p-6 rounded-[32px] border-2 border-[#ea1d2c]/10 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ea1d2c] rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Instalar Aplicativo</p>
              <p className="text-[9px] font-black text-[#ea1d2c] uppercase tracking-widest">Acesso Direto na Tela</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
            <p className="text-[11px] text-slate-600 font-medium">Para instalar o **Entrega Fácil** no seu celular:</p>
            {isIOS ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700">
                  <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">1</span>
                  <span>Toque no ícone de <i className="fa-solid fa-share-from-square text-[#ea1d2c]"></i> Compartilhar</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700">
                  <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">2</span>
                  <span>Selecione "Adicionar à Tela de Início"</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700">
                  <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">1</span>
                  <span>Toque nos <i className="fa-solid fa-ellipsis-vertical text-slate-400"></i> três pontinhos (Chrome)</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-700">
                  <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">2</span>
                  <span>Clique em "Instalar Aplicativo"</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {couriersWithPendingAdvance.map(c => (
          <div key={c.id} className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl space-y-4 border-t-4 border-orange-500">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-hourglass-half text-orange-500 animate-spin-slow"></i>
              <p className="text-[10px] font-black uppercase tracking-widest">Aprovar Adiantamento: {c.name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-orange-400">R$ {c.pendingAdvanceValue?.toFixed(2)}</p>
              <div className="flex gap-2">
                <button onClick={() => onApproveAdvance?.(c.id, false)} className="w-12 h-12 rounded-xl bg-white/10 text-white/50"><i className="fa-solid fa-xmark"></i></button>
                <button onClick={() => onApproveAdvance?.(c.id, true)} className="w-12 h-12 rounded-xl bg-emerald-500 text-white shadow-lg"><i className="fa-solid fa-check"></i></button>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Equipe de Entrega</h3>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{couriers.length} Colaboradores</span>
          </div>
          
          <div className="space-y-4">
            {couriers.map(c => (
              <div key={c.id} className="bg-slate-50 rounded-[28px] border border-slate-100 p-4 transition-all animate-in fade-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600">
                      <i className="fa-solid fa-motorcycle text-xs"></i>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase">{c.name}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {c.payType === 'PERCENTAGE' ? `${c.payValue}% por pedido` : `R$ ${c.payValue.toFixed(2)} fixo`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingCourierId(editingCourierId === c.id ? null : c.id)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center active:scale-90 transition-all"
                    >
                      <i className={`fa-solid ${editingCourierId === c.id ? 'fa-xmark' : 'fa-gear'}`}></i>
                    </button>
                    <button 
                      onClick={() => { if(navigator.vibrate) navigator.vibrate([50, 10, 50]); onDeleteCourier(c.id); }}
                      className="w-10 h-10 rounded-xl bg-white border border-red-100 text-red-500 flex items-center justify-center active:scale-90 transition-all hover:bg-red-50"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                {editingCourierId === c.id && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 animate-in slide-in-from-top duration-300 space-y-4 shadow-sm">
                    {/* EDITAR NOME */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Nome do Entregador</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-600 font-bold text-slate-800 text-xs transition-all"
                        value={c.name}
                        onChange={(e) => onUpdateCourierName(c.id, e.target.value)}
                        placeholder="Nome Completo"
                      />
                    </div>

                    <div className="h-[1px] bg-slate-100 my-2"></div>

                    {/* EDITAR TAXA */}
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Configuração de Ganhos</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onUpdatePayment(c.id, 'FIXED', c.payValue)}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${c.payType === 'FIXED' ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        Valor Fixo
                      </button>
                      <button 
                        onClick={() => onUpdatePayment(c.id, 'PERCENTAGE', c.payValue)}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${c.payType === 'PERCENTAGE' ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        Porcentagem
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                        {c.payType === 'FIXED' ? 'R$' : '%'}
                      </span>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-red-600 font-black text-slate-800 transition-all"
                        value={c.payValue}
                        onChange={(e) => onUpdatePayment(c.id, c.payType, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-end gap-2">
                  <button 
                    onClick={() => onImpersonate?.(c.id)}
                    className="bg-white text-slate-400 hover:text-red-600 border border-slate-200 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      {/* HEADER DE MÉTRICAS */}
      <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center text-center">
        <div className="flex-1 border-r border-slate-100 px-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendas Hoje</p>
          <p className="text-xs font-black text-emerald-600">R$ {stats.revenue.toFixed(2)}</p>
        </div>
        <div className="flex-1 border-r border-slate-100 px-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motoboys</p>
          <p className="text-xs font-black text-slate-800">{stats.active} ON</p>
        </div>
        <div className="flex-1 px-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendências</p>
          <p className="text-xs font-black text-red-600">{stats.pending} Fila</p>
        </div>
      </div>

      <div className="h-[380px] w-full relative">
        <MapMonitor 
          couriers={couriers} 
          orders={orders} 
          focusLocation={mapFocus} 
          showHeatmap={showHeatmap}
        />
        
        <button 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`absolute top-4 right-4 z-[10] w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${showHeatmap ? 'bg-orange-500 text-white' : 'bg-white text-slate-400'}`}
        >
          <i className="fa-solid fa-fire-flame-curved"></i>
        </button>

        <div className="absolute bottom-4 right-4 z-[10] flex flex-col gap-3 items-end">
          {voiceFeedback && <div className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-right">{voiceFeedback}</div>}
          <button onClick={() => { if (recognitionRef.current) { setIsListening(true); recognitionRef.current.start(); } }} className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-red-600'}`}>
            <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'} text-white text-xl`}></i>
          </button>
        </div>
      </div>

      {/* DASHBOARD DE DEMANDA POR ZONA */}
      <section className="space-y-3 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Demanda iFood por Loja</h3>
          <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Live Flow</span>
        </div>
        <div className="space-y-4">
          {zoneStats.map(zone => (
            <div key={zone.id} className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span className="text-slate-500 truncate max-w-[150px]">{zone.name}</span>
                <span className={zone.percentage > 40 ? 'text-red-600' : 'text-slate-800'}>{zone.percentage}% ({zone.count})</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${zone.percentage > 40 ? 'bg-red-500' : zone.percentage > 20 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                  style={{ width: `${zone.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluxo iFood em Tempo Real</h3>
          <div className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-full uppercase">Webhook: Conectado</div>
        </div>
        {activeOrders.map(order => (
          <div key={order.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-top duration-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pedido #{order.orderNumber} • {stores.find(s=>s.id===order.storeId)?.name}</p>
                <p className="font-black text-slate-800 text-sm mt-1 uppercase">{order.clientName}</p>
              </div>
              <span className={`text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${order.status === 'PENDING' ? 'bg-[#ea1d2c] text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                {order.status === 'PENDING' ? 'Novo iFood' : 'Em Rota'}
              </span>
            </div>
            {order.courierId ? (
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600"><i className="fa-solid fa-motorcycle"></i></div>
                  <p className="text-[10px] font-black text-slate-700 uppercase">{couriers.find(c=>c.id===order.courierId)?.name}</p>
                </div>
                <button onClick={() => setMapFocus(couriers.find(c=>c.id===order.courierId)?.location || null)} className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-[10px]"><i className="fa-solid fa-crosshairs"></i></button>
              </div>
            ) : (
              <button onClick={() => setShowDispatchModal(order.id)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95">Despachar Agora</button>
            )}
          </div>
        ))}
      </section>

      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-end justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-xl tracking-tighter">Escolher Entregador</h3>
              <button onClick={() => setShowDispatchModal(null)} className="text-slate-400 bg-slate-100 w-12 h-12 rounded-full"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
              {couriers.filter(c => c.status === 'ONLINE').map(c => (
                <button 
                  key={c.id}
                  onClick={() => { onManualDispatch(showDispatchModal, c.id); setShowDispatchModal(null); }}
                  className="w-full p-6 border-2 border-slate-50 rounded-[28px] flex justify-between items-center hover:border-red-500 hover:bg-red-50/10 transition-all text-left group"
                >
                  <div>
                    <p className="font-black text-sm text-slate-800 uppercase">{c.name}</p>
                    <p className="text-[9px] text-emerald-600 font-black uppercase mt-1 tracking-widest">{c.payType === 'PERCENTAGE' ? `${c.payValue}%` : `R$ ${c.payValue.toFixed(2)}`}</p>
                  </div>
                  <i className="fa-solid fa-arrow-right text-slate-300 group-hover:text-red-500"></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
