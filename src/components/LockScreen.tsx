'use client';
import { useState, useEffect } from 'react';
import { Lock, Unlock, ArrowRight } from 'lucide-react';

export default function LockScreen({ children, titulo }: { children: React.ReactNode, titulo: string }) {
  const [bloqueado, setBloqueado] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  // Leemos el PIN secreto desde tus variables de entorno
  const PIN_SECRETO = process.env.NEXT_PUBLIC_ADMIN_PIN;

  useEffect(() => {
    // Verificamos si ya había iniciado sesión en este dispositivo
    const session = sessionStorage.getItem('sua_admin_unlocked');
    if (session === 'true') setBloqueado(false);
  }, []);

  const verificarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === PIN_SECRETO) {
      sessionStorage.setItem('sua_admin_unlocked', 'true');
      setBloqueado(false);
    } else {
      setError(true);
      setPinInput('');
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!bloqueado) return <>{children}</>;

  return (
    <main className="min-h-screen bg-[#060B08] flex items-center justify-center p-6 text-[#CBA36A] font-sans">
      <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-10 bg-cover pointer-events-none grayscale"></div>
      
      <div className="relative z-10 bg-[#0A130D] border border-[#CBA36A]/20 p-8 md:p-12 rounded-[3rem] shadow-[0_0_50px_rgba(203,163,106,0.1)] w-full max-w-md text-center">
        <div className="w-16 h-16 bg-[#CBA36A]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#CBA36A]/30">
          <Lock size={28} className="text-[#CBA36A]" />
        </div>
        
        <h1 className="text-3xl font-serif text-white mb-2">{titulo}</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-8">Acceso Restringido</p>

        <form onSubmit={verificarPin} className="space-y-6">
          <div>
            <input 
              type="password" 
              maxLength={6}
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} 
              placeholder="••••••" 
              className={`w-full bg-black/40 border ${error ? 'border-red-500/50 text-red-500' : 'border-white/10 text-white focus:border-[#CBA36A]'} p-4 rounded-2xl text-center text-2xl tracking-[0.5em] outline-none transition-colors`}
              autoFocus
            />
            {error && <p className="text-red-500 text-[10px] uppercase font-bold mt-2 tracking-widest animate-pulse">PIN Incorrecto</p>}
          </div>

          <button type="submit" className="w-full bg-[#CBA36A] text-[#0A130D] py-4 rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-2">
            Desbloquear <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </main>
  );
}