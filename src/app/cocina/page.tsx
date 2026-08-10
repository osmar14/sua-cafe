'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Coffee, Croissant, Clock, CheckCircle2, Loader2, LayoutGrid, BookOpen, X } from 'lucide-react';

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'ambas' | 'barista' | 'pan'>('ambas');

  // --- 🧠 ESTADOS DEL RECETARIO (KAIZEN) ---
  const [productosCatalog, setProductosCatalog] = useState<any[]>([]);
  const [recetasCatalog, setRecetasCatalog] = useState<any[]>([]);
  const [panelRecetasAbierto, setPanelRecetasAbierto] = useState(false);
  const [estacionActivaPanel, setEstacionActivaPanel] = useState<'barista' | 'pan'>('barista');
  const [filtroBarista, setFiltroBarista] = useState<'Caliente' | 'Frio' | 'Frape'>('Caliente');

  useEffect(() => {
    fetchPedidos();
    fetchCatalogoRecetas(); // Descarga silenciosa en segundo plano
    
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

  // --- 📡 DESCARGA MATRIZ DE FÓRMULAS ---
  async function fetchCatalogoRecetas() {
    const [resProd, resRecetas] = await Promise.all([
      supabase.from('productos').select('*'),
      supabase.from('recetas').select('producto_id, cantidad_necesaria, insumos(*)')
    ]);
    setProductosCatalog(resProd.data || []);
    setRecetasCatalog(resRecetas.data || []);
  }

  // --- 🧠 CEREBRO A PRUEBA DE BALAS PARA CATEGORÍAS ---
  const categoriaItem = (item: any) => String(item.categoria || item).toLowerCase();
  const esBebida = (cat: string) => cat.includes('calient') || cat.includes('frio') || cat.includes('frap');
  const esPan = (cat: string) => cat.includes('pan');
  const esCombo = (cat: string) => !esBebida(cat) && !esPan(cat);

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

  // --- 🎯 FILTRADO DEL PANEL DESLIZABLE ---
  const productosFiltradosParaPanel = productosCatalog.filter(p => {
    const catStr = categoriaItem(p.categoria);
    if (estacionActivaPanel === 'pan') return esPan(catStr);
    
    // Si es Barista, sub-filtramos por la pestaña activa
    if (estacionActivaPanel === 'barista') {
       if (filtroBarista === 'Caliente') return catStr.includes('calient');
       if (filtroBarista === 'Frio') return catStr.includes('frio');
       if (filtroBarista === 'Frape') return catStr.includes('frap');
    }
    return false;
  }).filter(p => recetasCatalog.some(r => r.producto_id === p.id)); // Solo mostramos los que sí tienen receta armanda

  const abrirPanel = (estacion: 'barista' | 'pan') => {
    setEstacionActivaPanel(estacion);
    setPanelRecetasAbierto(true);
  };

  if (cargando) return <div className="min-h-screen bg-[#060B08] flex items-center justify-center text-[#CBA36A]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <main className="min-h-screen bg-[#060B08] p-4 md:p-8 font-sans selection:bg-[#CBA36A] selection:text-black relative overflow-x-hidden">
      
      {/* ========================================== */}
      {/* 🛡️ PANEL DESLIZABLE (DRAWER) DE RECETAS   */}
      {/* ========================================== */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] transition-opacity duration-300 ${panelRecetasAbierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setPanelRecetasAbierto(false)}
      >
        <aside 
          className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-[#0A130D] border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${panelRecetasAbierto ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()} // Evita que se cierre al hacer click dentro del panel
        >
          {/* Cabecera del Panel */}
          <div className={`p-6 border-b flex justify-between items-center ${estacionActivaPanel === 'barista' ? 'border-[#CBA36A]/20 bg-[#CBA36A]/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
            <div className="flex items-center gap-3">
              {estacionActivaPanel === 'barista' ? <Coffee className="text-[#CBA36A]" size={24}/> : <Croissant className="text-orange-400" size={24}/>}
              <div>
                <h3 className={`text-xl font-serif ${estacionActivaPanel === 'barista' ? 'text-[#CBA36A]' : 'text-orange-400'}`}>
                  Recetario {estacionActivaPanel === 'barista' ? 'Barista' : 'Panadería'}
                </h3>
                <p className="text-[9px] uppercase tracking-widest text-white/40">Fórmulas Oficiales Súa</p>
              </div>
            </div>
            <button onClick={() => setPanelRecetasAbierto(false)} className="text-white/40 hover:text-white transition-colors p-2"><X size={20}/></button>
          </div>

          {/* Filtros Barista (Solo visible si abrió el panel del Barista) */}
          {estacionActivaPanel === 'barista' && (
            <div className="p-4 border-b border-white/5 bg-black/20 flex gap-2 overflow-x-auto hide-scrollbar">
               {['Caliente', 'Frio', 'Frape'].map(f => (
                 <button 
                   key={f} 
                   onClick={() => setFiltroBarista(f as any)}
                   className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 transition-all ${filtroBarista === f ? 'bg-[#CBA36A] text-[#0A130D]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                 >
                   {f}
                 </button>
               ))}
            </div>
          )}

          {/* Lista de Fórmulas */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {productosFiltradosParaPanel.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <BookOpen size={40} className="mx-auto mb-3" />
                <p className="text-xs uppercase tracking-widest font-black">No hay fórmulas registradas</p>
              </div>
            ) : (
              productosFiltradosParaPanel.map(prod => {
                const ingredientes = recetasCatalog.filter(r => r.producto_id === prod.id);
                return (
                  <div key={prod.id} className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-lg font-serif text-white mb-1">{prod.nombre}</h4>
                    
                    {/* Sección Ingredientes */}
                    <div className="mt-4 mb-4">
                      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">1. Insumos requeridos</p>
                      <ul className="space-y-1.5">
                        {ingredientes.map((ing, idx) => (
                          <li key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-white/70 truncate pr-2">{ing.insumos?.nombre}</span>
                            <span className={`font-black whitespace-nowrap ${estacionActivaPanel === 'barista' ? 'text-[#CBA36A]' : 'text-orange-400'}`}>
                              {ing.cantidad_necesaria} {ing.insumos?.unidad_medida}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sección Instrucciones */}
                    {prod.instrucciones_receta && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">2. Preparación</p>
                        <p className="text-[11px] text-white/60 leading-relaxed whitespace-pre-wrap italic">
                          {prod.instrucciones_receta}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </aside>
      </div>
      {/* ========================================== */}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-[#CBA36A]/20 pb-6 relative z-10">
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
        <div className="text-center py-20 opacity-30 mt-20 relative z-10"><Coffee size={60} className="mx-auto mb-4" /><p className="text-sm font-bold uppercase tracking-widest">Sin comandas</p></div>
      )}

      <div className={`grid grid-cols-1 ${vista === 'ambas' ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-8 relative z-10`}>
        
        {/* ☕ COLUMNA 1: BARISTA */}
        {(vista === 'ambas' || vista === 'barista') && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-[#CBA36A]/10 p-4 rounded-2xl border border-[#CBA36A]/30">
               <div className="flex items-center gap-3"><Coffee className="text-[#CBA36A]" size={24}/><h2 className="text-xl font-serif text-white italic">Estación Barista</h2></div>
               <button onClick={() => abrirPanel('barista')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#CBA36A] bg-[#CBA36A]/10 hover:bg-[#CBA36A] hover:text-black transition-all px-3 py-1.5 rounded-full border border-[#CBA36A]/20">
                 <BookOpen size={12}/> Ver Fórmulas
               </button>
            </div>
            
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
            <div className="flex justify-between items-center bg-orange-500/10 p-4 rounded-2xl border border-orange-500/30">
               <div className="flex items-center gap-3"><Croissant className="text-orange-400" size={24}/><h2 className="text-xl font-serif text-white italic">Estación Panadería</h2></div>
               <button onClick={() => abrirPanel('pan')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 hover:bg-orange-500 hover:text-black transition-all px-3 py-1.5 rounded-full border border-orange-500/20">
                 <BookOpen size={12}/> Ver Fórmulas
               </button>
            </div>
            
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