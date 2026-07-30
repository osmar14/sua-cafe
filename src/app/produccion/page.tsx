'use client';
import LockScreen from '@/components/LockScreen';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Database, Beaker, Calculator, Plus, Trash2, 
  Package, Scale, DollarSign, Box, Loader2, ArrowRight
} from 'lucide-react';

export default function ProduccionPage() {
  const [pestanaActiva, setPestanaActiva] = useState<'insumos' | 'recetas' | 'costos'>('insumos');
  
  // Estados de Base de Datos
  const [insumos, setInsumos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Formulario del Motor de Normalización (Almacén)
  const [nombre, setNombre] = useState('');
  const [unidadBase, setUnidadBase] = useState<'ml' | 'g' | 'pz'>('ml');
  const [cantidadEnvases, setCantidadEnvases] = useState('');
  const [tamanoEnvase, setTamanoEnvase] = useState('');
  const [costoTotalFactura, setCostoTotalFactura] = useState('');

  useEffect(() => {
    fetchInsumos();
  }, []);

  async function fetchInsumos() {
    setCargando(true);
    const { data } = await supabase.from('insumos').select('*').order('nombre', { ascending: true });
    setInsumos(data || []);
    setCargando(false);
  }

  // --- 🧠 MOTOR DE NORMALIZACIÓN ATÓMICA ---
  const registrarInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !cantidadEnvases || !tamanoEnvase || !costoTotalFactura) return;
    setGuardando(true);

    try {
      const qEnvases = Number(cantidadEnvases);
      const qTamano = Number(tamanoEnvase);
      const cTotal = Number(costoTotalFactura);

     // Ecuaciones de Costeo Exacto
      const costoPorEmpaque = cTotal / qEnvases; 
      const stockInicialTotal = qEnvases * qTamano;
      
      // La variable 'costoAtomico' calculada en React ya no es necesaria aquí,
      // la base de datos ejecutará el cálculo de manera autónoma.

      const { error } = await supabase.from('insumos').insert([{
        nombre: nombre.trim(),
        unidad_medida: unidadBase,
        costo_paquete: costoPorEmpaque,
        cantidad_por_paquete: qTamano,
        // costo_por_unidad: costoAtomico,  <-- LÍNEA ELIMINADA PARA EVITAR EL CHOQUE DE AUTORIDAD
        stock_actual: stockInicialTotal
      }]);

      if (error) throw error;

      // Reset y recarga
      setNombre(''); setCantidadEnvases(''); setTamanoEnvase(''); setCostoTotalFactura('');
      fetchInsumos();
    } catch (error: any) {
      alert(`Falla en la matriz de almacenamiento: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarInsumo = async (id: string) => {
    if(!confirm('¿Purgar este insumo del almacén? Esto podría afectar recetas existentes.')) return;
    await supabase.from('insumos').delete().eq('id', id);
    fetchInsumos();
  };

  return (
    <LockScreen titulo="ERP Producción Súa">
      <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-4 md:p-10 font-sans relative overflow-x-hidden">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-8 pb-20">
          
          {/* HEADER Y NAVEGACIÓN TÁCTICA */}
          <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#CBA36A]/20 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-white">Ingeniería de Producción</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">Estructuración y Costeos Exactos</p>
            </div>
            
            <div className="flex bg-[#0A130D] p-1.5 rounded-full border border-white/10 shadow-lg overflow-x-auto w-full md:w-auto">
              <button onClick={() => setPestanaActiva('insumos')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'insumos' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Database size={14} /> Almacén Materia Prima</button>
              <button onClick={() => setPestanaActiva('recetas')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'recetas' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Beaker size={14} /> Ensamblador Recetas</button>
              <button onClick={() => setPestanaActiva('costos')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'costos' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Calculator size={14} /> Inteligencia de Costos</button>
            </div>
          </header>

          {/* =========================================
              MÓDULO 1: ALMACÉN (Insumos Base)
          ========================================= */}
          {pestanaActiva === 'insumos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
              
              {/* CREADOR DE INSUMOS (Calculadora Atómica) */}
              <section className="bg-[#0A130D] border border-[#CBA36A]/20 rounded-[2.5rem] p-8 shadow-2xl h-fit lg:col-span-1">
                <h2 className="text-xl font-serif text-white mb-2 flex items-center gap-2"><Plus size={20} className="text-[#CBA36A]"/> Alta de Insumo</h2>
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-6">El procesador calculará el costo atómico automáticamente.</p>
                
                <form onSubmit={registrarInsumo} className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/50 mb-2 block">Nombre del Insumo</label>
                      <input required type="text" placeholder="Ej: Leche Santa Clara Entera" value={nombre} onChange={e=>setNombre(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white" />
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
                          <option value="ml">Mililitros</option>
                          <option value="g">Gramos</option>
                          <option value="pz">Piezas</option>
                        </select>
                      </div>
                    </div>

                    <button disabled={guardando} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 active:scale-95 transition-all mt-2 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(203,163,106,0.3)]">
                      {guardando ? <Loader2 size={16} className="animate-spin" /> : 'Registrar en Almacén'}
                    </button>
                </form>
              </section>

              {/* RADAR DE INVENTARIO (Listado) */}
              <section className="bg-[#0A130D] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-2 flex flex-col">
                <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-3"><Box size={24} className="text-[#CBA36A]"/> Inventario Maestro</h2>
                
                {cargando ? (
                   <div className="flex-1 flex justify-center items-center opacity-50"><Loader2 size={32} className="text-[#CBA36A] animate-spin" /></div>
                ) : insumos.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center py-10">
                     <Package size={48} className="mb-4" />
                     <p className="text-sm font-bold uppercase tracking-widest">Almacén Vacío</p>
                     <p className="text-xs max-w-xs mt-2">Ingrese su primera factura de materia prima para activar el motor de cálculos.</p>
                   </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[600px]">
                    {insumos.map(insumo => (
                      <div key={insumo.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                        
                        <div className="flex-1">
                          <p className="text-base font-bold text-white mb-1 flex items-center gap-2">
                            {insumo.nombre} 
                            <span className="bg-[#CBA36A]/20 text-[#CBA36A] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-[#CBA36A]/30">Stock: {insumo.stock_actual} {insumo.unidad_medida}</span>
                          </p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">
                            Costeado a ${Number(insumo.costo_paquete).toFixed(2)} por empaque de {insumo.cantidad_por_paquete}{insumo.unidad_medida}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-6 bg-[#101C13] p-3 rounded-xl border border-white/5 w-full md:w-auto justify-between md:justify-start">
                          <div>
                            <p className="text-[9px] text-[#CBA36A]/60 font-black uppercase tracking-widest mb-1 text-right">Costo Atómico</p>
                            <div className="flex items-end gap-1">
                               <span className="font-serif text-[#CBA36A] text-xl leading-none">${Number(insumo.costo_por_unidad).toFixed(4)}</span>
                               <span className="text-[10px] opacity-50 mb-0.5">/ {insumo.unidad_medida}</span>
                            </div>
                          </div>
                          <button onClick={()=>eliminarInsumo(insumo.id)} className="text-red-900 hover:text-red-500 bg-red-900/10 hover:bg-red-500/20 p-2.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                            <Trash2 size={16}/>
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* PESTAÑAS PENDIENTES (Constructores visuales) */}
          {pestanaActiva === 'recetas' && (
             <div className="bg-[#0A130D] border border-dashed border-[#CBA36A]/30 rounded-[3rem] p-16 text-center opacity-60 flex flex-col items-center justify-center animate-in fade-in duration-500">
               <Beaker size={64} className="text-[#CBA36A] mb-6 animate-pulse" />
               <h3 className="text-3xl font-serif text-white mb-4">Ensamblador de Recetas</h3>
               <p className="text-sm w-full max-w-lg mx-auto leading-relaxed text-white/70">
                 Fase 1 completada. La materia prima está fluyendo. Siguiente paso: Desarrollaremos la interfaz visual donde ensamblaremos los productos del menú (Ej. Latte) con los insumos (Leche, Café) y escribiremos los pasos para los baristas.
               </p>
               <div className="mt-8 bg-[#CBA36A]/10 text-[#CBA36A] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#CBA36A]/30 flex items-center gap-2">
                 Esperando instrucciones <ArrowRight size={14} />
               </div>
             </div>
          )}

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