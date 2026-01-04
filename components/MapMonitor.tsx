
import React, { useEffect, useRef } from 'react';
import { Courier, Order, Location } from '../types';
import { MOCK_STORES } from '../constants';

interface MapMonitorProps {
  couriers: Courier[];
  orders: Order[];
  focusLocation?: Location | null;
  showHeatmap?: boolean;
}

declare const L: any;

const MapMonitor: React.FC<MapMonitorProps> = ({ couriers, orders, focusLocation, showHeatmap = true }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const heatmapLayersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-23.5616, -46.6560], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    MOCK_STORES.forEach(store => {
      const storeIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-red-600 w-9 h-9 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white text-white">
                <i class="fa-solid fa-shop text-[12px]"></i>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });
      L.marker([store.location.lat, store.location.lng], { icon: storeIcon })
        .addTo(mapRef.current)
        .bindPopup(`<div class="font-black text-xs uppercase p-1">${store.name}</div>`);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && focusLocation) {
      mapRef.current.flyTo([focusLocation.lat, focusLocation.lng], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [focusLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Limpar camadas de heatmap antigas
    heatmapLayersRef.current.forEach(layer => mapRef.current.removeLayer(layer));
    heatmapLayersRef.current = [];

    if (showHeatmap) {
      const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
      
      // Simula zonas de calor baseadas nos pedidos
      MOCK_STORES.forEach(store => {
        const zoneOrders = activeOrders.filter(o => o.storeId === store.id);
        if (zoneOrders.length > 0) {
          const intensity = Math.min(zoneOrders.length * 0.1, 0.6);
          const radius = 200 + (zoneOrders.length * 50);
          
          // Cor baseada na intensidade
          const color = zoneOrders.length > 5 ? '#ef4444' : zoneOrders.length > 2 ? '#f97316' : '#10b981';

          const circle = L.circle([store.location.lat, store.location.lng], {
            color: 'transparent',
            fillColor: color,
            fillOpacity: intensity,
            radius: radius
          }).addTo(mapRef.current);
          
          heatmapLayersRef.current.push(circle);
        }
      });
    }

    couriers.forEach(courier => {
      const courierId = `courier-${courier.id}`;
      const isActive = courier.status !== 'OFFLINE';
      const colorClass = courier.status === 'BUSY' ? 'bg-blue-500' : 'bg-emerald-500';
      
      const iconHtml = `
        <div class="flex flex-col items-center">
          <div class="bg-slate-900 text-white px-2 py-0.5 rounded-lg shadow-xl mb-1 border border-white/20">
            <span class="text-[7px] font-black uppercase tracking-tighter whitespace-nowrap">${courier.name.split(' ')[0]}</span>
          </div>
          <div class="relative transition-all duration-700 ease-in-out">
            <div class="${colorClass} w-9 h-9 rounded-full flex items-center justify-center shadow-2xl border-2 border-white text-white transition-colors duration-500">
              <i class="fa-solid ${courier.status === 'BUSY' ? 'fa-truck-fast' : 'fa-motorcycle'} text-[13px]"></i>
            </div>
            ${isActive ? `<div class="absolute -inset-1 rounded-full border-2 border-${courier.status === 'BUSY' ? 'blue' : 'emerald'}-400 animate-ping opacity-20"></div>` : ''}
          </div>
        </div>`;

      if (markersRef.current[courierId]) {
        markersRef.current[courierId].setLatLng([courier.location.lat, courier.location.lng]);
        markersRef.current[courierId].setIcon(L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [40, 60],
          iconAnchor: [20, 50]
        }));
      } else {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [40, 60],
          iconAnchor: [20, 50]
        });
        markersRef.current[courierId] = L.marker([courier.location.lat, courier.location.lng], { 
          icon,
          zIndexOffset: 1000 
        }).addTo(mapRef.current);
      }
    });

    orders.filter(o => o.status !== 'DELIVERED').forEach(order => {
      const orderId = `order-${order.id}`;
      if (!markersRef.current[orderId]) {
        const iconHtml = `
          <div class="relative">
            <div class="bg-orange-500 w-7 h-7 rounded-xl flex items-center justify-center shadow-xl border-2 border-white text-white animate-bounce">
              <i class="fa-solid fa-pizza-slice text-[10px]"></i>
            </div>
            <div class="absolute -inset-2 bg-orange-400 rounded-full animate-ping opacity-10"></div>
          </div>`;
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        markersRef.current[orderId] = L.marker([order.location.lat, order.location.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(`<div class="font-black text-xs">Pedido #${order.orderNumber}<br/><span class="text-orange-600 font-bold uppercase text-[9px]">Aguardando Motoboy</span></div>`);
      }
    });

    const activeOrderIds = orders.filter(o => o.status !== 'DELIVERED').map(o => `order-${o.id}`);
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('order-') && !activeOrderIds.includes(key)) {
        mapRef.current.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

  }, [couriers, orders, showHeatmap]);

  return (
    <div className="w-full h-full bg-slate-100 rounded-[40px] overflow-hidden shadow-inner relative border-2 border-slate-50">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      <div className="absolute top-6 left-6 z-[10] flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Radar iFood Live</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-[10] flex gap-2">
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
           <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
           <span className="text-[8px] font-black uppercase text-slate-500">Disponível</span>
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
           <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
           <span className="text-[8px] font-black uppercase text-slate-500">Em Rota</span>
        </div>
      </div>
    </div>
  );
};

export default MapMonitor;
