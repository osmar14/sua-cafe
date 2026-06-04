'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Package, Lock, CheckCircle, Navigation, Loader2 } from 'lucide-react';

export default function DeliveryDashboard() {
  const [autorizado, setAutorizado] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // 1. Verificación Inicial
  useEffect(() => {
    async function verificarSesion() {
      try {
        const res = await fetch('/api/delivery/me');
        if (res.ok) {
          setAutorizado(true);
          fetchPedidos();
        }
      } catch (e) {
        console.error('Sin sesión activa');
      } finally {
        setCargandoAuth(false);
      }
    }
    verificarSesion();

    // 2. Radar de Pedidos en Tiempo Real
    const sub = supabase.channel('radar_repartidores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        if (autorizado) fetchPedidos();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [autorizado]);

  async function fetchPedidos() {
    // Escaneamos solo pedidos pagados y designados para entrega a domicilio
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .eq('tipo_entrega', 'domicilio')
      .eq('estado', 'pagado')
      .order('created_at', { ascending: true });
      
    setPedidos(data || []);
  }

  const manejarAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoAuth(true);
    
    try {
      const res = await fetch('/api/delivery/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });

      if (res.ok) {
        setAutorizado(true);
        fetchPedidos();
      } else {
        alert('PIN de acceso denegado.');
      }
    } catch (error) {
      alert('Error de red. Intente nuevamente.');
    } finally {
      setCargandoAuth(false);
      setPinInput('');
    }
  };

  const marcarComoEntregado = async (id_pedido: string) => {
    if (!confirm('¿Confirmar entrega y eliminar orden de la matriz?')) return;
    
    setProcesandoId(id_pedido);
    try {
      const res = await fetch('/api/delivery/entregar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido })
      });

      if (res.ok) {
        // Retiramos el pedido de la interfaz inmediatamente
        setPedidos(prev => prev.filter(p => p.id !== id_pedido));
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error de comunicación satelital.');
    } finally {
      setProcesandoId(null);
    }
  };

  // --- INTERFAZ DE CIBERSEGURIDAD (LOGIN) ---
  if (!autorizado) {
    return (
      <main className="min-h-screen bg-[#060B08] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-[#0A130D] p-8 rounded-[2rem] border border-[#CBA36A]/30 shadow-2xl text-center">
          <div className="w-16 h-16 bg-[#CBA36A]/10 text-[#CBA36A] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#CBA36A]/40">
            <Navigation size={28} />
          </div>
          <h1 className="text-2xl font-serif text-[#CBA36A] mb-2">Logística Súa</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-8">Acceso exclusivo a escuadrón</p>
          
          <form onSubmit={manejarAcceso} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBA36A]/50" size={18} />
              <input 
                type="password" 
                maxLength={6}
                required
                placeholder="PIN Operativo"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-center tracking-[1em] focus:outline-none focus:border-[#CBA36A] transition-colors"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button 
              type="submit" 
              disabled={cargandoAuth || pinInput.length < 4}
              className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {cargandoAuth ? 'Autenticando...' : 'Iniciar Turno'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- PANEL DE CONTROL DE REPARTO ---
  return (
    <main className="min-h-screen bg-[#060B08] pb-24 font-sans text-white">
      <header className="bg-[#0A130D] border-b border-[#CBA36A]/20 p-5 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-serif text-[#CBA36A]">Radar de Reparto</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {pedidos.length} {pedidos.length === 1 ? 'Objetivo Activo' : 'Objetivos Activos'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center animate-pulse">
          <Navigation size={18} className="text-green-500" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {pedidos.length === 0 ? (
          <div className="text-center py-20 opacity-50 flex flex-col items-center">
            <Package size={48} className="mb-4 text-[#CBA36A]/50" />
            <p className="text-sm uppercase tracking-widest font-black">Zona Despejada</p>
            <p className="text-[10px]">A la espera de nuevas coordenadas...</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-[#0A130D] border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#CBA36A]"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase">{pedido.cliente_nombre}</h2>
                  <p className="text-[10px] text-[#CBA36A] font-black tracking-widest bg-[#CBA36A]/10 px-2 py-1 rounded inline-block mt-1">
                    TEL: {pedido.telefono}
                  </p>
                </div>
                <span className="text-xl font-serif text-[#CBA36A]">${pedido.total}</span>
              </div>

              <div className="bg-black/30 rounded-xl p-4 mb-5 border border-white/5">
                <div className="flex items-start gap-3">
                  <MapPin className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-bold text-white">{pedido.domicilio?.calle} #{pedido.domicilio?.numero}</p>
                    <p className="text-xs text-white/60">Colonia {pedido.domicilio?.colonia}</p>
                    {pedido.domicilio?.referencias && (
                      <p className="text-[10px] text-yellow-500 mt-2 bg-yellow-500/10 p-2 rounded">
                        <span className="font-bold">NOTA:</span> {pedido.domicilio.referencias}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => marcarComoEntregado(pedido.id)}
                disabled={procesandoId === pedido.id}
                className="w-full bg-green-600/20 hover:bg-green-600 border border-green-500 text-green-400 hover:text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {procesandoId === pedido.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                {procesandoId === pedido.id ? 'Limpiando Matriz...' : 'Confirmar Entrega'}
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}