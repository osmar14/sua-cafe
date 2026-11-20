'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  optimizarComandasKaizen,
  esBebidaBarista,
  contarBebidasPedido,
  NodoBebida,
} from '@/lib/kaizenKds';
import {
  Coffee,
  Croissant,
  Clock,
  CheckCircle2,
  Loader2,
  LayoutGrid,
  BookOpen,
  X,
  Flame,
  CupSoda,
  Snowflake,
  Lock,
  Zap,
} from 'lucide-react';

// Parámetros del disparo híbrido (Tiempo O Capacidad)
const VENTANA_BUFFER_SEG = 30;
const MAX_BEBIDAS_POR_OLA = 8;

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'ambas' | 'barista' | 'pan'>('ambas');

  // --- ⏱️ ESTADOS DEL BUFFER KAIZEN (30s o Tope de 8 bebidas) ---
  const [idsEnBuffer, setIdsEnBuffer] = useState<string[]>([]);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);
  const bolsaBaristaRef = useRef<any[]>([]);
  const relojActivoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervaloCuentaRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- 🧠 ESTADOS DEL RECETARIO (KAIZEN) ---
  const [productosCatalog, setProductosCatalog] = useState<any[]>([]);
  const [recetasCatalog, setRecetasCatalog] = useState<any[]>([]);
  const [panelRecetasAbierto, setPanelRecetasAbierto] = useState(false);
  const [estacionActivaPanel, setEstacionActivaPanel] = useState<'barista' | 'pan'>('barista');
  const [filtroBarista, setFiltroBarista] = useState<'Caliente' | 'Frio' | 'Frape'>('Caliente');

  // --- 🧠 CEREBRO DE CATEGORÍAS ---
  const categoriaItem = (item: any) => String(item?.categoria || item || '').toLowerCase();
  const esPan = (cat: string) => cat.includes('pan');
  const esCombo = (cat: string) => !esBebidaBarista(cat) && !esPan(cat);

  // Para Barista usamos filtro estricto de bebidas (se omiten combos)
  const necesitaBarista = (pedido: any) =>
    Array.isArray(pedido?.items) && pedido.items.some((i: any) => esBebidaBarista(i));
  const necesitaPan = (pedido: any) =>
    Array.isArray(pedido?.items) &&
    pedido.items.some((i: any) => esPan(categoriaItem(i)) || esCombo(categoriaItem(i)));

  // --- 🚀 VACIADO SEGURO DEL BUFFER (Protegido contra choque en el milisegundo 30) ---
  const despacharBolsaBarista = (motivo: 'tiempo' | 'capacidad') => {
    if (relojActivoRef.current) {
      clearTimeout(relojActivoRef.current);
      relojActivoRef.current = null;
    }
    if (intervaloCuentaRef.current) {
      clearInterval(intervaloCuentaRef.current);
      intervaloCuentaRef.current = null;
    }

    // Copiamos, vaciamos y reiniciamos ANTES de procesar
    const loteLiberado = [...bolsaBaristaRef.current];
    bolsaBaristaRef.current = [];
    setSegundosRestantes(0);

    if (loteLiberado.length === 0) return;

    const idsLiberados = new Set(loteLiberado.map((p) => p.id));
    setIdsEnBuffer((prev) => prev.filter((id) => !idsLiberados.has(id)));

    // Registro en consola (F12) para evidencia de resultados en tu exposición
    const resumenLote = optimizarComandasKaizen(loteLiberado);
    console.group(
      `🚀 [KAIZEN KDS] Ola liberada por ${motivo === 'capacidad' ? 'TOPE DE 8 BEBIDAS' : 'VENTANA DE 30s'}`
    );
    console.table(
      resumenLote.comandaOptimizada.map((b) => ({
        Orden: `${b.ordenGlobal}°`,
        Seccion: b.seccion.toUpperCase(),
        Bebida: `${b.cantidadTotal}x ${b.nombre}`,
        Extras: b.extras || '-',
        Peso: b.peso,
        Pedidos: b.origenes.map((o) => `#${o.pedidoCorto} (${o.cantidad}x ${o.cliente})`).join(' | '),
      }))
    );
    console.log('📊 Comparativa FIFO vs KAIZEN:', resumenLote.estadisticas);
    console.groupEnd();
  };

  // --- 📥 ENCOLADO EN EL TEMPORIZADOR ÚNICO ---
  const encolarPedidoBarista = (nuevoPedido: any) => {
    bolsaBaristaRef.current.push(nuevoPedido);
    setIdsEnBuffer((prev) => (prev.includes(nuevoPedido.id) ? prev : [...prev, nuevoPedido.id]));

    const totalBebidas = bolsaBaristaRef.current.reduce(
      (acc, p) => acc + contarBebidasPedido(p),
      0
    );

    // Corte temprano por capacidad: si llega a 8 bebidas, libera de inmediato
    if (totalBebidas >= MAX_BEBIDAS_POR_OLA) {
      despacharBolsaBarista('capacidad');
      return;
    }

    // Si el reloj estaba apagado, lo encendemos por 30 segundos exactos sin reiniciarlo
    if (!relojActivoRef.current) {
      setSegundosRestantes(VENTANA_BUFFER_SEG);

      intervaloCuentaRef.current = setInterval(() => {
        setSegundosRestantes((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);

      relojActivoRef.current = setTimeout(() => {
        despacharBolsaBarista('tiempo');
      }, VENTANA_BUFFER_SEG * 1000);
    }
  };

  useEffect(() => {
    fetchPedidos();
    fetchCatalogoRecetas();

    const sub = supabase
      .channel('cocina_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const nuevoPedido = payload.new as any;

          // Barista retiene 30s; Panadería recibe al instante
          if (necesitaBarista(nuevoPedido)) {
            encolarPedidoBarista(nuevoPedido);
          }

          setPedidos((prev) =>
            [...prev, nuevoPedido].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          );
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as any;
          if (['pendiente', 'barista_listo', 'pan_listo'].includes(updated.estado)) {
            setPedidos((prev) => {
              const exists = prev.some((p) => p.id === updated.id);
              if (exists) return prev.map((p) => (p.id === updated.id ? updated : p));
              return [...prev, updated].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          } else {
            setPedidos((prev) => prev.filter((p) => p.id !== updated.id));
            setIdsEnBuffer((prev) => prev.filter((id) => id !== updated.id));
          }
        } else if (payload.eventType === 'DELETE') {
          const idBorrado = payload.old.id;
          setPedidos((prev) => prev.filter((p) => p.id !== idBorrado));
          setIdsEnBuffer((prev) => prev.filter((id) => id !== idBorrado));
          bolsaBaristaRef.current = bolsaBaristaRef.current.filter((p) => p.id !== idBorrado);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      if (relojActivoRef.current) clearTimeout(relojActivoRef.current);
      if (intervaloCuentaRef.current) clearInterval(intervaloCuentaRef.current);
    };
  }, []);

  async function fetchPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .in('estado', ['pendiente', 'barista_listo', 'pan_listo'])
      .order('created_at', { ascending: true });
    setPedidos(data || []);
    setCargando(false);
  }

  async function fetchCatalogoRecetas() {
    const [resProd, resRecetas] = await Promise.all([
      supabase.from('productos').select('*'),
      supabase.from('recetas').select('producto_id, cantidad_necesaria, insumos(*)'),
    ]);
    setProductosCatalog(resProd.data || []);
    setRecetasCatalog(resRecetas.data || []);
  }

  // --- LÓGICA DE DOBLE VERIFICACIÓN ---
  const marcarBaristaListo = async (pedido: any) => {
    const nuevoEstado =
      pedido.estado === 'pan_listo' || !necesitaPan(pedido) ? 'preparado' : 'barista_listo';
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedido.id);
    fetchPedidos();
  };

  const marcarPanListo = async (pedido: any) => {
    const nuevoEstado =
      pedido.estado === 'barista_listo' || !necesitaBarista(pedido) ? 'preparado' : 'pan_listo';
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedido.id);
    fetchPedidos();
  };

  // --- ⚙️ EJECUCIÓN DEL MOTOR KAIZEN SOBRE LOS PEDIDOS LIBERADOS DEL BARISTA ---
  const pedidosBaristaVisibles = useMemo(
    () =>
      pedidos.filter(
        (p) => p.estado !== 'barista_listo' && necesitaBarista(p) && !idsEnBuffer.includes(p.id)
      ),
    [pedidos, idsEnBuffer]
  );

  const resultadoKaizen = useMemo(
    () => optimizarComandasKaizen(pedidosBaristaVisibles),
    [pedidosBaristaVisibles]
  );

  const indicePrimerOreo = resultadoKaizen.porSeccion.frappe.findIndex(
    (n) => n.tipoLicuadora === 'oreo'
  );

  // --- 🎯 FILTRADO DEL PANEL DESLIZABLE DE RECETAS ---
  const productosFiltradosParaPanel = productosCatalog
    .filter((p) => {
      const catStr = categoriaItem(p.categoria);
      if (estacionActivaPanel === 'pan') return esPan(catStr);
      if (estacionActivaPanel === 'barista') {
        if (filtroBarista === 'Caliente') return catStr.includes('calient');
        if (filtroBarista === 'Frio') return catStr.includes('frio') || catStr.includes('frío');
        if (filtroBarista === 'Frape') return catStr.includes('frap');
      }
      return false;
    })
    .filter((p) => recetasCatalog.some((r) => r.producto_id === p.id));

  const abrirPanel = (estacion: 'barista' | 'pan') => {
    setEstacionActivaPanel(estacion);
    setPanelRecetasAbierto(true);
  };

  // Subcomponente reutilizable para cada renglón de la Vista Panorámica
  const renderFilaBebida = (nodo: NodoBebida) => (
    <div
      key={nodo.id}
      className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:border-[#CBA36A]/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-[11px] font-black bg-[#CBA36A] text-[#060B08] px-2 py-0.5 rounded-md shrink-0 mt-0.5">
            {nodo.ordenGlobal}°
          </span>
          <div>
            <p className="text-base font-bold text-white uppercase leading-tight">
              <span className="text-[#CBA36A] mr-1.5">{nodo.cantidadTotal}x</span>
              {nodo.nombre}
            </p>
            {nodo.extras && (
              <p className="text-[10px] text-[#CBA36A] font-black uppercase mt-1 bg-[#CBA36A]/10 inline-block px-2 py-0.5 rounded">
                {nodo.extras}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Etiquetas de pedidos con color sincronizado a la Ventana de Empaque */}
      <div className="flex flex-wrap items-center gap-1.5 pl-9">
        {nodo.origenes.map((orig) => (
          <span
            key={orig.pedidoIdFull}
            className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${orig.color.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${orig.color.punto}`}></span>
            #{orig.pedidoCorto} ({orig.cantidad}x)
          </span>
        ))}
      </div>
    </div>
  );

  if (cargando)
    return (
      <div className="min-h-screen bg-[#060B08] flex items-center justify-center text-[#CBA36A]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  return (
    <main className="min-h-screen bg-[#060B08] p-4 md:p-8 font-sans selection:bg-[#CBA36A] selection:text-black relative overflow-x-hidden">
      {/* ========================================== */}
      {/* 🛡️ PANEL DESLIZABLE (DRAWER) DE RECETAS   */}
      {/* ========================================== */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] transition-opacity duration-300 ${
          panelRecetasAbierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setPanelRecetasAbierto(false)}
      >
        <aside
          className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-[#0A130D] border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            panelRecetasAbierto ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`p-6 border-b flex justify-between items-center ${
              estacionActivaPanel === 'barista'
                ? 'border-[#CBA36A]/20 bg-[#CBA36A]/5'
                : 'border-orange-500/20 bg-orange-500/5'
            }`}
          >
            <div className="flex items-center gap-3">
              {estacionActivaPanel === 'barista' ? (
                <Coffee className="text-[#CBA36A]" size={24} />
              ) : (
                <Croissant className="text-orange-400" size={24} />
              )}
              <div>
                <h3
                  className={`text-xl font-serif ${
                    estacionActivaPanel === 'barista' ? 'text-[#CBA36A]' : 'text-orange-400'
                  }`}
                >
                  Recetario {estacionActivaPanel === 'barista' ? 'Barista' : 'Panadería'}
                </h3>
                <p className="text-[9px] uppercase tracking-widest text-white/40">
                  Fórmulas Oficiales Súa
                </p>
              </div>
            </div>
            <button
              onClick={() => setPanelRecetasAbierto(false)}
              className="text-white/40 hover:text-white transition-colors p-2"
            >
              <X size={20} />
            </button>
          </div>

          {estacionActivaPanel === 'barista' && (
            <div className="p-4 border-b border-white/5 bg-black/20 flex gap-2 overflow-x-auto hide-scrollbar">
              {['Caliente', 'Frio', 'Frape'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroBarista(f as any)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 transition-all ${
                    filtroBarista === f
                      ? 'bg-[#CBA36A] text-[#0A130D]'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {productosFiltradosParaPanel.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <BookOpen size={40} className="mx-auto mb-3" />
                <p className="text-xs uppercase tracking-widest font-black">
                  No hay fórmulas registradas
                </p>
              </div>
            ) : (
              productosFiltradosParaPanel.map((prod) => {
                const ingredientes = recetasCatalog.filter((r) => r.producto_id === prod.id);
                return (
                  <div
                    key={prod.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-5"
                  >
                    <h4 className="text-lg font-serif text-white mb-1">{prod.nombre}</h4>

                    <div className="mt-4 mb-4">
                      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">
                        1. Insumos requeridos
                      </p>
                      <ul className="space-y-1.5">
                        {ingredientes.map((ing, idx) => (
                          <li key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-white/70 truncate pr-2">
                              {ing.insumos?.nombre}
                            </span>
                            <span
                              className={`font-black whitespace-nowrap ${
                                estacionActivaPanel === 'barista'
                                  ? 'text-[#CBA36A]'
                                  : 'text-orange-400'
                              }`}
                            >
                              {ing.cantidad_necesaria} {ing.insumos?.unidad_medida}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {prod.instrucciones_receta && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/30 mb-2 border-b border-white/5 pb-1">
                          2. Preparación
                        </p>
                        <p className="text-[11px] text-white/60 leading-relaxed whitespace-pre-wrap italic">
                          {prod.instrucciones_receta}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
      {/* ========================================== */}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-[#CBA36A]/20 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-serif text-white">Monitor de Cocina</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">
            Súa Refugio Operativo · Motor Kaizen KDS
          </p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-full shadow-lg border border-white/5">
          <button
            onClick={() => setVista('ambas')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              vista === 'ambas' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'
            }`}
          >
            <LayoutGrid size={14} /> General
          </button>
          <button
            onClick={() => setVista('barista')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              vista === 'barista' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'
            }`}
          >
            <Coffee size={14} /> Barista
          </button>
          <button
            onClick={() => setVista('pan')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              vista === 'pan' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'
            }`}
          >
            <Croissant size={14} /> Panadería
          </button>
        </div>
      </header>

      {pedidos.length === 0 && (
        <div className="text-center py-20 opacity-30 mt-20 relative z-10">
          <Coffee size={60} className="mx-auto mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest">Sin comandas</p>
        </div>
      )}

      <div
        className={`grid grid-cols-1 ${
          vista === 'ambas' ? 'lg:grid-cols-12' : 'max-w-6xl mx-auto'
        } gap-8 relative z-10`}
      >
        {/* ☕ COLUMNA 1: ESTACIÓN BARISTA (KAIZEN KDS: PANORÁMICA + EMPAQUE) */}
        {(vista === 'ambas' || vista === 'barista') && (
          <div
            className={`space-y-6 animate-in fade-in duration-500 ${
              vista === 'ambas' ? 'lg:col-span-8' : 'w-full'
            }`}
          >
            {/* Cabecera Barista + Indicador pasivo de ventana de 30s */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-[#CBA36A]/10 p-4 rounded-2xl border border-[#CBA36A]/30">
              <div className="flex items-center gap-3">
                <Coffee className="text-[#CBA36A]" size={24} />
                <div>
                  <h2 className="text-xl font-serif text-white italic">Estación Barista</h2>
                  {segundosRestantes > 0 && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5 mt-0.5 animate-pulse">
                      <Clock size={11} /> Agrupando lote ({idsEnBuffer.length} ped.) · {segundosRestantes}s
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {resultadoKaizen.comandaOptimizada.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 bg-black/40 border border-[#CBA36A]/20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    <Zap size={12} />
                    FIFO {resultadoKaizen.estadisticas.tiempoFifoSeg}s → Kaizen{' '}
                    {resultadoKaizen.estadisticas.tiempoKaizenSeg}s
                    {resultadoKaizen.estadisticas.ahorroSegundos > 0 && (
                      <span className="text-[#CBA36A]">
                        (-{resultadoKaizen.estadisticas.ahorroSegundos}s)
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => abrirPanel('barista')}
                  className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#CBA36A] bg-[#CBA36A]/10 hover:bg-[#CBA36A] hover:text-black transition-all px-3 py-1.5 rounded-full border border-[#CBA36A]/20"
                >
                  <BookOpen size={12} /> Ver Fórmulas
                </button>
              </div>
            </div>

            {pedidosBaristaVisibles.length === 0 ? (
              <div className="bg-[#0A130D]/60 border border-dashed border-white/10 rounded-[2rem] py-14 text-center">
                <Coffee size={36} className="mx-auto mb-3 text-white/20" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                  {segundosRestantes > 0
                    ? `Recolectando órdenes en ventana inteligente (${segundosRestantes}s)...`
                    : 'Sin bebidas activas en barra'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* ZONA IZQUIERDA (70%): VISTA PANORÁMICA EN 3 SECCIONES */}
                <div className="xl:col-span-7 space-y-5">
                  {/* 🔥 SECCIÓN CALIENTE */}
                  {resultadoKaizen.porSeccion.caliente.length > 0 && (
                    <section className="bg-[#0A130D] border border-white/10 rounded-[2rem] p-5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                          <Flame size={15} /> Caliente
                        </h3>
                        <span className="text-[10px] font-black text-white/40 uppercase">
                          {resultadoKaizen.porSeccion.caliente.reduce(
                            (a, b) => a + b.cantidadTotal,
                            0
                          )}{' '}
                          vasos
                        </span>
                      </div>
                      <div className="space-y-3">
                        {resultadoKaizen.porSeccion.caliente.map(renderFilaBebida)}
                      </div>
                    </section>
                  )}

                  {/* 🧊 SECCIÓN FRÍA */}
                  {resultadoKaizen.porSeccion.fria.length > 0 && (
                    <section className="bg-[#0A130D] border border-white/10 rounded-[2rem] p-5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-sky-400 flex items-center gap-2">
                          <CupSoda size={15} /> Fría (A las rocas)
                        </h3>
                        <span className="text-[10px] font-black text-white/40 uppercase">
                          {resultadoKaizen.porSeccion.fria.reduce((a, b) => a + b.cantidadTotal, 0)}{' '}
                          vasos
                        </span>
                      </div>
                      <div className="space-y-3">
                        {resultadoKaizen.porSeccion.fria.map(renderFilaBebida)}
                      </div>
                    </section>
                  )}

                  {/* 🌪️ SECCIÓN FRAPPÉS (CON BARRERA OREO DE KAHN) */}
                  {resultadoKaizen.porSeccion.frappe.length > 0 && (
                    <section className="bg-[#0A130D] border border-white/10 rounded-[2rem] p-5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-purple-300 flex items-center gap-2">
                          <Snowflake size={15} /> Frappés (Secuencia Kahn)
                        </h3>
                        <span className="text-[10px] font-black text-white/40 uppercase">
                          {resultadoKaizen.porSeccion.frappe.reduce(
                            (a, b) => a + b.cantidadTotal,
                            0
                          )}{' '}
                          vasos
                        </span>
                      </div>
                      <div className="space-y-3">
                        {resultadoKaizen.porSeccion.frappe.map((nodo, idx) => (
                          <div key={nodo.id} className="space-y-3">
                            {resultadoKaizen.hayBarreraOreo && idx === indicePrimerOreo && (
                              <div className="flex items-center gap-2 py-1">
                                <div className="h-px flex-1 bg-[#CBA36A]/30"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#CBA36A] bg-[#CBA36A]/10 border border-[#CBA36A]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                                  <Lock size={10} /> Barrera Oreo · 0 Lavados
                                </span>
                                <div className="h-px flex-1 bg-[#CBA36A]/30"></div>
                              </div>
                            )}
                            {renderFilaBebida(nodo)}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* ZONA DERECHA (30%): VENTANA DE EMPAQUE (EXPO) CON COLORES SINCRONIZADOS */}
                <div className="xl:col-span-5 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      Ventana de Empaque ({pedidosBaristaVisibles.length})
                    </p>
                  </div>

                  {pedidosBaristaVisibles.map((p) => {
                    const color = resultadoKaizen.coloresPorPedido[String(p.id)];
                    const itemsBarista = p.items.filter((i: any) => esBebidaBarista(i));

                    return (
                      <div
                        key={`expo-${p.id}`}
                        className={`bg-[#0A130D] p-5 rounded-3xl border-2 shadow-xl transition-all ${
                          color?.borde || 'border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <p className="text-lg font-serif text-white uppercase leading-tight">
                              {p.cliente_nombre}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] text-white/50 font-black uppercase flex items-center gap-1">
                                <Clock size={10} />{' '}
                                {p.hora_recogida ? p.hora_recogida : 'Domicilio'}
                              </span>
                              {p.estado === 'pan_listo' && (
                                <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold uppercase">
                                  Pan listo ⏳
                                </span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[11px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 ${
                              color?.badge || 'bg-white/10 text-white/70 border-white/10'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${color?.punto || 'bg-white'}`}
                            ></span>
                            #{String(p.id).slice(-4).toUpperCase()}
                          </span>
                        </div>

                        <ul className="space-y-1.5 mb-4 border-t border-white/10 pt-3">
                          {itemsBarista.map((item: any, idx: number) => (
                            <li key={idx} className="text-xs text-white/80 flex flex-col">
                              <span className="font-bold uppercase">
                                {(Number(item.cantidad) || 1)}x {item.nombre}
                              </span>
                              {item.extras_str && (
                                <span className="text-[10px] text-[#CBA36A] uppercase">
                                  ↳ {item.extras_str}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => marcarBaristaListo(p)}
                          className="w-full bg-white/5 hover:bg-[#CBA36A] text-white hover:text-black py-3 rounded-xl font-black text-[10px] uppercase transition-all flex justify-center items-center gap-2 border border-white/10 hover:border-[#CBA36A]"
                        >
                          <CheckCircle2 size={15} />{' '}
                          {p.estado === 'pan_listo' ? 'Completar Orden' : 'Bebidas Listas'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🥐 COLUMNA 2: PANADERÍA (INTACTA, TIEMPO REAL SIN RETRASO) */}
        {(vista === 'ambas' || vista === 'pan') && (
          <div
            className={`space-y-6 animate-in fade-in duration-500 ${
              vista === 'ambas' ? 'lg:col-span-4' : 'w-full'
            }`}
          >
            <div className="flex justify-between items-center bg-orange-500/10 p-4 rounded-2xl border border-orange-500/30">
              <div className="flex items-center gap-3">
                <Croissant className="text-orange-400" size={24} />
                <h2 className="text-xl font-serif text-white italic">Estación Panadería</h2>
              </div>
              <button
                onClick={() => abrirPanel('pan')}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 hover:bg-orange-500 hover:text-black transition-all px-3 py-1.5 rounded-full border border-orange-500/20"
              >
                <BookOpen size={12} /> Ver Fórmulas
              </button>
            </div>

            <div className="space-y-4">
              {pedidos
                .filter((p) => p.estado !== 'pan_listo' && necesitaPan(p))
                .map((p) => {
                  const itemsPan = p.items.filter(
                    (i: any) => esPan(categoriaItem(i)) || esCombo(categoriaItem(i))
                  );

                  return (
                    <div
                      key={`p-${p.id}`}
                      className="bg-[#0A130D] border border-white/10 p-6 rounded-[2rem] shadow-xl relative"
                    >
                      <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 rounded-l-[2rem]"></div>
                      <div className="flex justify-between items-start mb-6 pl-4">
                        <div>
                          <p className="text-2xl font-serif text-white uppercase">
                            {p.cliente_nombre}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-orange-400 font-black">
                              <Clock size={12} className="inline mr-1" />
                              {p.hora_recogida ? p.hora_recogida : 'Domicilio'}
                            </p>
                            {p.estado === 'barista_listo' && (
                              <span className="text-[9px] bg-[#CBA36A]/20 text-[#CBA36A] px-2 py-0.5 rounded font-bold uppercase">
                                Barista listo, faltas tú ⏳
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-lg text-white/60">
                          #{String(p.id).slice(-4).toUpperCase()}
                        </span>
                      </div>
                      <ul className="space-y-4 mb-8 pl-4">
                        {itemsPan.map((item: any, idx: number) => (
                          <li key={idx} className="border-l border-white/20 pl-4 py-1 relative">
                            <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-orange-500"></div>
                            <p className="text-base font-bold text-white uppercase">
                              {item.cantidad > 1 ? `${item.cantidad}x ` : ''}
                              {item.nombre}
                            </p>
                            <p className="text-[10px] text-white/40 uppercase mt-1">
                              {esCombo(categoriaItem(item))
                                ? 'Preparar pan de la Promo'
                                : 'Directo de vitrina'}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => marcarPanListo(p)}
                        className="w-full bg-white/5 hover:bg-orange-500 text-white hover:text-black py-4 rounded-xl font-black text-[10px] uppercase transition-all flex justify-center items-center gap-2 border border-white/10 hover:border-orange-500"
                      >
                        <CheckCircle2 size={16} />{' '}
                        {p.estado === 'barista_listo' ? 'Completar Orden' : 'Panes Listos'}
                      </button>
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