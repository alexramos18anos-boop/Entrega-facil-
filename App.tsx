
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Order, Courier, Location, Store } from './types';
import { MOCK_COURIERS, MOCK_STORES, MOCK_ADMINS, MOCK_COURIER_ACCOUNTS } from './constants';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import CourierApp from './components/CourierApp';
import Login from './components/Login';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [identity, setIdentity] = useState<UserRole | null>(null);
  const [role, setRole] = useState<UserRole>('COURIER');
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
  const [impersonatedCourierId, setImpersonatedCourierId] = useState<string | null>(null);
  
  // Estados de Dados (Simulando Banco de Dados)
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>(MOCK_COURIERS);
  const [stores, setStores] = useState<Store[]>(MOCK_STORES.map(s => ({ ...s, isLinked: true })));
  const [accounts, setAccounts] = useState(MOCK_COURIER_ACCOUNTS);
  const [activeTab, setActiveTab] = useState('HOME');

  const handleLogin = (selectedIdentity: UserRole, userId?: string) => {
    setIdentity(selectedIdentity);
    setRole(selectedIdentity);
    setLoggedUserId(userId || null);
    setImpersonatedCourierId(null);
    setIsLoggedIn(true);
    setActiveTab('HOME');
  };

  const handleSignup = (data: any) => {
    const newId = `c${couriers.length + 1}`;
    const newCourier: Courier = {
      id: newId,
      name: data.name,
      location: { lat: -23.5616, lng: -46.6560 },
      status: 'ONLINE',
      payType: 'FIXED',
      payValue: 7.00,
      walletBalance: 0,
      paymentDayOfWeek: 5,
      baseSalary: 1500,
    };

    const newAccount = {
      email: data.email,
      phone: data.phone,
      password: data.password,
      courierId: newId
    };

    setCouriers(prev => [...prev, newCourier]);
    setAccounts(prev => [...prev, newAccount]);
  };

  const handleAddStore = (name: string, address: string) => {
    const newStore: Store = {
      id: `s${stores.length + 1}`,
      name,
      address,
      location: { lat: -23.5616 + (Math.random() - 0.5) * 0.02, lng: -46.6560 + (Math.random() - 0.5) * 0.02 },
      isLinked: true,
      merchantId: Math.random().toString(36).substr(2, 8).toUpperCase()
    };
    setStores(prev => [...prev, newStore]);
  };

  const toggleStoreLink = (storeId: string) => {
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, isLinked: !s.isLinked } : s));
  };

  const handleImpersonate = (courierId: string) => {
    if (identity === 'ADMIN') {
      setImpersonatedCourierId(courierId);
      setRole('COURIER');
      setActiveTab('HOME');
    }
  };

  const handleUpdatePayment = (courierId: string, type: 'PERCENTAGE' | 'FIXED', value: number) => {
    setCouriers(prev => prev.map(c => c.id === courierId ? { ...c, payType: type, payValue: value } : c));
  };

  const handleUpdateCourierName = (courierId: string, newName: string) => {
    setCouriers(prev => prev.map(c => c.id === courierId ? { ...c, name: newName } : c));
  };

  const handleDeleteCourier = (courierId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este entregador? Esta ação é irreversível.")) {
      setCouriers(prev => prev.filter(c => c.id !== courierId));
      setAccounts(prev => prev.filter(a => a.courierId !== courierId));
      if (impersonatedCourierId === courierId) {
        setImpersonatedCourierId(null);
        setRole('ADMIN');
      }
    }
  };

  const handleUpdateWallet = (courierId: string, amount: number) => {
    setCouriers(prev => prev.map(c => c.id === courierId ? { ...c, walletBalance: c.walletBalance + amount } : c));
  };

  const handleRequestAdvance = (courierId: string, value: number) => {
    setCouriers(prev => prev.map(c => c.id === courierId ? { ...c, pendingAdvanceValue: value } : c));
  };

  const handleApproveAdvance = (courierId: string, approve: boolean) => {
    setCouriers(prev => prev.map(c => {
      if (c.id === courierId && approve && c.pendingAdvanceValue) {
        return { 
          ...c, 
          walletBalance: c.walletBalance - c.pendingAdvanceValue, 
          lastAdvanceDate: new Date().toISOString(),
          pendingAdvanceValue: undefined
        };
      } else if (c.id === courierId && !approve) {
        return { ...c, pendingAdvanceValue: undefined };
      }
      return c;
    }));
  };

  const handleManualDispatch = (orderId: string, courierId: string) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, courierId, status: 'ACCEPTED', aiReasoning: 'Atribuição manual pelo administrador.' } : o
    ));
    setCouriers(prev => prev.map(c => c.id === courierId ? { ...c, status: 'BUSY' } : c));
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const moveInterval = setInterval(() => {
      setCouriers(prev => prev.map(c => {
        if (c.status === 'OFFLINE') return c;
        return {
          ...c,
          location: {
            lat: c.location.lat + (Math.random() - 0.5) * 0.0004,
            lng: c.location.lng + (Math.random() - 0.5) * 0.0004,
          }
        };
      }));
    }, 4000);
    return () => clearInterval(moveInterval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      // Somente gera pedidos se houver lojas vinculadas
      const linkedStores = stores.filter(s => s.isLinked);
      if (linkedStores.length === 0) return;

      const randomStore = linkedStores[Math.floor(Math.random() * linkedStores.length)];
      const dist = (Math.random() * 8 + 1).toFixed(1);
      
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        orderNumber: Math.floor(Math.random() * 9000 + 1000).toString(),
        clientName: ['Felipe G.', 'Ana L.', 'Julio C.', 'Bruna M.', 'Ricardo K.', 'Sofia R.', 'Gustavo B.'][Math.floor(Math.random() * 7)],
        address: ['Av. Paulista, 1500', 'Al. Santos, 400', 'Rua Augusta, 1200', 'Rua Oscar Freire, 300', 'Av. Brigadeiro, 2200'][Math.floor(Math.random() * 5)],
        location: { 
          lat: randomStore.location.lat + (Math.random() - 0.5) * 0.02, 
          lng: randomStore.location.lng + (Math.random() - 0.5) * 0.02 
        },
        storeId: randomStore.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        orderPrice: Math.floor(Math.random() * 160 + 40),
        aiDistance: `${dist} km`
      };
      setOrders(prev => [newOrder, ...prev]);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }, 15000); // Frequência aumentada para pedidos iFood
    return () => clearInterval(interval);
  }, [isLoggedIn, stores]);

  const handleAcceptOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'IN_ROUTE' } : o));
    setCouriers(prev => prev.map(c => {
      const order = orders.find(o => o.id === orderId);
      if (order && order.courierId === c.id) return { ...c, status: 'BUSY' };
      return c;
    }));
  }, [orders]);

  const handleCompleteDelivery = useCallback((orderId: string) => {
    setOrders(prev => {
      const order = prev.find(o => o.id === orderId);
      if (order && order.courierId) {
        const courier = couriers.find(c => c.id === order.courierId);
        if (courier) {
          const earned = courier.payType === 'PERCENTAGE' 
            ? (order.orderPrice * (courier.payValue / 100)) 
            : courier.payValue;
          handleUpdateWallet(courier.id, earned);
        }
      }
      return prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o);
    });
    setCouriers(prev => prev.map(c => {
       const order = orders.find(o => o.id === orderId);
       if (order && order.courierId === c.id) return { ...c, status: 'ONLINE' };
       return c;
    }));
  }, [couriers, orders]);

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} courierAccounts={accounts} adminAccounts={MOCK_ADMINS} />;
  }

  const effectiveCourierId = impersonatedCourierId || loggedUserId || 'c1';
  const activeCourier = couriers.find(c => c.id === effectiveCourierId) || couriers[0];
  const courierOrders = orders.filter(o => o.courierId === activeCourier.id);
  const showAdmin = role === 'ADMIN' && identity === 'ADMIN';

  return (
    <Layout 
      role={role} 
      setRole={setRole} 
      title={showAdmin ? 'entrega facil • Control Tower' : `entrega facil • ${activeCourier.name}`}
      canSwitch={identity === 'ADMIN'}
      isImpersonating={!!impersonatedCourierId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {showAdmin ? (
        <AdminDashboard 
          orders={orders} 
          couriers={couriers} 
          stores={stores}
          onManualDispatch={handleManualDispatch} 
          onUpdatePayment={handleUpdatePayment}
          onUpdateCourierName={handleUpdateCourierName}
          onDeleteCourier={handleDeleteCourier}
          onUpdateWallet={handleUpdateWallet}
          onApproveAdvance={handleApproveAdvance}
          onImpersonate={handleImpersonate}
          onAddStore={handleAddStore}
          onToggleStoreLink={toggleStoreLink}
          activeTab={activeTab}
        />
      ) : (
        <CourierApp 
          courier={activeCourier}
          activeOrders={courierOrders}
          onAcceptOrder={handleAcceptOrder}
          onCompleteDelivery={handleCompleteDelivery}
          onRequestAdvance={(val) => handleRequestAdvance(activeCourier.id, val)}
          activeTab={activeTab}
        />
      )}
    </Layout>
  );
};

export default App;
