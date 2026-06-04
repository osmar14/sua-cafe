'use client';
import { useState, useEffect } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface LockScreenProps {
  children: React.ReactNode;
  titulo?: string;
  modulo?: 'admin' | 'caja' | 'finanzas'; // Identificador para saber qué PIN pedir
}

export default function LockScreen({ children, titulo = "Acceso Restringido", modulo = 'admin' }: LockScreenProps) {
  const [autorizado, setAutorizado] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [cargando, setCargando] = useState(true);

  // 1. Verificación Silenciosa al cargar la página
  useEffect(() => {
    async function verificarSesion() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          setAutorizado(true);
        }
      } catch (e) {
        console.error('Sin sesión activa');
      } finally {
        setCargando(false);
      }
    }
    verificarSesion();
  }, []);

  // 2. Intento de Acceso
  const manejarAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput, modulo }) // Enviamos el PIN y de qué página viene
      });

      if (res.ok) {
        setAutorizado(true);
      } else {
        alert('PIN de acceso denegado.');
        setPinInput('');
      }
    } catch (error) {
      alert('Error de red. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div className="min-h-screen bg-[#060B08] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#CBA36A] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!autorizado) {
    return (
      <main className="min-h-screen bg-[#060B08] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-[#0A130D] p-8 rounded-[2rem] border border-[#CBA36A]/30 shadow-[0_0_50px_rgba(203,163,106,0.1)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CBA36A] to-transparent"></div>
          
          <div className="w-16 h-16 bg-[#CBA36A]/10 text-[#CBA36A] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#CBA36A]/40">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-serif text-[#CBA36A] mb-2">{titulo}</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-8">
            {modulo === 'caja' ? 'Ingrese su NIP de Operador' : 'Identificación Biométrica Requerida'}
          </p>
          
          <form onSubmit={manejarAcceso} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBA36A]/50" size={18} />
              <input 
                type="password" 
                maxLength={6}
                required
                placeholder="PIN"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-center tracking-[1em] focus:outline-none focus:border-[#CBA36A] transition-colors"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button 
              type="submit" 
              disabled={cargando || pinInput.length < 4}
              className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 hover:bg-yellow-500 shadow-lg"
            >
              Desbloquear Sistema
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Si está autorizado, mostramos la página (Admin, Finanzas, o Caja)
  return <>{children}</>;
}