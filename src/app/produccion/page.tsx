'use client';
import LockScreen from '@/components/LockScreen';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Database, Beaker, Calculator, Plus, Trash2, 
  Package, Scale, DollarSign, Box, Loader2, ArrowRight,
  Coffee, ListOrdered, Save, TrendingUp, TrendingDown, BookOpen
} from 'lucide-react';

export default function ProduccionPage() {
  const [pestanaActiva, setPestanaActiva] = useState<'insumos' | 'recetas' | 'costos'>('insumos');
  
  // --- ESTADOS GLOBALES ---
  const [insumos, setInsumos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [recetasGlobales, setRecetasGlobales] = useState<any[]>([]); // Memoria caché de fórmulas
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // --- ESTADOS: FASE 1 (ALMACÉN) ---
  const [nombreInsumo, setNombreInsumo] = useState('');
  const [unidadBase, setUnidadBase] = useState<'ml' | 'g' | 'pz'>('ml');
  const [cantidadEnvases, setCantidadEnvases] = useState('');
  const [tamanoEnvase, setTamanoEnvase] = useState('');
  const [costoTotalFactura, setCostoTotalFactura] = useState('');

  // --- ESTADOS: FASE 2 (RECETAS) ---
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [ingredientes, setIngredientes] = useState<any[]>([]); 
  const [insumoTemp, setInsumoTemp] = useState('');
  const [cantidadTemp, setCantidadTemp] = useState('');

  useEffect(() => {
    fetchDatosMaestros();
  }, []);

  // 📡 CARGA DE MATRIZ DE DATOS (Optimizada para evitar N+1 queries)
  async function fetchDatosMaestros() {
    setCargando(true);
    const [resInsumos, resProductos, resRecetas] = await Promise.all([
      supabase.from('insumos').select('*').order('nombre', { ascending: true }),
      supabase.from('productos').select('*').order('categoria', { ascending: true }),
      supabase.from('recetas').select('producto_id, cantidad_necesaria, insumos(*)') // Cruce relacional
    ]);
    
    setInsumos(resInsumos.data || []);
    setProductos(resProductos.data || []);
    setRecetasGlobales(resRecetas.data || []);
    setCargando(false);
  }

  // 🔄 CARGA INSTANTÁNEA DE RECETA DESDE MEMORIA CACHÉ
  useEffect(() => {
    if (!productoSeleccionado) {
      setInstrucciones('');
      setIngredientes([]);
      return;
    }
    
    const prod = productos.find(p => p.id === productoSeleccionado);
    setInstrucciones(prod?.instrucciones_receta || '');

    // Filtramos desde la matriz descargada en lugar de hacer otra petición a la base de datos
    const recetaActual = recetasGlobales.filter(r => r.producto_id === productoSeleccionado);
    
    if (recetaActual.length > 0) {
      setIngredientes(recetaActual.map(r => ({
        insumo: r.insumos,
        cantidad: r.cantidad_necesaria
      })));
    } else {
      setIngredientes([]);
    }
  }, [productoSeleccionado, productos, recetasGlobales]);

  // --- ⚙️ LÓGICA FASE 1: ALMACÉN (Zero Trust API) ---
  const registrarInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInsumo || !cantidadEnvases || !tamanoEnvase || !costoTotalFactura) return;
    setGuardando(true);
    
    try {
      const qEnvases = Number(cantidadEnvases);
      const qTamano = Number(tamanoEnvase);
      const cTotal = Number(costoTotalFactura);

      const costoPorEmpaque = cTotal / qEnvases; 
      const stockInicialTotal = qEnvases * qTamano;

      const payloadInsumo = {
        nombre: nombreInsumo.trim(),
        unidad_medida: unidadBase,
        costo_paquete: costoPorEmpaque,
        cantidad_por_paquete: qTamano,
        stock_actual: stockInicialTotal
      };

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'crear_insumo', data: payloadInsumo })
      });

      if (!res.ok) throw new Error('Falla en el puente del servidor.');

      setNombreInsumo(''); setCantidadEnvases(''); setTamanoEnvase(''); setCostoTotalFactura('');
      fetchDatosMaestros();
    } catch (error: any) {
      alert(`Falla de transmisión: ${error.message}`);
    } finally { setGuardando(false); }
  };

  const eliminarInsumo = async (id: string) => {
    if(!confirm('¿Purgar insumo? Destruirá los cálculos de recetas enlazadas.')) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'eliminar_insumo', data: { id } })
      });
      if (!res.ok) throw new Error('Acceso denegado por el servidor.');
      fetchDatosMaestros();
    } catch (error: any) {
      alert(`Error al purgar matriz: ${error.message}`);
    }
  };

  // --- ⚙️ LÓGICA FASE 2: ENSAMBLADOR DE RECETAS (Zero Trust API) ---
  const agregarIngrediente = () => {
    if (!insumoTemp || !cantidadTemp) return;
    const insumoObj = insumos.find(i => i.id === insumoTemp);
    if (!insumoObj) return;

    const indexExistente = ingredientes.findIndex(ing => ing.insumo.id === insumoTemp);
    if (indexExistente >= 0) {
      const nuevaLista = [...ingredientes];
      nuevaLista[indexExistente].cantidad = Number(nuevaLista[indexExistente].cantidad) + Number(cantidadTemp);
      setIngredientes(nuevaLista);
    } else {
      setIngredientes([...ingredientes, { insumo: insumoObj, cantidad: Number(cantidadTemp) }]);
    }
    setInsumoTemp(''); setCantidadTemp('');
  };

  const removerIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const costoTotalEnVivo = ingredientes.reduce((acc, ing) => {
    return acc + (Number(ing.cantidad) * Number(ing.insumo.costo_por_unidad));
  }, 0);

  const guardarReceta = async () => {
    if (!productoSeleccionado) return alert("Seleccione un producto.");
    setGuardando(true);

    try {
      const ingredientesPayload = ingredientes.map(ing => ({
        insumo_id: ing.insumo.id,
        cantidad: ing.cantidad
      }));

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guardar_receta',
          data: {
            producto_id: productoSeleccionado,
            ingredientes: ingredientesPayload,
            instrucciones: instrucciones,
            costo_total: costoTotalEnVivo
          }
        })
      });

      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.error || 'Rechazo en el puente del servidor.');
      }

      alert("Fórmula guardada exitosamente bajo protocolo blindado.");
      fetchDatosMaestros(); // Recarga la matriz global para actualizar las tarjetas inferiores
    } catch (error: any) {
      alert(`Error en compilación: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Generador de matriz de productos filtrados (Solo los que tienen receta real en la base de datos)
  const productosConReceta = productos.filter(p => recetasGlobales.some(r => r.producto_id === p.id));

  return (
    <LockScreen titulo="ERP Producción Súa">
      <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-4 md:p-10 font-sans relative overflow-x-hidden">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8 pb-20">
          
          {/* HEADER Y NAVEGACIÓN */}
          <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#CBA36A]/20 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-white">Ingeniería de Producción</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">Estructuración y Costeos Exactos</p>
            </div>
            <div className="flex bg-[#0A130D] p-1.5 rounded-full border border-white/10 shadow-lg overflow-x-auto w-full md:w-auto">
              <button onClick={() => setPestanaActiva('insumos')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'insumos' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Database size={14} /> Almacén</button>
              <button onClick={() => setPestanaActiva('recetas')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'recetas' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Beaker size={14} /> Ensamblador</button>
              <button onClick={() => setPestanaActiva('costos')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'costos' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Calculator size={14} /> Costos</button>
            </div>
          </header>

          {/* =========================================
              MÓDULO 1: ALMACÉN
          ========================================= */}
          {pestanaActiva === 'insumos' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
               <section className="bg-[#0A130D] border border-[#CBA36A]/20 rounded-[2.5rem] p-8 shadow-2xl h-fit lg:col-span-1">
                 <h2 className="text-xl font-serif text-white mb-2 flex items-center gap-2"><Plus size={20} className="text-[#CBA36A]"/> Alta de Insumo</h2>
                 <form onSubmit={registrarInsumo} className="space-y-5 mt-6">
                     <div>
                       <label className="text-[10px] font-black uppercase text-white/50 mb-2 block">Nombre</label>
                       <input required type="text" value={nombreInsumo} onChange={e=>setNombreInsumo(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-[10px] font-black uppercase text-white/50 mb-2 block">Envases</label>
                          <div className="relative">
                            <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input required type="number" value={cantidadEnvases} onChange={e=>setCantidadEnvases(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 pl-9 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white" />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-white/50 mb-2 block">Factura</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CBA36A]" />
                            <input required type="number" step="0.01" value={costoTotalFactura} onChange={e=>setCostoTotalFactura(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 pl-9 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white font-serif" />
                          </div>
                       </div>
                     </div>
                     <div className="bg-[#101C13] border border-white/5 p-4 rounded-2xl">
                       <label className="text-[10px] font-black uppercase text-[#CBA36A]/70 mb-3 block flex items-center gap-2"><Scale size={14}/> Medida unitaria</label>
                       <div className="flex gap-2">
                         <input required type="number" value={tamanoEnvase} onChange={e=>setTamanoEnvase(e.target.value)} className="w-2/3 bg-black/60 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white font-serif" />
                         <select value={unidadBase} onChange={e=>setUnidadBase(e.target.value as any)} className="w-1/3 bg-black/60 border border-white/10 p-3 rounded-xl text-xs outline-none text-white font-black uppercase cursor-pointer">
                           <option value="ml">ml</option><option value="g">g</option><option value="pz">pz</option>
                         </select>
                       </div>
                     </div>
                     <button disabled={guardando} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 active:scale-95 transition-all mt-2 flex justify-center items-center gap-2">
                       {guardando ? <Loader2 size={16} className="animate-spin" /> : 'Registrar en Almacén'}
                     </button>
                 </form>
               </section>
 
               <section className="bg-[#0A130D] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-2 flex flex-col">
                 <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-3"><Box size={24} className="text-[#CBA36A]"/> Inventario Maestro</h2>
                 <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[600px]">
                     {insumos.map(insumo => (
                       <div key={insumo.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 flex justify-between items-center group">
                         <div>
                           <p className="text-base font-bold text-white mb-1">{insumo.nombre}</p>
                           <p className="text-[10px] text-white/40 uppercase tracking-widest">
                             Costeado a ${Number(insumo.costo_paquete).toFixed(2)} por empaque de {insumo.cantidad_por_paquete}{insumo.unidad_medida}
                           </p>
                         </div>
                         <div className="flex items-center gap-6 bg-[#101C13] p-3 rounded-xl border border-white/5">
                           <div>
                             <p className="text-[9px] text-[#CBA36A]/60 font-black uppercase tracking-widest mb-1 text-right">Costo Atómico</p>
                             <p className="font-serif text-[#CBA36A] text-xl leading-none">${Number(insumo.costo_por_unidad).toFixed(4)} <span className="text-[10px] opacity-50">/ {insumo.unidad_medida}</span></p>
                           </div>
                           <button onClick={()=>eliminarInsumo(insumo.id)} className="text-red-900 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                         </div>
                       </div>
                     ))}
                 </div>
               </section>
             </div>
          )}

          {/* =========================================
              MÓDULO 2: ENSAMBLADOR DE RECETAS
          ========================================= */}
          {pestanaActiva === 'recetas' && (
             <div className="animate-in fade-in duration-500 flex flex-col gap-8">
               
               {/* PANELES DE ENSAMBLAJE (Superior) */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <section className="bg-[#0A130D] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-5 flex flex-col h-full">
                    <div className="mb-8 border-b border-white/10 pb-6">
                       <label className="text-[10px] font-black uppercase text-[#CBA36A] mb-3 block flex items-center gap-2"><Coffee size={14}/> Producto a Diseñar</label>
                       <select 
                         value={productoSeleccionado} 
                         onChange={(e) => setProductoSeleccionado(e.target.value)}
                         className="w-full bg-[#101C13] border border-white/20 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-[#CBA36A] cursor-pointer"
                       >
                          <option value="">-- Seleccione un Producto --</option>
                          {productos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>
                          ))}
                       </select>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="text-[10px] font-black uppercase text-white/50 mb-3 block flex items-center gap-2"><ListOrdered size={14}/> Instrucciones para el Barista</label>
                      <textarea 
                        disabled={!productoSeleccionado}
                        value={instrucciones}
                        onChange={(e) => setInstrucciones(e.target.value)}
                        className="w-full flex-1 bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-white/80 outline-none focus:border-[#CBA36A] min-h-[200px] resize-none"
                      />
                    </div>
                  </section>

                  <section className="bg-[#0A130D] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-7 flex flex-col h-full relative overflow-hidden">
                    <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><Beaker size={20} className="text-[#CBA36A]"/> Matriz de Ingredientes</h2>
                    
                    <div className="bg-[#101C13] p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-3 mb-8">
                      <div className="flex-1">
                        <select 
                          disabled={!productoSeleccionado}
                          value={insumoTemp} onChange={e=>setInsumoTemp(e.target.value)} 
                          className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm text-white outline-none focus:border-[#CBA36A]"
                        >
                           <option value="">Buscar insumo...</option>
                           {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                        </select>
                      </div>
                      <div className="w-full md:w-32 relative">
                        <input 
                          disabled={!productoSeleccionado}
                          type="number" placeholder="Cant." 
                          value={cantidadTemp} onChange={e=>setCantidadTemp(e.target.value)}
                          className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm text-white outline-none focus:border-[#CBA36A] text-right pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 uppercase">
                          {insumos.find(i => i.id === insumoTemp)?.unidad_medida || 'U'}
                        </span>
                      </div>
                      <button 
                        disabled={!productoSeleccionado || !insumoTemp || !cantidadTemp}
                        onClick={agregarIngrediente}
                        className="bg-[#CBA36A] text-black px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-yellow-500 transition-colors disabled:opacity-50"
                      >
                        Añadir
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 mb-8 min-h-[150px]">
                      {ingredientes.length === 0 ? (
                         <div className="h-full flex items-center justify-center opacity-30 text-sm italic">Fórmula vacía. Añada insumos.</div>
                      ) : (
                        ingredientes.map((ing, index) => {
                          const costoLinear = Number(ing.cantidad) * Number(ing.insumo.costo_por_unidad);
                          return (
                            <div key={index} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <button onClick={()=>removerIngrediente(index)} className="text-red-900 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                <p className="text-sm text-white font-bold">{ing.insumo.nombre}</p>
                                <span className="bg-[#CBA36A]/10 text-[#CBA36A] px-2 py-0.5 rounded text-[10px] font-black">{ing.cantidad} {ing.insumo.unidad_medida}</span>
                              </div>
                              <span className="font-serif text-[#CBA36A] opacity-70">${costoLinear.toFixed(2)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="bg-[#CBA36A] p-5 rounded-[2rem] shadow-inner flex flex-col md:flex-row justify-between items-center gap-4">
                       <div>
                          <p className="text-[10px] text-black/60 font-black uppercase tracking-widest mb-1">Costo de Producción Actual</p>
                          <p className="text-4xl font-serif text-black font-bold tracking-tighter">${costoTotalEnVivo.toFixed(2)}</p>
                       </div>
                       <button 
                         disabled={!productoSeleccionado || guardando}
                         onClick={guardarReceta}
                         className="w-full md:w-auto bg-[#0A130D] text-[#CBA36A] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                       >
                         {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                         Salvar Fórmula
                       </button>
                    </div>
                  </section>
               </div>

               {/* DIRECTORIO DE RECETAS GUARDADAS CON DESGLOSE DE INGREDIENTES */}
               {/* DIRECTORIO DE RECETAS GUARDADAS CON DESGLOSE DE INGREDIENTES Y PASOS */}
               <section className="bg-[#0A130D] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                  <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><BookOpen size={20} className="text-[#CBA36A]"/> Base de Datos de Fórmulas Activas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {productosConReceta.length === 0 ? (
                        <p className="text-white/40 text-sm italic col-span-full">Aún no hay recetas estructuradas en el sistema maestro.</p>
                     ) : (
                        productosConReceta.map(prod => {
                           const ingredientesDeEsteProducto = recetasGlobales.filter(r => r.producto_id === prod.id);
                           return (
                             <div 
                               key={prod.id} 
                               onClick={() => setProductoSeleccionado(prod.id)} 
                               className="bg-[#101C13] p-5 rounded-2xl border border-white/5 hover:border-[#CBA36A]/50 hover:bg-[#CBA36A]/5 cursor-pointer transition-all group flex flex-col gap-4"
                             >
                                <div className="flex justify-between items-start">
                                   <div>
                                      <p className="text-sm font-bold text-white group-hover:text-[#CBA36A] transition-colors">{prod.nombre}</p>
                                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{prod.categoria}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[9px] text-[#CBA36A]/60 font-black uppercase tracking-widest mb-0.5">Costo</p>
                                      <p className="text-sm font-serif text-white/80">${Number(prod.costo_produccion).toFixed(2)}</p>
                                   </div>
                                </div>
                                
                                {/* Desglose visual de insumos */}
                                <div className="pt-3 border-t border-white/5">
                                   <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-2">Fórmula Analítica:</p>
                                   <ul className="space-y-1">
                                      {ingredientesDeEsteProducto.map((ing, idx) => (
                                         <li key={idx} className="text-[10px] text-white/60 flex justify-between">
                                            <span className="truncate pr-2">{ing.insumos?.nombre}</span>
                                            <span className="text-[#CBA36A] whitespace-nowrap">{ing.cantidad_necesaria} {ing.insumos?.unidad_medida}</span>
                                         </li>
                                      ))}
                                   </ul>
                                </div>

                                {/* Desglose visual de instrucciones (NUEVO BLOQUE) */}
                                {prod.instrucciones_receta && (
                                   <div className="pt-3 border-t border-white/5">
                                      <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                         <ListOrdered size={10} /> Secuencia Operativa:
                                      </p>
                                      <p className="text-[10px] text-white/50 italic leading-relaxed max-h-24 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                                         {prod.instrucciones_receta}
                                      </p>
                                   </div>
                                )}
                             </div>
                           )
                        })
                     )}
                  </div>
               </section>

             </div>
          )}

          {/* =========================================
              MÓDULO 3: INTELIGENCIA DE COSTOS (CORREGIDO precio_venta)
          ========================================= */}
          {pestanaActiva === 'costos' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               <section className="bg-[#0A130D] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                 <div className="mb-8 border-b border-white/5 pb-6">
                   <h2 className="text-2xl font-serif text-white mb-2 flex items-center gap-3"><Calculator size={24} className="text-[#CBA36A]"/> Análisis de Rentabilidad</h2>
                   <p className="text-xs text-white/50">Métricas calculadas en tiempo real a partir del costo atómico de producción.</p>
                 </div>
       
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {productos.filter(p => Number(p.costo_produccion) > 0).length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-40 border border-dashed border-white/10 rounded-3xl">
                         <Calculator size={48} className="mb-4 text-[#CBA36A]" />
                         <p className="text-sm font-bold uppercase tracking-widest">Sin datos de rentabilidad</p>
                         <p className="text-xs mt-2">Utilice el Ensamblador de Recetas para activar este módulo.</p>
                      </div>
                   ) : (
                     productos.filter(p => Number(p.costo_produccion) > 0).map(prod => {
                       // CORRECCIÓN APLICADA: Ahora lee la columna exacta 'precio_venta'
                       const precioVenta = Number(prod.precio_venta) || 0; 
                       const costoProduccion = Number(prod.costo_produccion);
                       const utilidadNeta = precioVenta - costoProduccion;
                       const margen = precioVenta > 0 ? (utilidadNeta / precioVenta) * 100 : 0;
                       
                       const alertaRoja = margen < 40; 
       
                       return (
                         <div key={prod.id} className={`bg-black/40 p-6 rounded-3xl border ${alertaRoja ? 'border-red-900/50 shadow-[0_0_15px_rgba(127,29,29,0.2)]' : 'border-white/5'} flex flex-col relative overflow-hidden transition-all hover:border-[#CBA36A]/50`}>
                           <div className="flex justify-between items-start mb-6 z-10 border-b border-white/5 pb-4">
                             <div>
                               <p className="text-lg font-bold text-white leading-tight">{prod.nombre}</p>
                               <span className="text-[9px] uppercase tracking-widest text-[#CBA36A] bg-[#CBA36A]/10 px-2 py-0.5 rounded border border-[#CBA36A]/20 mt-2 inline-block">{prod.categoria}</span>
                             </div>
                             {alertaRoja ? <TrendingDown size={24} className="text-red-500" /> : <TrendingUp size={24} className="text-green-500" />}
                           </div>
       
                           <div className="space-y-4 z-10 flex-1">
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">Precio Venta:</span>
                               <span className="text-white font-serif text-lg">${precioVenta.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">Producción:</span>
                               <span className="text-red-400 font-serif text-lg">-${costoProduccion.toFixed(2)}</span>
                             </div>
                           </div>

                           <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-end bg-[#101C13] -mx-6 -mb-6 p-6">
                             <div>
                               <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-1">Utilidad Libre</p>
                               <p className="text-2xl text-[#CBA36A] font-serif font-bold">${utilidadNeta.toFixed(2)}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-1">Margen %</p>
                               <p className={`text-2xl font-black ${alertaRoja ? 'text-red-500' : 'text-green-500'}`}>{margen.toFixed(1)}%</p>
                             </div>
                           </div>
                         </div>
                       )
                     })
                   )}
                 </div>
               </section>
             </div>
          )}
        </div>
      </main>
    </LockScreen>
  );
}