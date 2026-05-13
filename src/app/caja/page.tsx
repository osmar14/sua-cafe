'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LockScreen from '@/components/LockScreen';
import { 
  BadgeDollarSign, CheckCircle, Clock, 
  User, Phone, ShoppingBag, Loader2, AlertCircle 
} from 'lucide-react';

export default function CajaPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => {
    fetchPedidos();
    const sub = supabase.channel('caja')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPedidos(prev => [payload.new, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as any;
          if (updated.estado !== 'pagado') {
            setPedidos(prev => {
              const exists = prev.some(p => p.id === updated.id);
              if (exists) return prev.map(p => p.id === updated.id ? updated : p);
              return [updated, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            });
          } else {
            setPedidos(prev => prev.filter(p => p.id !== updated.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setPedidos(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function fetchPedidos() {
    const { data } = await supabase.from('pedidos').select('*').neq('estado', 'pagado').order('created_at', { ascending: false });
    setPedidos(data || []);
  }

  const cobrarPedido = async (p: any) => {
    setProcesando(p.id);
    try {
      // 1. Obtener datos del cliente
      const { data: cliente } = await supabase.from('clientes').select('*').eq('telefono', p.telefono).single();
      
      if (cliente) {
        const ahora = new Date();
        const ultima = cliente.ultima_visita ? new Date(cliente.ultima_visita) : new Date(0);
        
        // 🛡️ REGLA ANTI-FRAUDE: Solo sumar si han pasado más de 2 horas (7200000 ms)
        const diferenciaMs = ahora.getTime() - ultima.getTime();
        const dosHoras = 2 * 60 * 60 * 1000;

        if (diferenciaMs > dosHoras) {
          // Sumar visita y actualizar timestamp
          await supabase.from('clientes').update({ 
            visitas: (cliente.visitas || 0) + 1,
            ultima_visita: ahora.toISOString()
          }).eq('telefono', p.telefono);
        }
      }

      // 2. Marcar pedido como pagado
      await supabase.from('pedidos').update({ estado: 'pagado' }).eq('id', p.id);
      fetchPedidos();
    } catch (err) { alert('Error al cobrar'); }
    finally { setProcesando(null); }
  };

  return (
    <LockScreen titulo="Caja y Cobros">
      <main className="min-h-screen bg-[#060B08] p-4 md:p-12 font-sans relative">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <header className="border-b border-[#CBA36A]/20 pb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-serif text-white flex items-center gap-3"><BadgeDollarSign size={32} className="text-[#CBA36A]"/> Caja Súa</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CBA36A]/60">Gestión de Cobro y Lealtad</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-white/40">Ordenes por cobrar</p>
              <p className="text-3xl font-serif text-white">{pedidos.length}</p>
            </div>
          </header>

          <div className="space-y-6">
            {pedidos.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-[3rem] bg-white/5">
                <ShoppingBag size={48} className="mx-auto text-white/10 mb-4"/>
                <p className="text-white/30 text-sm">No hay pedidos pendientes de cobro.</p>
              </div>
            ) : (
              pedidos.map(p => (
                <div key={p.id} className="bg-[#0A130D] border border-[#CBA36A]/20 p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row gap-8 items-start md:items-center">
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-serif text-white capitalize">{p.cliente_nombre}</h3>
                        <p className="text-[10px] font-black text-[#CBA36A] flex items-center gap-1 uppercase tracking-widest"><Phone size={10}/> {p.telefono}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.estado === 'preparado' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10 text-white/50'}`}>
                        {p.estado === 'preparado' ? '¡LISTO PARA ENTREGAR!' : 'EN PREPARACIÓN'}
                      </span>
                    </div>

                    <div className="bg-black/40 p-4 rounded-2xl space-y-2 border border-white/5">
                      {p.items.map((it:any, i:number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-white/80 font-bold uppercase">{it.nombre}</span>
                          <span className="text-white/40 font-serif">${it.precio_final || it.precio_venta}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-48 space-y-4 text-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Total a Cobrar</p>
                    <p className="text-5xl font-serif text-white leading-none">${p.total}</p>
                    
                    <button 
                      onClick={() => cobrarPedido(p)}
                      disabled={procesando === p.id}
                      className="w-full bg-[#CBA36A] text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2"
                    >
                      {procesando === p.id ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle size={14}/> Cobrar Pedido</>}
                    </button>
                    
                    <div className="flex items-center justify-center gap-1 text-[8px] font-black text-[#CBA36A] uppercase animate-pulse">
                      <AlertCircle size={10}/> Suma +1 Visita VIP
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </LockScreen>
  );
}