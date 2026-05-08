'use client';
import LockScreen from '@/components/LockScreen';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, Wallet, CreditCard, Plus, Trash2, 
  ArrowDownCircle, Percent, Calculator, Target, 
  PieChart, Shield, Megaphone, TrendingUp, Users 
} from 'lucide-react';

export default function FinanzasPage() {
  const [ventasHoy, setVentasHoy] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [gastosHoy, setGastosHoy] = useState<any[]>([]);
  const [todasLasVentas, setTodasLasVentas] = useState<any[]>([]);
  
  // Formulario Compras/Deudas
  const [nombreItem, setNombreItem] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [numMeses, setNumMeses] = useState('0'); // 0 = Gasto de hoy, >0 = Deuda

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

  // --- 🧠 INGENIERÍA FINANCIERA SÚA ---
  // MARGEN ESTÁNDAR FIJO DE LA INDUSTRIA (Tu nueva regla: 70% Ganancia, 30% Insumos)
  const margenFijoDecimal = 0.70; 
  const costoFijoDecimal = 0.30;

  // 1. Ventas del Día y Gastos
  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);
  
  const costoInsumosRecetas = ventasHoy.reduce((acc, ped) => {
    return acc + ped.items.reduce((sum: number, it: any) => {
      const p = productos.find(prod => prod.nombre === it.nombre);
      // Usamos el 30% fijo si no hay precio de costo exacto en la DB
      return sum + Number(p?.precio_costo || (Number(it.precio_final) * costoFijoDecimal));
    }, 0);
  }, 0);

  const totalGastosHoy = gastosHoy.reduce((acc, g) => acc + Number(g.monto), 0);
  const totalInsumosHoy = costoInsumosRecetas + totalGastosHoy;
  
  // GANANCIA LIBRE HOY (Dinero Limpio)
  const gananciaLibreHoy = totalVentasHoy - totalInsumosHoy;

  // --- 📊 DISTRIBUCIÓN DEL DÍA ---
  const gananciaDistribuible = Math.max(0, gananciaLibreHoy);
  const distDeuda = gananciaDistribuible * 0.35;
  const distExpansion = gananciaDistribuible * 0.15;
  const distMarketing = gananciaDistribuible * 0.10;
  const distReserva = gananciaDistribuible * 0.10;
  const distSueldoTotal = gananciaDistribuible * 0.30;
  const sueldoIndividual = distSueldoTotal / 3;

  // --- 📈 PROMEDIOS E HISTÓRICOS ---
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

  // --- 🧮 SIMULADOR ESTRATÉGICO FIJO ---
  const diasTrabajadosAlMes = Number(diasTrabajoSemana) * 4;
  const porcentajeAhorroDecimal = Number(porcentajeAhorro) / 100;
  
  let metaDiariaLibre = 0;
  let metaDiariaBruta = 0; // Lo que tienes que cobrar en caja
  let insumosDiariosEstimados = 0;

  if (pagoMensualDeudas > 0 && porcentajeAhorroDecimal > 0 && diasTrabajadosAlMes > 0) {
    metaDiariaLibre = (pagoMensualDeudas / porcentajeAhorroDecimal) / diasTrabajadosAlMes;
    // Inflamos la meta cobrada usando TU NUEVA REGLA (70% ganancia)
    metaDiariaBruta = metaDiariaLibre / margenFijoDecimal;
    insumosDiariosEstimados = metaDiariaBruta - metaDiariaLibre;
  }

  return (
      <LockScreen titulo="Panel de Finanzas">
    <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-4 md:p-10 font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* 🟢 SECCIÓN 1: OPERACIÓN DEL DÍA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[#0A130D] border border-[#CBA36A]/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-xs md:text-sm font-black uppercase tracking-widest opacity-50 mb-1">Ventas Totales Hoy</p>
                  <p className="text-6xl md:text-7xl font-serif text-white tracking-tighter">${totalVentasHoy.toFixed(2)}</p>
                </div>
                <ShoppingBag className="opacity-20" size={56} />
              </div>
              <div className="border-t border-white/10 pt-6">
                <p className="text-xs font-bold uppercase mb-4 opacity-40 tracking-widest">Desglose de lo vendido</p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                  {ventasHoy.length === 0 ? <p className="text-sm italic opacity-30 text-white">Esperando la primera venta...</p> : 
                    ventasHoy.map((v, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl">
                        {v.items.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                             <span className="text-white/90 font-bold">• {it.nombre} <span className="text-xs font-normal opacity-50 ml-1">({it.extras_str || 'Sencillo'})</span></span>
                             <span className="text-[#CBA36A] font-serif font-bold">${Number(it.precio_final).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  }
                </div>
              </div>
            </section>

            <div className="bg-[#101C13] border border-orange-900/40 rounded-[2.5rem] p-8 flex justify-between items-center shadow-lg">
               <div className="flex items-center gap-6">
                  <ArrowDownCircle className="text-orange-500 opacity-60" size={40} />
                  <div>
                    <p className="text-xs font-black uppercase opacity-50 mb-1 text-orange-200">Caja de Insumos (No Tocar)</p>
                    <p className="text-3xl md:text-4xl font-serif text-orange-400">-${totalInsumosHoy.toFixed(2)}</p>
                  </div>
               </div>
               <p className="text-xs opacity-40 max-w-[180px] text-right italic font-medium hidden md:block">Dinero para reponer leche, café y gastos de hoy.</p>
            </div>
          </div>

          <section className="bg-[#0A130D] border border-[#CBA36A]/10 rounded-[2.5rem] p-8 md:p-10 shadow-xl flex flex-col justify-center">
             <h2 className="text-2xl font-serif text-white mb-8 flex items-center gap-3"><Plus size={24} className="text-[#CBA36A]"/> Registrar Compra</h2>
             <form onSubmit={registrarCompra} className="space-y-6">
                <div>
                  <label className="text-[10px] md:text-xs font-black uppercase opacity-50 mb-2 block">¿Qué compraste?</label>
                  <input type="text" placeholder="Ej: Licuadora Ninja" value={nombreItem} onChange={e=>setNombreItem(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#CBA36A] text-white" />
                </div>
                <div>
                  <label className="text-[10px] md:text-xs font-black uppercase opacity-50 mb-2 block">Costo Total $</label>
                  <input type="number" placeholder="0.00" value={montoTotal} onChange={e=>setMontoTotal(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-sm outline-none text-white" />
                </div>
                <div>
                  <label className="text-[10px] md:text-xs font-black uppercase opacity-50 mb-2 block">Modalidad de Pago</label>
                  <select value={numMeses} onChange={e=>setNumMeses(e.target.value)} className="w-full bg-[#101C13] border border-white/10 p-4 rounded-2xl text-sm outline-none text-white font-bold">
                    <option value="0">Pago Único (Restar hoy)</option>
                    <option value="1">Diferir a 1 Mes</option>
                    <option value="2">Diferir a 2 Meses</option>
                    <option value="3">Diferir a 3 Meses</option>
                    <option value="6">Diferir a 6 Meses</option>
                    <option value="9">Diferir a 9 Meses</option>
                    <option value="12">Diferir a 12 Meses</option>
                  </select>
                </div>
                <button className="w-full bg-[#CBA36A] text-black py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4">Anotar en Libros</button>
             </form>
          </section>
        </div>

        {/* 💰 SECCIÓN 2: GANANCIA LIBRE DESTACADA */}
        <section className="bg-[#CBA36A] text-[#0A130D] p-10 md:p-14 rounded-[3rem] shadow-[0_20px_60px_rgba(203,163,106,0.25)] flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
               <Wallet size={28} />
               <p className="text-sm font-black uppercase tracking-widest">Ganancia Libre de Hoy (El 100%)</p>
            </div>
            <p className="text-8xl md:text-9xl font-serif font-bold tracking-tighter drop-shadow-sm">${gananciaLibreHoy.toFixed(2)}</p>
          </div>
          <div className="bg-[#0A130D]/10 p-8 rounded-3xl border border-black/10 max-w-sm">
            <p className="text-sm md:text-base font-bold leading-relaxed">"Este es el oxígeno puro del negocio. A continuación, te digo exactamente cómo dividir estas monedas."</p>
          </div>
        </section>

        {/* 🏹 SECCIÓN 3: DEUDAS Y DISTRIBUCIÓN DEL DÍA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Deudas Activas */}
          <div className="bg-[#0A130D] border border-white/5 rounded-[3rem] p-8 md:p-10 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-3xl font-serif text-white flex items-center gap-3"><CreditCard size={28} className="text-[#CBA36A]"/> Deudas Activas</h2>
               <p className="text-sm font-bold text-red-400 bg-red-950/30 px-4 py-2 rounded-xl">-${pagoMensualDeudas.toFixed(2)} / mes</p>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              {deudas.length === 0 ? <p className="text-white/30 italic text-center py-10">No hay deudas activas. ¡Excelente!</p> : deudas.map(d => (
                <div key={d.id} className="bg-black/40 p-6 rounded-2xl border border-white/5 flex justify-between items-center group">
                  <div>
                    <p className="text-base md:text-lg font-bold text-white mb-1">{d.descripcion}</p>
                    <p className="text-xs opacity-50">${d.monto_total} a {d.cuotas_totales} {d.cuotas_totales === 1 ? 'mes' : 'meses'}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-serif text-white text-xl md:text-2xl">${(d.monto_total / d.cuotas_totales).toFixed(2)}</p>
                    <button onClick={()=>eliminarDeuda(d.id)} className="text-red-900 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/10">
               <p className="text-xs font-black uppercase mb-3 opacity-50">Esfuerzo Mensual (Promedio)</p>
               <div className="flex justify-between items-end mb-2">
                 <p className="text-xs text-white/70">Tus deudas consumen el:</p>
                 <p className="text-2xl font-serif text-[#CBA36A]">{porcentajeEsfuerzo.toFixed(1)}%</p>
               </div>
               <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                 <div className={`h-full transition-all duration-1000 ${porcentajeEsfuerzo > 70 ? 'bg-red-600' : 'bg-[#CBA36A]'}`} style={{width: `${Math.min(porcentajeEsfuerzo, 100)}%`}}></div>
               </div>
            </div>
          </div>

          {/* DISTRIBUIDORA DE GANANCIAS */}
          <div className="bg-[#050A06] border-t-4 border-[#CBA36A] rounded-[3rem] p-8 md:p-10 shadow-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-serif text-white mb-2 flex items-center gap-3"><PieChart size={28} className="text-[#CBA36A]"/> Corte de Caja</h2>
              <p className="text-xs uppercase tracking-widest opacity-40 mb-8">Divide tus ${gananciaLibreHoy.toFixed(2)} libres de hoy así:</p>
              
              <div className="space-y-4">
                {/* 35% Deudas */}
                <div className="flex justify-between items-center p-4 bg-red-950/20 rounded-2xl border border-red-900/30">
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-red-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Pago de Deuda</p>
                      <p className="text-[10px] uppercase opacity-50 text-red-200">Sobres / Banco (35%)</p>
                    </div>
                  </div>
                  <p className="text-xl font-serif text-red-400">${distDeuda.toFixed(2)}</p>
                </div>

                {/* 15% Expansión */}
                <div className="flex justify-between items-center p-4 bg-blue-950/20 rounded-2xl border border-blue-900/30">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-blue-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Expansión / Mejoras</p>
                      <p className="text-[10px] uppercase opacity-50 text-blue-200">Nuevos equipos (15%)</p>
                    </div>
                  </div>
                  <p className="text-xl font-serif text-blue-400">${distExpansion.toFixed(2)}</p>
                </div>

                {/* 10% Marketing */}
                <div className="flex justify-between items-center p-4 bg-purple-950/20 rounded-2xl border border-purple-900/30">
                  <div className="flex items-center gap-3">
                    <Megaphone size={18} className="text-purple-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Marketing</p>
                      <p className="text-[10px] uppercase opacity-50 text-purple-200">Dominio, Ads (10%)</p>
                    </div>
                  </div>
                  <p className="text-xl font-serif text-purple-400">${distMarketing.toFixed(2)}</p>
                </div>

                {/* 10% Reserva */}
                <div className="flex justify-between items-center p-4 bg-yellow-950/20 rounded-2xl border border-yellow-900/30">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-yellow-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Fondo de Emergencia</p>
                      <p className="text-[10px] uppercase opacity-50 text-yellow-200">Reparaciones (10%)</p>
                    </div>
                  </div>
                  <p className="text-xl font-serif text-yellow-400">${distReserva.toFixed(2)}</p>
                </div>

                {/* 30% Sueldo Dividido */}
                <div className="p-5 bg-green-950/20 rounded-2xl border border-green-900/30">
                  <div className="flex justify-between items-center mb-3 border-b border-green-900/30 pb-3">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-green-400" />
                      <div>
                        <p className="text-sm font-bold text-white">Nómina del Día</p>
                        <p className="text-[10px] uppercase opacity-50 text-green-200">Sueldo Total (30%)</p>
                      </div>
                    </div>
                    <p className="text-xl font-serif text-green-400">${distSueldoTotal.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-green-200/70">
                    <div className="bg-green-950/40 p-2 rounded-xl">
                      <p className="text-[9px] uppercase mb-1">Tú</p>
                      <p className="font-serif font-bold">${sueldoIndividual.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-950/40 p-2 rounded-xl">
                      <p className="text-[9px] uppercase mb-1">Hermana 1</p>
                      <p className="font-serif font-bold">${sueldoIndividual.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-950/40 p-2 rounded-xl">
                      <p className="text-[9px] uppercase mb-1">Hermana 2</p>
                      <p className="font-serif font-bold">${sueldoIndividual.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🚀 SECCIÓN 4: SIMULADOR DE METAS TOTAL (Caja + Libre) */}
        <section className="bg-[#101C13] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/5 pb-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-serif text-white mb-2 flex items-center gap-3"><Calculator size={28} className="text-[#CBA36A]"/> Simulador Estratégico</h2>
              <p className="text-sm text-white/50 leading-relaxed">Configura tus días laborales y cuánto quieres destinar a pagar deudas. Súa te dirá la meta de venta total (incluyendo insumos) y la meta libre.</p>
            </div>
            <Target size={64} className="text-[#CBA36A] opacity-20 hidden md:block" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Controles */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/30 p-8 rounded-[2rem] border border-white/5 text-center">
                <label className="text-xs font-black uppercase opacity-60 mb-4 block">Días de trabajo a la semana</label>
                <div className="flex items-center justify-center gap-4">
                  <input type="number" value={diasTrabajoSemana} onChange={e=>setDiasTrabajoSemana(e.target.value)} className="w-24 bg-transparent text-center text-6xl font-serif text-white outline-none border-b-2 border-[#CBA36A]/30 focus:border-[#CBA36A] pb-2" min="1" max="7" />
                  <span className="text-2xl opacity-40">Días</span>
                </div>
              </div>
              
              <div className="bg-black/30 p-8 rounded-[2rem] border border-white/5 text-center">
                <label className="text-xs font-black uppercase opacity-60 mb-4 block">% Destinado a Deuda</label>
                <div className="flex items-center justify-center gap-2">
                   <input type="number" value={porcentajeAhorro} onChange={e=>setPorcentajeAhorro(e.target.value)} className="w-32 bg-transparent text-center text-6xl font-serif text-white outline-none border-b-2 border-[#CBA36A]/30 focus:border-[#CBA36A] pb-2" min="1" max="100" />
                   <span className="text-4xl text-white/50">%</span>
                </div>
              </div>
            </div>

            {/* Resultado de Meta (Bruto y Libre) */}
            <div className="bg-[#CBA36A] text-[#0A130D] p-8 rounded-[2rem] text-center h-full flex flex-col justify-center shadow-inner">
               <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Debes cobrar en caja cada día:</p>
               {pagoMensualDeudas === 0 ? (
                 <p className="text-2xl font-serif font-bold">¡Libre de deudas!</p>
               ) : (
                 <>
                   <p className="text-6xl md:text-7xl font-serif font-bold tracking-tighter mb-4">${metaDiariaBruta.toFixed(0)}</p>
                   
                   <div className="bg-black/10 rounded-2xl p-4 mb-4 text-left space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold opacity-80">
                         <span>Insumos a separar:</span>
                         <span className="text-red-900">-${insumosDiariosEstimados.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black border-t border-black/10 pt-2">
                         <span>Ganancia Libre (Meta):</span>
                         <span>${metaDiariaLibre.toFixed(0)}</span>
                      </div>
                   </div>

                   <p className="text-[9px] font-bold leading-relaxed opacity-70">
                     *Calculado usando tu regla estándar: 70% ganancia, 30% insumos.
                   </p>
                 </>
               )}
            </div>
          </div>
        </section>

      </div>
    </main>
  </LockScreen>
  );
}