'use client';
import LockScreen from '@/components/LockScreen';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Database, Beaker, Calculator, Plus, Trash2, 
  Package, Scale, DollarSign, Box, Loader2, ArrowRight,
  Coffee, ListOrdered, Save
} from 'lucide-react';

export default function ProduccionPage() {
  const [pestanaActiva, setPestanaActiva] = useState<'insumos' | 'recetas' | 'costos'>('insumos');
  
  // --- ESTADOS GLOBALES ---
  const [insumos, setInsumos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
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
  const [ingredientes, setIngredientes] = useState<any[]>([]); // { insumo, cantidad }
  const [insumoTemp, setInsumoTemp] = useState('');
  const [cantidadTemp, setCantidadTemp] = useState('');

  useEffect(() => {
    fetchDatosMaestros();
  }, []);

  // 📡 CARGA DE MATRIZ DE DATOS
  async function fetchDatosMaestros() {
    setCargando(true);
    const [resInsumos, resProductos] = await Promise.all([
      supabase.from('insumos').select('*').order('nombre', { ascending: true }),
      supabase.from('productos').select('*').order('categoria', { ascending: true })
    ]);
    setInsumos(resInsumos.data || []);
    setProductos(resProductos.data || []);
    setCargando(false);
  }

  // 🔄 CARGA DE RECETA EXISTENTE AL SELECCIONAR PRODUCTO
  useEffect(() => {
    async function cargarRecetaExistente() {
      if (!productoSeleccionado) {
        setInstrucciones('');
        setIngredientes([]);
        return;
      }

      // 1. Cargar instrucciones del producto
      const prod = productos.find(p => p.id === productoSeleccionado);
      setInstrucciones(prod?.instrucciones_receta || '');

      // 2. Cargar ingredientes desde la tabla relacional
      const { data: recetaDB } = await supabase
        .from('recetas')
        .select(`cantidad_necesaria, insumos (*)`)
        .eq('producto_id', productoSeleccionado);

      if (recetaDB && recetaDB.length > 0) {
        const ingMapeados = recetaDB.map(r => ({
          insumo: r.insumos,
          cantidad: r.cantidad_necesaria
        }));
        setIngredientes(ingMapeados);
      } else {
        setIngredientes([]);
      }
    }
    cargarRecetaExistente();
  }, [productoSeleccionado, productos]);


  // --- ⚙️ LÓGICA FASE 1: ALMACÉN ---
  // --- ⚙️ LÓGICA FASE 1: ALMACÉN (BLINDADO CON ZERO TRUST) ---
  const registrarInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInsumo || !cantidadEnvases || !tamanoEnvase || !costoTotalFactura) return;
    setGuardando(true);
    
    try {
      const qEnvases = Number(cantidadEnvases);
      const qTamano = Number(tamanoEnvase);
      const cTotal = Number(costoTotalFactura);

      // Ecuaciones matemáticas
      const costoPorEmpaque = cTotal / qEnvases; 
      const stockInicialTotal = qEnvases * qTamano;

      // Carga útil de datos (Payload)
      const payloadInsumo = {
        nombre: nombreInsumo.trim(),
        unidad_medida: unidadBase,
        costo_paquete: costoPorEmpaque,
        cantidad_por_paquete: qTamano,
        stock_actual: stockInicialTotal
      };

      // Transmisión al Multiplexor (API)
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'crear_insumo', 
          data: payloadInsumo 
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falla en el protocolo de servidor.');
      }

      // Limpieza de memoria
      setNombreInsumo(''); setCantidadEnvases(''); setTamanoEnvase(''); setCostoTotalFactura('');
      fetchDatosMaestros();

    } catch (error: any) {
      alert(`Falla de transmisión: ${error.message}`);
    } finally { 
      setGuardando(false); 
    }
  };

  const eliminarInsumo = async (id: string) => {
    if(!confirm('¿Purgar insumo? Destruirá los cálculos de las recetas enlazadas.')) return;
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'eliminar_insumo', 
          data: { id } 
        })
      });

      if (!res.ok) throw new Error('Acceso denegado por el servidor.');
      fetchDatosMaestros();
    } catch (error: any) {
      alert(`Error al purgar matriz: ${error.message}`);
    }
  };

  // --- ⚙️ LÓGICA FASE 2: ENSAMBLADOR DE RECETAS ---
  const agregarIngrediente = () => {
    if (!insumoTemp || !cantidadTemp) return;
    const insumoObj = insumos.find(i => i.id === insumoTemp);
    if (!insumoObj) return;

    // Verificar si ya existe en la lista para sumarlo o agregarlo nuevo
    const indexExistente = ingredientes.findIndex(ing => ing.insumo.id === insumoTemp);
    if (indexExistente >= 0) {
      const nuevaLista = [...ingredientes];
      nuevaLista[indexExistente].cantidad = Number(nuevaLista[indexExistente].cantidad) + Number(cantidadTemp);
      setIngredientes(nuevaLista);
    } else {
      setIngredientes([...ingredientes, { insumo: insumoObj, cantidad: Number(cantidadTemp) }]);
    }
    
    setInsumoTemp('');
    setCantidadTemp('');
  };

  const removerIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  // Cálculo en tiempo real del costo de la receta actual
  const costoTotalEnVivo = ingredientes.reduce((acc, ing) => {
    return acc + (Number(ing.cantidad) * Number(ing.insumo.costo_por_unidad));
  }, 0);

  const guardarReceta = async () => {
    if (!productoSeleccionado) return alert("Seleccione un producto del menú central.");
    setGuardando(true);

    try {
      // 1. Purgar la receta anterior (Limpieza de matriz)
      await supabase.from('recetas').delete().eq('producto_id', productoSeleccionado);

      // 2. Inyectar la nueva fórmula si hay ingredientes
      if (ingredientes.length > 0) {
        const payloadReceta = ingredientes.map(ing => ({
          producto_id: productoSeleccionado,
          insumo_id: ing.insumo.id,
          cantidad_necesaria: ing.cantidad
        }));
        const { error: errReceta } = await supabase.from('recetas').insert(payloadReceta);
        if (errReceta) throw errReceta;
      }

      // 3. Actualizar Producto (Instrucciones y Costo de Producción exacto)
      const { error: errProd } = await supabase.from('productos').update({
        instrucciones_receta: instrucciones,
        costo_produccion: costoTotalEnVivo
      }).eq('id', productoSeleccionado);
      
      if (errProd) throw errProd;

      alert("Fórmula guardada exitosamente en el servidor.");
      fetchDatosMaestros(); // Refrescar datos
    } catch (error: any) {
      alert(`Error en la compilación de la receta: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };


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
              MÓDULO 1: ALMACÉN (Sin cambios)
          ========================================= */}
          {pestanaActiva === 'insumos' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
               {/* Alta Insumo */}
               <section className="bg-[#0A130D] border border-[#CBA36A]/20 rounded-[2.5rem] p-8 shadow-2xl h-fit lg:col-span-1">
                 <h2 className="text-xl font-serif text-white mb-2 flex items-center gap-2"><Plus size={20} className="text-[#CBA36A]"/> Alta de Insumo</h2>
                 <form onSubmit={registrarInsumo} className="space-y-5 mt-6">
                     <div>
                       <label className="text-[10px] font-black uppercase text-white/50 mb-2 block">Nombre del Insumo</label>
                       <input required type="text" placeholder="Ej: Leche Santa Clara Entera" value={nombreInsumo} onChange={e=>setNombreInsumo(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-[10px] font-black uppercase text-white/50 mb-2 block">Cajas / Envases</label>
                          <div className="relative">
                            <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input required type="number" placeholder="Ej: 12" value={cantidadEnvases} onChange={e=>setCantidadEnvases(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 pl-9 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white" />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-white/50 mb-2 block">Costo Factura</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CBA36A]" />
                            <input required type="number" step="0.01" placeholder="250.00" value={costoTotalFactura} onChange={e=>setCostoTotalFactura(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 pl-9 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white font-serif" />
                          </div>
                       </div>
                     </div>
                     <div className="bg-[#101C13] border border-white/5 p-4 rounded-2xl">
                       <label className="text-[10px] font-black uppercase text-[#CBA36A]/70 mb-3 block flex items-center gap-2"><Scale size={14}/> Medida de cada envase</label>
                       <div className="flex gap-2">
                         <input required type="number" placeholder="Ej: 1000" value={tamanoEnvase} onChange={e=>setTamanoEnvase(e.target.value)} className="w-2/3 bg-black/60 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white font-serif" />
                         <select value={unidadBase} onChange={e=>setUnidadBase(e.target.value as any)} className="w-1/3 bg-black/60 border border-white/10 p-3 rounded-xl text-xs outline-none text-white font-black uppercase cursor-pointer text-center">
                           <option value="ml">ml</option><option value="g">g</option><option value="pz">pz</option>
                         </select>
                       </div>
                     </div>
                     <button disabled={guardando} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 active:scale-95 transition-all mt-2 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(203,163,106,0.3)]">
                       {guardando ? <Loader2 size={16} className="animate-spin" /> : 'Registrar en Almacén'}
                     </button>
                 </form>
               </section>
 
               {/* Radar Almacén */}
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
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                
                {/* Panel Izquierdo: Selección y Pasos */}
                <section className="bg-[#0A130D] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-5 flex flex-col h-full">
                  <div className="mb-8 border-b border-white/10 pb-6">
                     <label className="text-[10px] font-black uppercase text-[#CBA36A] mb-3 block flex items-center gap-2"><Coffee size={14}/> Producto a Diseñar</label>
                     <select 
                       value={productoSeleccionado} 
                       onChange={(e) => setProductoSeleccionado(e.target.value)}
                       className="w-full bg-[#101C13] border border-white/20 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-[#CBA36A] cursor-pointer"
                     >
                        <option value="" disabled>-- Seleccione un Producto --</option>
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
                      placeholder="Ej:&#10;1. Extraer shot doble de espresso.&#10;2. Emulsionar 200ml de leche a 65°C.&#10;3. Verter latte art."
                      className="w-full flex-1 bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-white/80 outline-none focus:border-[#CBA36A] min-h-[250px] resize-none"
                    />
                  </div>
                </section>

                {/* Panel Derecho: Laboratorio Químico (Insumos) */}
                <section className="bg-[#0A130D] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-7 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CBA36A] to-transparent opacity-30"></div>
                  
                  <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><Beaker size={20} className="text-[#CBA36A]"/> Matriz de Ingredientes</h2>
                  
                  {/* Selector para añadir Insumo */}
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
                        type="number" placeholder="Cantidad" 
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

                  {/* Lista de Ingredientes en la Receta */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 mb-8 min-h-[200px]">
                    {!productoSeleccionado ? (
                       <div className="h-full flex flex-col items-center justify-center opacity-30">
                         <ArrowRight size={40} className="mb-2 text-[#CBA36A]" />
                         <p className="text-sm">Seleccione un producto a la izquierda para comenzar.</p>
                       </div>
                    ) : ingredientes.length === 0 ? (
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

                  {/* Dashboard de Guardado */}
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
          )}

          {/* =========================================
              MÓDULO 3: INTELIGENCIA DE COSTOS (Pendiente)
          ========================================= */}
          {pestanaActiva === 'costos' && (
             <div className="bg-[#0A130D] border border-dashed border-white/20 rounded-[3rem] p-16 text-center opacity-40 flex flex-col items-center justify-center animate-in fade-in duration-500">
               <Calculator size={64} className="text-white/50 mb-6" />
               <h3 className="text-3xl font-serif text-white mb-4">Motor Financiero de Costos</h3>
               <p className="text-sm w-full max-w-lg mx-auto leading-relaxed text-white/70">
                 Este módulo revelará su porcentaje de ganancia real basado en las fórmulas estructuradas en el ensamblador. Se activará tras completar la Fase 2 (Recetas).
               </p>
             </div>
          )}

        </div>
      </main>
    </LockScreen>
  );
}