'use client';
import LockScreen from '@/components/LockScreen';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, Wallet, CreditCard, Plus, Trash2, 
  ArrowDownCircle, Percent, Calculator, Target, 
  PieChart, Shield, Megaphone, TrendingUp, Users,
  Activity, BarChart3, Database, Beaker
} from 'lucide-react';

export default function FinanzasPage() {
  // 🛡️ NAVEGACIÓN TÁCTICA
  const [pestanaActiva, setPestanaActiva] = useState<'radar' | 'analitica' | 'ingenieria'>('radar');

  const [ventasHoy, setVentasHoy] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [gastosHoy, setGastosHoy] = useState<any[]>([]);
  const [todasLasVentas, setTodasLasVentas] = useState<any[]>([]);
  
  // Formulario Compras/Deudas
  const [nombreItem, setNombreItem] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [numMeses, setNumMeses] = useState('0'); 

  // Simulador Estratégico
  const [diasTrabajoSemana, setDiasTrabajoSemana] = useState('4');
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('50');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const hoy = new Date().toISOString().split('T')[0];
    const { data: vHoy } = await supabase.from('pedidos').select('*').gte('created_at', hoy);
    const { data: gHoy } = await supabase.from('gastos').select('*').gte('created_at', hoy);
    const { data: vTodas } = await supabase.from('pedidos').select('*');
    const { data: p } = await supabase.from('productos').select('*');
    const { data: d } = await supabase.from('deudas').select('*');

    setVentasHoy(vHoy || []); setGastosHoy(gHoy || []); setTodasLasVentas(vTodas || []);
    setProductos(p || []); setDeudas(d || []);
  }

  const registrarCompra = async (e: any) => {
    e.preventDefault();
    if(!nombreItem || !montoTotal) return;

    const meses = Number(numMeses);
    if (meses === 0) {
      await supabase.from('gastos').insert([{ descripcion: nombreItem, monto: Number(montoTotal) }]);
    } else {
      await supabase.from('deudas').insert([{ descripcion: nombreItem, monto_total: Number(montoTotal), cuotas_totales: meses }]);
    }
    setNombreItem(''); setMontoTotal(''); setNumMeses('0'); fetchData();
  };

  const eliminarDeuda = async (id: string) => {
    if(confirm("¿Eliminar este pasivo de los libros?")) {
      await supabase.from('deudas').delete().eq('id', id); fetchData();
    }
  };

  // --- 🧠 MOTOR MATEMÁTICO BASE ---
  const margenFijoDecimal = 0.70; 
  const costoFijoDecimal = 0.30; // Temporal hasta activar Motor de Recetas

  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);
  const costoInsumosRecetas = ventasHoy.reduce((acc, ped) => {
    return acc + ped.items.reduce((sum: number, it: any) => {
      const p = productos.find(prod => prod.nombre === it.nombre);
      return sum + Number(p?.precio_costo || (Number(it.precio_final) * costoFijoDecimal));
    }, 0);
  }, 0);

  const totalGastosHoy = gastosHoy.reduce((acc, g) => acc + Number(g.monto), 0);
  const totalInsumosHoy = costoInsumosRecetas + totalGastosHoy;
  const gananciaLibreHoy = totalVentasHoy - totalInsumosHoy;

  // Distribución del Día
  const gananciaDistribuible = Math.max(0, gananciaLibreHoy);
  const distDeuda = gananciaDistribuible * 0.35;
  const distExpansion = gananciaDistribuible * 0.15;
  const distMarketing = gananciaDistribuible * 0.10;
  const distReserva = gananciaDistribuible * 0.10;
  const distSueldoTotal = gananciaDistribuible * 0.30;
  const sueldoIndividual = distSueldoTotal / 3;

  // Promedios y Esfuerzo
  const diasActivos = Array.from(new Set(todasLasVentas.map(v => v.created_at.split('T')[0]))).length || 1;
  const gananciaHistoricaTotal = todasLasVentas.reduce((acc, ped) => {
    const costo = ped.items.reduce((sum: number, it: any) => {
      const p = productos.find(prod => prod.nombre === it.nombre);
      return sum + Number(p?.precio_costo || (Number(it.precio_final) * costoFijoDecimal));
    }, 0);
    return acc + (Number(ped.total) - costo);
  }, 0);
  
  let promedioGananciaLibreDiaria = gananciaHistoricaTotal / diasActivos;
  if (promedioGananciaLibreDiaria <= 0 && gananciaLibreHoy > 0) promedioGananciaLibreDiaria = gananciaLibreHoy;

  const pagoMensualDeudas = deudas.reduce((acc, d) => acc + (d.monto_total / d.cuotas_totales), 0);
  const capacidadPagoMensual = promedioGananciaLibreDiaria * 30;
  const porcentajeEsfuerzo = capacidadPagoMensual > 0 ? (pagoMensualDeudas / capacidadPagoMensual) * 100 : 0;

  // Simulador
  const diasTrabajadosAlMes = Number(diasTrabajoSemana) * 4;
  const porcentajeAhorroDecimal = Number(porcentajeAhorro) / 100;
  let metaDiariaLibre = 0, metaDiariaBruta = 0, insumosDiariosEstimados = 0;
  if (pagoMensualDeudas > 0 && porcentajeAhorroDecimal > 0 && diasTrabajadosAlMes > 0) {
    metaDiariaLibre = (pagoMensualDeudas / porcentajeAhorroDecimal) / diasTrabajadosAlMes;
    metaDiariaBruta = metaDiariaLibre / margenFijoDecimal;
    insumosDiariosEstimados = metaDiariaBruta - metaDiariaLibre;
  }

  return (
    <LockScreen titulo="Comando Financiero Súa">
      <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-4 md:p-10 font-sans relative overflow-x-hidden">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-8">
          
          {/* HEADER Y NAVEGACIÓN */}
          <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#CBA36A]/20 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-white">Finanzas Centrales</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">ERP Nivel Operativo</p>
            </div>
            
            <div className="flex bg-[#0A130D] p-1.5 rounded-full border border-white/10 shadow-lg overflow-x-auto w-full md:w-auto">
              <button onClick={() => setPestanaActiva('radar')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'radar' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Activity size={14} /> Radar Diario</button>
              <button onClick={() => setPestanaActiva('analitica')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'analitica' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><BarChart3 size={14} /> Analítica</button>
              <button onClick={() => setPestanaActiva('ingenieria')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pestanaActiva === 'ingenieria' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Database size={14} /> Gestión & Costos</button>
            </div>
          </header>

          {/* =========================================
              MÓDULO 1: RADAR DIARIO 
          ========================================= */}
          {pestanaActiva === 'radar' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Ventas y Gastos */}
                <div className="space-y-6">
                  <section className="bg-[#0A130D] border border-[#CBA36A]/20 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Ventas Brutas</p>
                        <p className="text-5xl md:text-6xl font-serif text-white">${totalVentasHoy.toFixed(2)}</p>
                      </div>
                      <ShoppingBag className="opacity-20" size={40} />
                    </div>
                    <div className="border-t border-white/10 pt-4 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                      {ventasHoy.length === 0 ? <p className="text-sm italic opacity-30 text-white">Sin ventas hoy.</p> : 
                        ventasHoy.map((v, idx) => (
                          <div key={idx} className="text-sm border-b border-white/5 py-2 flex justify-between">
                             <span className="text-white/80">{v.items.length} articulos</span>
                             <span className="text-[#CBA36A]">${Number(v.total).toFixed(0)}</span>
                          </div>
                        ))
                      }
                    </div>
                  </section>

                  <div className="bg-[#101C13] border border-orange-900/40 rounded-[2rem] p-6 flex justify-between items-center shadow-lg">
                    <div className="flex items-center gap-4">
                        <ArrowDownCircle className="text-orange-500 opacity-60" size={32} />
                        <div>
                          <p className="text-[10px] font-black uppercase opacity-50 text-orange-200">Costo Operativo (Insumos + Gastos)</p>
                          <p className="text-3xl font-serif text-orange-400">-${totalInsumosHoy.toFixed(2)}</p>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Ganancia y Corte */}
                <div className="space-y-6 flex flex-col">
                  <section className="bg-[#CBA36A] text-[#0A130D] p-8 rounded-[2.5rem] shadow-xl text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <Wallet size={20} />
                      <p className="text-xs font-black uppercase tracking-widest">Utilidad Neta (Libre)</p>
                    </div>
                    <p className="text-6xl md:text-7xl font-serif font-bold tracking-tighter">${gananciaLibreHoy.toFixed(2)}</p>
                  </section>

                  <div className="bg-[#050A06] border-t-2 border-[#CBA36A] rounded-[2.5rem] p-6 shadow-2xl flex-1">
                    <h2 className="text-xl font-serif text-white mb-4 flex items-center gap-2"><PieChart size={20} className="text-[#CBA36A]"/> Corte de Caja</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-red-950/20 rounded-xl border border-red-900/30">
                        <span className="text-xs font-bold text-white flex items-center gap-2"><CreditCard size={14} className="text-red-400"/> Deudas (35%)</span>
                        <span className="font-serif text-red-400">${distDeuda.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-950/20 rounded-xl border border-green-900/30">
                        <span className="text-xs font-bold text-white flex items-center gap-2"><Users size={14} className="text-green-400"/> Nómina (30%)</span>
                        <span className="font-serif text-green-400">${distSueldoTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-950/20 rounded-xl border border-blue-900/30">
                        <span className="text-xs font-bold text-white flex items-center gap-2"><TrendingUp size={14} className="text-blue-400"/> Expansión (15%)</span>
                        <span className="font-serif text-blue-400">${distExpansion.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-yellow-950/20 rounded-xl border border-yellow-900/30 flex justify-between">
                          <span className="text-[10px] text-white">Reserva</span><span className="font-serif text-yellow-400">${distReserva.toFixed(2)}</span>
                        </div>
                        <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-900/30 flex justify-between">
                          <span className="text-[10px] text-white">MKT</span><span className="font-serif text-purple-400">${distMarketing.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =========================================
              MÓDULO 2: ANALÍTICA Y BI 
          ========================================= */}
          {pestanaActiva === 'analitica' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Simulador Estratégico (Movido aquí) */}
              <section className="bg-[#101C13] border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/5 pb-8">
                  <div className="max-w-xl">
                    <h2 className="text-2xl font-serif text-white mb-2 flex items-center gap-3"><Calculator size={24} className="text-[#CBA36A]"/> Simulador Estratégico de Metas</h2>
                    <p className="text-xs text-white/50">Proyecta tus metas diarias basadas en tus deudas activas.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/30 p-6 rounded-[2rem] border border-white/5 text-center">
                      <label className="text-[10px] font-black uppercase opacity-60 mb-2 block">Días trabajo/semana</label>
                      <input type="number" value={diasTrabajoSemana} onChange={e=>setDiasTrabajoSemana(e.target.value)} className="w-full bg-transparent text-center text-5xl font-serif text-white outline-none border-b border-[#CBA36A]/30 focus:border-[#CBA36A] pb-2" min="1" max="7" />
                    </div>
                    <div className="bg-black/30 p-6 rounded-[2rem] border border-white/5 text-center">
                      <label className="text-[10px] font-black uppercase opacity-60 mb-2 block">% Destinado a Deuda</label>
                      <input type="number" value={porcentajeAhorro} onChange={e=>setPorcentajeAhorro(e.target.value)} className="w-full bg-transparent text-center text-5xl font-serif text-white outline-none border-b border-[#CBA36A]/30 focus:border-[#CBA36A] pb-2" min="1" max="100" />
                    </div>
                  </div>

                  <div className="bg-[#CBA36A] text-[#0A130D] p-6 rounded-[2rem] text-center flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Meta en Caja Diaria:</p>
                    <p className="text-5xl font-serif font-bold mb-4">${metaDiariaBruta.toFixed(0)}</p>
                    <div className="bg-black/10 rounded-xl p-3 text-left space-y-1">
                        <div className="flex justify-between text-[10px] font-bold"><span className="opacity-80">Insumos:</span><span className="text-red-900">-${insumosDiariosEstimados.toFixed(0)}</span></div>
                        <div className="flex justify-between text-[10px] font-black border-t border-black/10 pt-1"><span>Ganancia Libre:</span><span>${metaDiariaLibre.toFixed(0)}</span></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Placeholder para futuras gráficas */}
              <section className="bg-[#0A130D] border border-dashed border-white/10 rounded-[3rem] p-12 text-center opacity-50 flex flex-col items-center justify-center">
                <BarChart3 size={48} className="text-[#CBA36A] mb-4" />
                <h3 className="text-xl font-serif text-white mb-2">Panel de Inteligencia de Negocios</h3>
                <p className="text-xs w-full max-w-md mx-auto leading-relaxed">
                  Sistema preparándose para procesar volúmenes masivos de datos. Próximamente: Gráficas de horas pico, análisis de productos más vendidos y comparativas históricas mensuales.
                </p>
              </section>
            </div>
          )}

          {/* =========================================
              MÓDULO 3: PASIVOS Y MOTOR DE COSTOS 
          ========================================= */}
          {pestanaActiva === 'ingenieria' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
              
              {/* Columna Izquierda: Deudas */}
              <div className="space-y-6">
                <section className="bg-[#0A130D] border border-[#CBA36A]/10 rounded-[2.5rem] p-8 shadow-xl">
                  <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><Plus size={20} className="text-[#CBA36A]"/> Registrar Adquisición / Gasto</h2>
                  <form onSubmit={registrarCompra} className="space-y-4">
                      <input type="text" placeholder="Ej: Cafetera Casadio" value={nombreItem} onChange={e=>setNombreItem(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white" />
                      <div className="flex gap-4">
                        <input type="number" placeholder="Costo $" value={montoTotal} onChange={e=>setMontoTotal(e.target.value)} className="w-1/2 bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none text-white" />
                        <select value={numMeses} onChange={e=>setNumMeses(e.target.value)} className="w-1/2 bg-[#101C13] border border-white/10 p-3 rounded-xl text-sm outline-none text-white font-bold">
                          <option value="0">Pago Único (Restar hoy)</option>
                          <option value="1">1 Mes</option>
                          <option value="3">3 Meses</option>
                          <option value="6">6 Meses</option>
                          <option value="12">12 Meses</option>
                        </select>
                      </div>
                      <button className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Anotar en Libros</button>
                  </form>
                </section>

                <section className="bg-[#0A130D] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif text-white flex items-center gap-2"><CreditCard size={20} className="text-[#CBA36A]"/> Pasivos Activos</h2>
                    <p className="text-[10px] font-bold text-red-400 bg-red-950/30 px-3 py-1.5 rounded-lg">-${pagoMensualDeudas.toFixed(0)} / mes</p>
                  </div>
                  <div className="space-y-3">
                    {deudas.length === 0 ? <p className="text-white/30 italic text-center py-4 text-sm">Sin pasivos registrados.</p> : 
                      deudas.map(d => (
                        <div key={d.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center group">
                          <div>
                            <p className="text-sm font-bold text-white">{d.descripcion}</p>
                            <p className="text-[10px] opacity-50">${d.monto_total} a {d.cuotas_totales} meses</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-serif text-[#CBA36A]">${(d.monto_total / d.cuotas_totales).toFixed(0)}</p>
                            <button onClick={()=>eliminarDeuda(d.id)} className="text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              </div>

              {/* Columna Derecha: Motor de Costeos (Interfaz Inicial) */}
              <div className="bg-[#0A130D] border border-[#CBA36A]/30 rounded-[2.5rem] p-8 shadow-2xl flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CBA36A] to-transparent opacity-50"></div>
                <h2 className="text-2xl font-serif text-white mb-2 flex items-center gap-3"><Beaker size={24} className="text-[#CBA36A]"/> Motor de Recetas Súa</h2>
                <p className="text-xs text-white/50 mb-8 leading-relaxed">Sistema de ingeniería de costos. Automatice el cálculo de sus márgenes enlazando insumos exactos a cada bebida.</p>
                
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center py-10 space-y-4 border border-dashed border-white/10 rounded-2xl">
                  <Database size={40} className="text-[#CBA36A]" />
                  <p className="text-sm font-bold uppercase tracking-widest text-white">Módulo en Construcción</p>
                  <p className="text-xs max-w-xs leading-relaxed">Esperando estructuración de la base de datos SQL para activar el enrutamiento lógico de "Insumos" y "Recetas".</p>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </LockScreen>
  );
}