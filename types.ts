
export type UserRole = 'ADMIN' | 'COURIER';

export interface Location {
  lat: number;
  lng: number;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  location: Location;
  isLinked?: boolean; // Novo: Indica se a loja está vinculada ao sistema iFood
  merchantId?: string; // Novo: ID do restaurante no iFood
}

export interface Courier {
  id: string;
  name: string;
  location: Location;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  currentOrderId?: string;
  payType: 'PERCENTAGE' | 'FIXED';
  payValue: number;
  goalOrders?: number; 
  goalKm?: number;     
  bonusValue?: number; 
  walletBalance: number;
  paymentDayOfWeek: number; // 0-6 (0: Domingo, 5: Sexta, etc.)
  baseSalary: number;       // Novo: Salário mensal fixo
  lastAdvanceDate?: string; // Novo: Data do último adiantamento
  pendingAdvanceValue?: number; // Novo: Valor de adiantamento aguardando aprovação
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  address: string;
  location: Location;
  storeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_ROUTE' | 'DELIVERED';
  courierId?: string;
  aiReasoning?: string;
  createdAt: string;
  orderPrice: number;
  aiEta?: string;
  aiDistance?: string;
}

export interface Product {
  id: string;
  name: string;
  storeId: string;
  stock: number;
  minThreshold: number;
  lastSalesHistory: number[];
}

export interface Prediction {
  productId: string;
  estimatedDaysRemaining: number;
  recommendedRestock: number;
  reasoning: string;
}
