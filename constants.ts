
import { Order, Courier, Store, Product } from './types';

export const MOCK_STORES: Store[] = [
  { id: 's1', name: 'Burger King - Matriz', address: 'Av. Paulista, 1000', location: { lat: -23.5616, lng: -46.6560 } },
  { id: 's2', name: 'Sushibar Central', address: 'Rua Augusta, 500', location: { lat: -23.5596, lng: -46.6620 } },
  { id: 's3', name: 'Pizza Flash', address: 'Av. Brigadeiro, 200', location: { lat: -23.5678, lng: -46.6489 } }
];

export const MOCK_COURIERS: Courier[] = [
  { 
    id: 'c1', 
    name: 'João Silva', 
    location: { lat: -23.5630, lng: -46.6500 }, 
    status: 'ONLINE', 
    payType: 'FIXED', 
    payValue: 8.50, 
    walletBalance: 125.40, 
    paymentDayOfWeek: 5,
    baseSalary: 1800.00,
    lastAdvanceDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 'c2', 
    name: 'Maria Souza', 
    location: { lat: -23.5700, lng: -46.6600 }, 
    status: 'ONLINE', 
    payType: 'PERCENTAGE', 
    payValue: 12, 
    walletBalance: 45.00, 
    paymentDayOfWeek: 5,
    baseSalary: 1950.00,
    lastAdvanceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 'c3', 
    name: 'Carlos Oliveira', 
    location: { lat: -23.5550, lng: -46.6450 }, 
    status: 'ONLINE', 
    payType: 'PERCENTAGE', 
    payValue: 10, 
    walletBalance: 0.00, 
    paymentDayOfWeek: 1,
    baseSalary: 1750.00
  }
];

// NOVAS CREDENCIAIS PARA ADMINS
export const MOCK_ADMINS = [
  { email: 'alexramos12hwh@gmail.com', phone: '11999999999', password: '@Eusoufeio1', name: 'Alex Ramos' },
  { email: 'admin@entregafacil.com', phone: '11988888888', password: 'admin', name: 'Admin Geral' },
  { email: 'gestor@entregafacil.com', phone: '11977777777', password: '123', name: 'Gestor' }
];

// MAPEAMENTO DE LOGIN PARA ENTREGADORES
export const MOCK_COURIER_ACCOUNTS = [
  { email: 'joao@entregador.com', phone: '11911111111', password: '123', courierId: 'c1' },
  { email: 'maria@entregador.com', phone: '11922222222', password: '123', courierId: 'c2' },
  { email: 'carlos@entregador.com', phone: '11933333333', password: '123', courierId: 'c3' }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Pão de Hambúrguer', storeId: 's1', stock: 50, minThreshold: 100, lastSalesHistory: [20, 35, 15, 40, 25, 30, 45] },
  { id: 'p2', name: 'Batata Congelada (kg)', storeId: 's1', stock: 12, minThreshold: 20, lastSalesHistory: [5, 8, 4, 7, 6, 9, 10] },
  { id: 'p3', name: 'Salmão Fresco', storeId: 's2', stock: 5, minThreshold: 10, lastSalesHistory: [2, 3, 2, 4, 1, 3, 5] }
];

export const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
export const PAYMENT_NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';
