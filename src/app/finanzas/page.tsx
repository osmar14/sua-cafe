'use client';
import LockScreen from '@/components/LockScreen';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, Wallet, CreditCard, Plus, Trash2, 
  ArrowDownCircle, Calculator, Target, PieChart, Shield, 
  Megaphone, TrendingUp, Users, Activity, BarChart3, Database,
  CalendarDays, CalendarCheck, Crown
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

  const registrarCompra = async (e: React.FormEvent) => {
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
  const costoFijoDecimal = 0.30; 

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

  // Promedios y Esfuerzo Mensual
  const pagoMensualDeudas = deudas.reduce((acc, d) => acc + (d.monto_total / d.cuotas_totales), 0);
  
  // Simulador
  const diasTrabajadosAlMes = Number(diasTrabajoSemana) * 4;
  const porcentajeAhorroDecimal = Number(porcentajeAhorro) / 100;
  let metaDiariaLibre = 0, metaDiariaBruta = 0, insumosDiariosEstimados = 0;
  if (pagoMensualDeudas > 0 && porcentajeAhorroDecimal > 0 && diasTrabajadosAlMes > 0) {
    metaDiariaLibre = (pagoMensualDeudas / porcentajeAhorroDecimal) / diasTrabajadosAlMes;
    metaDiariaBruta = metaDiariaLibre / margenFijoDecimal;
    insumosDiariosEstimados = metaDiariaBruta - metaDiariaLibre;
  }

  // --- 📈 PROCESAMIENTO DE ANALÍTICA (Manejo de Memoria Optimizado) ---
  const metricasAnalitica = useMemo(() => {
    const hoy = new Date();
    
    // Límites de tiempo
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hoy.getDate() - 7);
    
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    let totalSemana = 0;
    let totalMes = 0;
    const conteoItems: Record<string, { cantidad: number, totalGanado: number }> = {};

    todasLasVentas.forEach(venta => {
      const fechaVenta = new Date(venta.created_at);
      const totalVenta = Number(venta.total);

      if (fechaVenta >= hace7Dias) totalSemana += totalVenta;
      if (fechaVenta >= primerDiaMes) totalMes += totalVenta;

      // Ranking de Productos
      venta.items.forEach((item: any) => {
        if (!conteoItems[item.nombre]) {
          conteoItems[item.nombre] = { cantidad: 0, totalGanado: 0 };
        }
        conteoItems[item.nombre].cantidad += 1;
        conteoItems[item.nombre].totalGanado += Number(item.precio_final);
      });
    });

    const topProductos = Object.entries(conteoItems)
      .map(([nombre, stats]) => ({ nombre, ...stats }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Los 5 mejores

    return { totalSemana, totalMes, topProductos };
  }, [todasLasVentas]);

  return (
    <LockScreen titulo="Comando Financiero Súa">
      <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-4 md:p-10 font-sans relative overflow-x-hidden">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-8 pb-20">
          
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
              MÓDULO 2: ANALÍTICA Y BI (MEJORADO)
          ========================================= */}
          {pestanaActiva === 'analitica' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* KPIs de Desempeño */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A130D] p-6 rounded-[2rem] border border-white/5 shadow-xl text-center flex flex-col justify-center items-center relative overflow-hidden">
                   <div className="absolute top-0 w-full h-1 bg-[#CBA36A]"></div>
                   <Activity size={24} className="text-[#CBA36A] mb-2 opacity-50"/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Ventas Hoy</p>
                   <p className="text-4xl font-serif text-white">${totalVentasHoy.toFixed(0)}</p>
                </div>
                
                <div className="bg-[#0A130D] p-6 rounded-[2rem] border border-white/5 shadow-xl text-center flex flex-col justify-center items-center relative overflow-hidden">
                   <div className="absolute top-0 w-full h-1 bg-white/20"></div>
                   <CalendarDays size={24} className="text-white/30 mb-2"/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Últimos 7 Días</p>
                   <p className="text-4xl font-serif text-white">${metricasAnalitica.totalSemana.toFixed(0)}</p>
                </div>

                <div className="bg-[#0A130D] p-6 rounded-[2rem] border border-white/5 shadow-xl text-center flex flex-col justify-center items-center relative overflow-hidden">
                   <div className="absolute top-0 w-full h-1 bg-white/20"></div>
                   <CalendarCheck size={24} className="text-white/30 mb-2"/>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Acumulado del Mes</p>
                   <p className="text-4xl font-serif text-white">${metricasAnalitica.totalMes.toFixed(0)}</p>
                </div>
              </div>

              {/* Ranking y Simulador */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Ranking de Productos */}
                <section className="bg-[#0A130D] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-1">
                  <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><Crown size={20} className="text-[#CBA36A]"/> Top 5 Vendidos</h2>
                  <div className="space-y-4">
                    {metricasAnalitica.topProductos.length === 0 ? <p className="text-sm opacity-30 italic text-white text-center">Faltan datos de ventas.</p> :
                      metricasAnalitica.topProductos.map((prod, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-[#CBA36A] font-black text-lg w-4">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-bold text-white">{prod.nombre}</p>
                              <p className="text-[10px] uppercase tracking-widest text-white/40">{prod.cantidad} vendidos</p>
                            </div>
                          </div>
                          <span className="font-serif text-[#CBA36A]">${prod.totalGanado.toFixed(0)}</span>
                        </div>
                      ))
                    }
                  </div>
                </section>

                {/* Simulador Estratégico */}
                <section className="bg-[#101C13] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl lg:col-span-2 flex flex-col justify-center">
                  <div className="mb-8 border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-serif text-white mb-2 flex items-center gap-3"><Calculator size={24} className="text-[#CBA36A]"/> Simulador de Metas</h2>
                    <p className="text-xs text-white/50">Proyección diaria basada en pasivos.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="bg-black/30 p-4 rounded-[1.5rem] border border-white/5 text-center flex justify-between items-center px-6">
                        <label className="text-[10px] font-black uppercase opacity-60">Días Laborales / Sem</label>
                        <input type="number" value={diasTrabajoSemana} onChange={e=>setDiasTrabajoSemana(e.target.value)} className="w-16 bg-transparent text-right text-3xl font-serif text-white outline-none focus:text-[#CBA36A]" min="1" max="7" />
                      </div>
                      <div className="bg-black/30 p-4 rounded-[1.5rem] border border-white/5 text-center flex justify-between items-center px-6">
                        <label className="text-[10px] font-black uppercase opacity-60">% a Deuda</label>
                        <div className="flex items-center gap-1">
                          <input type="number" value={porcentajeAhorro} onChange={e=>setPorcentajeAhorro(e.target.value)} className="w-20 bg-transparent text-right text-3xl font-serif text-white outline-none focus:text-[#CBA36A]" min="1" max="100" />
                          <span className="text-xl text-white/50">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#CBA36A] text-[#0A130D] p-6 rounded-[2rem] text-center shadow-inner">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Meta en Caja Diaria:</p>
                      <p className="text-5xl font-serif font-bold mb-4">${metaDiariaBruta.toFixed(0)}</p>
                      <div className="bg-black/10 rounded-xl p-3 text-left space-y-1">
                          <div className="flex justify-between text-[10px] font-bold"><span className="opacity-80">Insumos (-30%):</span><span className="text-red-900">-${insumosDiariosEstimados.toFixed(0)}</span></div>
                          <div className="flex justify-between text-[10px] font-black border-t border-black/10 pt-1"><span>Libre (Meta):</span><span>${metaDiariaLibre.toFixed(0)}</span></div>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          )}

          {/* =========================================
              MÓDULO 3: GESTIÓN DE PASIVOS (LIMPIO)
          ========================================= */}
          {pestanaActiva === 'ingenieria' && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-8">
              
              <section className="bg-[#0A130D] border border-[#CBA36A]/10 rounded-[2.5rem] p-8 shadow-xl">
                <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><Plus size={20} className="text-[#CBA36A]"/> Registrar Adquisición / Gasto</h2>
                <form onSubmit={registrarCompra} className="space-y-4">
                    <input type="text" placeholder="Ej: Cafetera Casadio / Mantenimiento Local" value={nombreItem} onChange={e=>setNombreItem(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-[#CBA36A] text-white" />
                    <div className="flex flex-col md:flex-row gap-4">
                      <input type="number" placeholder="Costo Total $" value={montoTotal} onChange={e=>setMontoTotal(e.target.value)} className="w-full md:w-1/2 bg-black/40 border border-white/10 p-4 rounded-xl text-sm outline-none text-white" />
                      <select value={numMeses} onChange={e=>setNumMeses(e.target.value)} className="w-full md:w-1/2 bg-[#101C13] border border-white/10 p-4 rounded-xl text-sm outline-none text-white font-bold cursor-pointer hover:border-[#CBA36A]/50 transition-colors">
                        <option value="0">Pago Único (Restar de ganancias hoy)</option>
                        <option value="1">Diferir a 1 Mes</option>
                        <option value="3">Diferir a 3 Meses</option>
                        <option value="6">Diferir a 6 Meses</option>
                        <option value="12">Diferir a 12 Meses</option>
                      </select>
                    </div>
                    <button className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 active:scale-95 transition-all mt-2 shadow-[0_0_20px_rgba(203,163,106,0.3)]">
                      Anotar en Libros Contables
                    </button>
                </form>
              </section>

              <section className="bg-[#0A130D] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                  <h2 className="text-2xl font-serif text-white flex items-center gap-3"><CreditCard size={24} className="text-[#CBA36A]"/> Pasivos Activos</h2>
                  <p className="text-xs font-bold text-red-400 bg-red-950/30 px-4 py-2 rounded-xl border border-red-900/30">-${pagoMensualDeudas.toFixed(0)} / mes</p>
                </div>
                <div className="space-y-4">
                  {deudas.length === 0 ? <p className="text-white/30 italic text-center py-10 text-sm">Finanzas sanas. No hay deudas vigentes.</p> : 
                    deudas.map(d => (
                      <div key={d.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
                        <div>
                          <p className="text-base font-bold text-white mb-1">{d.descripcion}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">${d.monto_total} a {d.cuotas_totales} meses</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-serif text-xl text-[#CBA36A]">${(d.monto_total / d.cuotas_totales).toFixed(0)}</p>
                          <button onClick={()=>eliminarDeuda(d.id)} className="text-red-900 hover:text-red-500 bg-red-900/10 hover:bg-red-500/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

            </div>
          )}

        </div>
      </main>
    </LockScreen>
  );
}