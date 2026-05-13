'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Coffee, Croissant, Clock, CheckCircle2, Loader2, LayoutGrid } from 'lucide-react';

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'ambas' | 'barista' | 'pan'>('ambas');

  useEffect(() => {
    fetchPedidos();
    const sub = supabase.channel('cocina_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPedidos(prev => [...prev, payload.new].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as any;
          if (['pendiente', 'barista_listo', 'pan_listo'].includes(updated.estado)) {
            setPedidos(prev => {
              const exists = prev.some(p => p.id === updated.id);
              if (exists) return prev.map(p => p.id === updated.id ? updated : p);
              return [...prev, updated].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
    const { data } = await supabase.from('pedidos')
      .select('*')
      .in('estado', ['pendiente', 'barista_listo', 'pan_listo'])
      .order('created_at', { ascending: true });
    setPedidos(data || []);
    setCargando(false);
  }

  // --- 🧠 CEREBRO A PRUEBA DE BALAS PARA CATEGORÍAS ---
  const categoriaItem = (item: any) => String(item.categoria || '').toLowerCase();
  const esBebida = (cat: string) => cat.includes('calient') || cat.includes('frio') || cat.includes('frap');
  const esPan = (cat: string) => cat.includes('pan');
  const esCombo = (cat: string) => !esBebida(cat) && !esPan(cat); // Si no es bebida ni pan, ES COMBO.

  const necesitaBarista = (pedido: any) => pedido.items.some((i:any) => esBebida(categoriaItem(i)) || esCombo(categoriaItem(i)));
  const necesitaPan = (pedido: any) => pedido.items.some((i:any) => esPan(categoriaItem(i)) || esCombo(categoriaItem(i)));

  // --- LÓGICA DE DOBLE VERIFICACIÓN ---
  const marcarBaristaListo = async (pedido: any) => {
    const nuevoEstado = (pedido.estado === 'pan_listo' || !necesitaPan(pedido)) ? 'preparado' : 'barista_listo';
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedido.id);
    fetchPedidos();
  };

  const marcarPanListo = async (pedido: any) => {
    const nuevoEstado = (pedido.estado === 'barista_listo' || !necesitaBarista(pedido)) ? 'preparado' : 'pan_listo';
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedido.id);
    fetchPedidos();
  };

  if (cargando) return <div className="min-h-screen bg-[#060B08] flex items-center justify-center text-[#CBA36A]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <main className="min-h-screen bg-[#060B08] p-4 md:p-8 font-sans selection:bg-[#CBA36A] selection:text-black">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-[#CBA36A]/20 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white">Monitor de Cocina</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">Súa Refugio Operativo</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-full shadow-lg border border-white/5">
          <button onClick={() => setVista('ambas')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${vista === 'ambas' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><LayoutGrid size={14}/> General</button>
          <button onClick={() => setVista('barista')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${vista === 'barista' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Coffee size={14}/> Barista</button>
          <button onClick={() => setVista('pan')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${vista === 'pan' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Croissant size={14}/> Panadería</button>
        </div>
      </header>

      {pedidos.length === 0 && (
        <div className="text-center py-20 opacity-30 mt-20"><Coffee size={60} className="mx-auto mb-4" /><p className="text-sm font-bold uppercase tracking-widest">Sin comandas</p></div>
      )}

      <div className={`grid grid-cols-1 ${vista === 'ambas' ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-8`}>
        
        {/* ☕ COLUMNA 1: BARISTA */}
        {(vista === 'ambas' || vista === 'barista') && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 bg-[#CBA36A]/10 p-4 rounded-2xl border border-[#CBA36A]/30"><Coffee className="text-[#CBA36A]" size={24}/><h2 className="text-xl font-serif text-white italic">Estación Barista</h2></div>
            <div className="space-y-4">
              {pedidos.filter(p => p.estado !== 'barista_listo' && necesitaBarista(p)).map(p => {
                const itemsBarista = p.items.filter((i:any) => esBebida(categoriaItem(i)) || esCombo(categoriaItem(i)));
                
                return (
                  <div key={`b-${p.id}`} className="bg-[#0A130D] border border-white/10 p-6 rounded-[2rem] shadow-xl relative group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#CBA36A]"></div>
                    <div className="flex justify-between items-start mb-6 pl-4">
                      <div>
                        <p className="text-2xl font-serif text-white uppercase">{p.cliente_nombre}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-[#CBA36A] font-black"><Clock size={12} className="inline mr-1"/>{p.hora_recogida}</p>
                          {p.estado === 'pan_listo' && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold uppercase">Pan listo, faltas tú ⏳</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-lg text-white/60">#{p.id.slice(-4)}</span>
                    </div>
                    <ul className="space-y-4 mb-8 pl-4">
                      {itemsBarista.map((item:any, idx:number) => (
                        <li key={idx} className="border-l border-white/20 pl-4 py-1 relative">
                          <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[#CBA36A]"></div>
                          <p className="text-base font-bold text-white uppercase">{item.nombre}</p>
                          {item.extras_str && <p className="text-xs text-[#CBA36A] font-black uppercase mt-1 bg-[#CBA36A]/10 inline-block px-2 py-0.5 rounded">{item.extras_str}</p>}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => marcarBaristaListo(p)} className="w-full bg-white/5 hover:bg-[#CBA36A] text-white hover:text-black py-4 rounded-xl font-black text-[10px] uppercase transition-all flex justify-center items-center gap-2 border border-white/10 hover:border-[#CBA36A]"><CheckCircle2 size={16}/> {p.estado === 'pan_listo' ? 'Completar Orden' : 'Bebidas Listas'}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🥐 COLUMNA 2: PANADERÍA */}
        {(vista === 'ambas' || vista === 'pan') && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 bg-orange-500/10 p-4 rounded-2xl border border-orange-500/30"><Croissant className="text-orange-400" size={24}/><h2 className="text-xl font-serif text-white italic">Estación Panadería</h2></div>
            <div className="space-y-4">
              {pedidos.filter(p => p.estado !== 'pan_listo' && necesitaPan(p)).map(p => {
                const itemsPan = p.items.filter((i:any) => esPan(categoriaItem(i)) || esCombo(categoriaItem(i)));
                
                return (
                  <div key={`p-${p.id}`} className="bg-[#0A130D] border border-white/10 p-6 rounded-[2rem] shadow-xl relative">
                     <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                     <div className="flex justify-between items-start mb-6 pl-4">
                      <div>
                        <p className="text-2xl font-serif text-white uppercase">{p.cliente_nombre}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-orange-400 font-black"><Clock size={12} className="inline mr-1"/>{p.hora_recogida}</p>
                          {p.estado === 'barista_listo' && <span className="text-[9px] bg-[#CBA36A]/20 text-[#CBA36A] px-2 py-0.5 rounded font-bold uppercase">Barista listo, faltas tú ⏳</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-lg text-white/60">#{p.id.slice(-4)}</span>
                    </div>
                    <ul className="space-y-4 mb-8 pl-4">
                      {itemsPan.map((item:any, idx:number) => (
                        <li key={idx} className="border-l border-white/20 pl-4 py-1 relative">
                          <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-orange-500"></div>
                          <p className="text-base font-bold text-white uppercase">{item.nombre}</p>
                          <p className="text-[10px] text-white/40 uppercase mt-1">{esCombo(categoriaItem(item)) ? 'Preparar pan de la Promo' : 'Directo de vitrina'}</p>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => marcarPanListo(p)} className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-black py-4 rounded-xl font-black text-[10px] uppercase transition-all flex justify-center items-center gap-2 border border-white/10 hover:border-orange-500"><CheckCircle2 size={16}/> {p.estado === 'barista_listo' ? 'Completar Orden' : 'Panes Listos'}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}