
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, userId?: string) => void;
  onSignup: (data: any) => void;
  courierAccounts: any[];
  adminAccounts: any[];
}

type LoginView = 'login' | 'forgot' | 'signup';
type SignupStep = 'form' | 'success';

const Login: React.FC<LoginProps> = ({ onLogin, onSignup, courierAccounts, adminAccounts }) => {
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Estados para Recuperação
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Estados para Cadastro (Apenas Entregador)
  const [signupStep, setSignupStep] = useState<SignupStep>('form');
  const [signupData, setSignupData] = useState({ name: '', email: '', phone: '', password: '' });
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const admin = adminAccounts.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (admin) {
      onLogin('ADMIN');
      return;
    }

    const courierAccount = courierAccounts.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
    if (courierAccount) {
      onLogin('COURIER', courierAccount.courierId);
      return;
    }

    setError('E-mail ou senha incorretos');
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleFindUserForRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setFoundUser(null);
    const identifier = recoveryIdentifier.trim().toLowerCase();
    const user = adminAccounts.find(a => a.email.toLowerCase() === identifier || a.phone === identifier) || 
                 courierAccounts.find(c => c.email.toLowerCase() === identifier || c.phone === identifier);
    if (user) { setFoundUser(user); } else { setRecoveryError('Dados não encontrados.'); }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(signupData);
    setSignupStep('success');
    setTimeout(() => {
      setView('login');
      setSignupStep('form');
      setSignupData({ name: '', email: '', phone: '', password: '' });
    }, 2500);
  };

  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
        <button onClick={() => setView('login')} className="text-slate-400 mb-8 w-fit p-2 -ml-2">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Recuperar Conta</h2>
        {!foundUser ? (
          <form onSubmit={handleFindUserForRecovery} className="space-y-6 mt-4">
            <p className="text-slate-500 text-sm font-medium">Insira seu e-mail ou WhatsApp:</p>
            <input 
              type="text" 
              placeholder="Ex: joao@email.com"
              className={`w-full bg-slate-50 border-2 ${recoveryError ? 'border-red-500' : 'border-slate-100'} rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-medium`}
              value={recoveryIdentifier}
              onChange={e => setRecoveryIdentifier(e.target.value)}
              required
            />
            {recoveryError && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">{recoveryError}</p>}
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-xl uppercase text-xs tracking-[0.2em]">Localizar Conta</button>
          </form>
        ) : (
          <div className="mt-4 space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 text-center">
              <p className="text-emerald-800 text-sm font-bold">Conta localizada para:<br/><span className="text-emerald-600 font-black uppercase text-xs">{foundUser.email || foundUser.phone}</span></p>
            </div>
            <div className="space-y-4">
              {['Via E-mail', 'Via SMS', 'Via WhatsApp'].map(m => (
                <button key={m} onClick={() => setRecoverySent(true)} className="w-full p-5 border-2 border-slate-50 rounded-[28px] flex items-center gap-4 active:scale-95 transition-all hover:border-slate-200">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center"><i className="fa-solid fa-paper-plane text-slate-400"></i></div>
                  <span className="font-black text-slate-700 uppercase text-[10px] tracking-widest">{m}</span>
                </button>
              ))}
            </div>
            {recoverySent && <div className="p-4 bg-emerald-500 text-white text-[10px] font-black uppercase text-center rounded-2xl animate-bounce">Link enviado com sucesso!</div>}
          </div>
        )}
      </div>
    );
  }

  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col justify-center animate-in slide-in-from-right duration-300">
        <button onClick={() => setView('login')} className="text-slate-400 mb-8 w-fit p-2 -ml-2">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>

        {signupStep === 'form' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Cadastro Entregador</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Preencha os dados para começar a entregar</p>
            </div>
            
            <div className="space-y-3">
              <input 
                type="text" placeholder="Nome Completo" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-medium"
                value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} required
              />
              <input 
                type="email" placeholder="E-mail" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-medium"
                value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} required
              />
              <input 
                type="tel" placeholder="Telefone / WhatsApp" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-medium"
                value={signupData.phone} onChange={e => setSignupData({...signupData, phone: e.target.value})} required
              />
              <div className="relative">
                <input 
                  type={showSignupPassword ? "text" : "password"}
                  placeholder="Crie uma Senha" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-medium pr-14"
                  value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} required
                />
                <button 
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className={`fa-solid ${showSignupPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-red-600 text-white font-black py-5 rounded-[24px] shadow-xl uppercase text-xs tracking-[0.2em] mt-4">Criar Minha Conta</button>
            <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-4">Somente entregadores podem se cadastrar publicamente.</p>
          </form>
        )}

        {signupStep === 'success' && (
          <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <i className="fa-solid fa-check text-4xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Bem-vindo!</h2>
              <p className="text-slate-500 font-medium mt-2">Sua conta foi criada com sucesso.<br/>Você já pode entrar com seus dados.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col justify-center">
      <div className="flex justify-center mb-12">
        <div className="bg-red-600 w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl shadow-red-600/30">
          <i className="fa-solid fa-motorcycle text-white text-4xl"></i>
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">entrega facil</h1>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Gestão de Entregas iFood</p>
      </div>

      <form onSubmit={handleLogin} className={`space-y-4 transition-transform duration-500 ${isShaking ? 'animate-shake' : ''}`}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Acesso</label>
          <input 
            type="email" placeholder="Seu e-mail"
            className={`w-full bg-white border-2 ${error ? 'border-red-500' : 'border-slate-100'} rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-medium`}
            value={email} onChange={e => setEmail(e.target.value)} required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Senha</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              className={`w-full bg-white border-2 ${error ? 'border-red-500' : 'border-slate-100'} rounded-[24px] px-6 py-4 outline-none focus:border-red-600 transition-all font-medium pr-14`}
              value={password} onChange={e => setPassword(e.target.value)} required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest animate-pulse">{error}</p>}

        <button type="submit" className="w-full bg-red-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-red-600/20 active:scale-95 transition-all uppercase text-xs tracking-[0.2em] mt-4">
          Entrar no Painel
        </button>
      </form>

      <div className="flex flex-col items-center gap-4 mt-8">
        <button onClick={() => setView('signup')} className="text-slate-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          Não tem conta? <span className="text-red-600">Cadastre-se como Entregador</span>
        </button>
        <button onClick={() => setView('forgot')} className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          Esqueceu sua senha?
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default Login;
