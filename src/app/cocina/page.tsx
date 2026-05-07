'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, User, CheckCircle, Coffee, UtensilsCrossed } from 'lucide-react';

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    fetchPedidos();
    // 📡 SUSCRIPCIÓN EN TIEMPO REAL: Si entra un pedido, la cocina se actualiza sola
    const canal = supabase
      .channel('cocina-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchPedidos();
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, []);

  async function fetchPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: true })
      .neq('estado', 'entregado');
    setPedidos(data || []);
  }

  async function actualizarEstado(id: string, nuevoEstado: string) {
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
    fetchPedidos();
  }

  return (
    <main className="min-h-screen bg-[#060B08] text-[#CBA36A] font-sans relative overflow-x-hidden">
      {/* 🖼️ FONDO DE BOSQUE FIJO */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-lighten">
        <div className="absolute inset-0 bg-[url('/bg-bosque.png')] bg-center bg-cover"></div>
      </div>

      <div className="relative z-10 p-6 md:p-12">
        <header className="flex justify-between items-end mb-12 border-b border-[#CBA36A]/20 pb-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-white">Tablero de Producción</h1>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#CBA36A] mt-2">Refugio Súa · Control de Órdenes</p>
          </div>
          <div className="text-right">
            <span className="text-5xl font-serif text-white">{pedidos.length}</span>
            <p className="text-[9px] uppercase font-black opacity-50">Pendientes</p>
          </div>
        </header>

        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-20">
            <UtensilsCrossed size={64} className="mb-4" />
            <p className="font-serif text-2xl italic">No hay órdenes por ahora...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pedidos.map((p) => (
              <div key={p.id} className={`bg-[#050A06]/80 backdrop-blur-xl rounded-[2.5rem] border p-8 shadow-2xl transition-all ${p.estado === 'preparado' ? 'border-green-500/40 bg-green-950/10' : 'border-[#CBA36A]/20'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#CBA36A] flex items-center justify-center text-[#060B08] font-black">
                      {p.cliente_nombre[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-bold leading-none">{p.cliente_nombre}</h3>
                      <span className="text-[9px] uppercase tracking-widest text-[#CBA36A]">Pasa a las {p.hora_recogida}</span>
                    </div>
                  </div>
                  <Clock size={18} className="opacity-30" />
                </div>

                <div className="space-y-4 mb-8">
                  {p.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-white/5 pb-2">
                      <div className="text-sm">
                        <p className="text-white font-medium">• {item.nombre}</p>
                        {item.extras_str && <p className="text-[10px] text-[#CBA36A] ml-3 italic">{item.extras_str}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  {p.estado === 'pendiente' ? (
                    <button 
                      onClick={() => actualizarEstado(p.id, 'preparado')}
                      className="flex-1 bg-white text-black py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#CBA36A] transition-colors"
                    >
                      Marcar Listo
                    </button>
                  ) : (
                    <button 
                      onClick={() => actualizarEstado(p.id, 'entregado')}
                      className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                    >
                      Confirmar Entrega
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}