'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LockScreen from '@/components/LockScreen';
import { 
  LayoutGrid, Megaphone, CheckCircle, Trash2, Tag, 
  ShieldAlert, PackagePlus, Loader2, Power, Store, Clock
} from 'lucide-react';

export default function AdminPage() {
  const [pestana, setPestana] = useState<'menu' | 'promos'>('menu');
  const [productos, setProductos] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  
  // 🛡️ ESTADO DEL INTERRUPTOR MAESTRO
  const [tiendaAbierta, setTiendaAbierta] = useState<boolean>(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Formularios con variables de tiempo
  const [creandoProducto, setCreandoProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', precio_venta: '', categoria: 'caliente', horario: 'siempre', hora_inicio: '', hora_fin: ''
  });

  const [creandoPromo, setCreandoPromo] = useState(false);
  const [nuevaPromo, setNuevaPromo] = useState({
    titulo: '', descripcion: '', precio: '', tipo: 'combo', condicion: '', hora_inicio: '', hora_fin: ''
  });

  useEffect(() => {
    fetchConfiguracion();
    fetchProductos();
    fetchPromos();
    
    const sub = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => fetchProductos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promociones' }, () => fetchPromos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracion_tienda' }, () => fetchConfiguracion())
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function fetchConfiguracion() {
    const { data } = await supabase.from('configuracion_tienda').select('tienda_abierta').eq('id', 1).single();
    if (data) setTiendaAbierta(data.tienda_abierta);
  }

  async function fetchProductos() {
    const { data } = await supabase.from('productos').select('*').order('categoria', { ascending: true });
    setProductos(data || []);
  }

  async function fetchPromos() {
    const { data } = await supabase.from('promociones').select('*').order('created_at', { ascending: false });
    setPromos(data || []);
  }

  // --- 🔴 CONTROL MAESTRO DE LA CAFETERÍA ---
  const toggleTienda = async () => {
    setCambiandoEstado(true);
    try {
      const nuevoEstado = !tiendaAbierta;
      const { error } = await supabase.from('configuracion_tienda').update({ tienda_abierta: nuevoEstado }).eq('id', 1);
      if (error) throw error;
      setTiendaAbierta(nuevoEstado);
      mostrarMensaje(nuevoEstado ? 'Semáforo Verde: Tienda Abierta' : 'Semáforo Rojo: Tienda Cerrada');
    } catch (error) {
      alert('Error cambiando el estado operativo de la tienda.');
    } finally {
      setCambiandoEstado(false);
    }
  };

  // --- LÓGICA DE PRODUCTOS ---
  const parseTime = (timeStr: string) => (timeStr === '' ? null : timeStr);

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoProducto(true);
    try {
      const { error } = await supabase.from('productos').insert([{
        nombre: nuevoProducto.nombre,
        precio_venta: Number(nuevoProducto.precio_venta),
        categoria: nuevoProducto.categoria,
        horario: nuevoProducto.horario,
        hora_inicio: parseTime(nuevoProducto.hora_inicio),
        hora_fin: parseTime(nuevoProducto.hora_fin)
      }]);
      if (error) throw error;
      setNuevoProducto({ nombre: '', precio_venta: '', categoria: 'caliente', horario: 'siempre', hora_inicio: '', hora_fin: '' });
      mostrarMensaje('Producto agregado');
    } catch (err: any) { 
      alert('Error al crear producto: ' + err.message); 
    } finally { setCreandoProducto(false); }
  };

  const borrarProducto = async (id: string) => {
    if(!confirm('¿Eliminar este producto permanentemente?')) return;
    await supabase.from('productos').delete().eq('id', id);
  };

  const actualizarProductoLocal = (index: number, campo: string, valor: any) => {
    const nuevos = [...productos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setProductos(nuevos);
  };

  const guardarCambiosMenu = async () => {
    setGuardando(true);
    let conteoErrores = 0;
    try {
      const promesas = productos.map(async (p) => {
        const precioNumerico = Number(p.precio_venta);
        if (isNaN(precioNumerico)) throw new Error(`El precio de ${p.nombre} es inválido.`);

        const { error } = await supabase.from('productos').update({
          precio_venta: precioNumerico,
          imagen_url: p.imagen_url,
          horario: p.horario,
          hora_inicio: parseTime(p.hora_inicio || ''),
          hora_fin: parseTime(p.hora_fin || '')
        }).eq('id', p.id);

        if (error) conteoErrores++;
      });
      await Promise.all(promesas);
      if (conteoErrores > 0) throw new Error('Fallaron algunas actualizaciones.');
      mostrarMensaje('¡Sincronización con BD exitosa!');
    } catch (error: any) { 
      alert(`Fallo Crítico: ${error.message}`);
    } finally { setGuardando(false); }
  };

  // --- LÓGICA DE PROMOCIONES ---
  const handleCrearPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoPromo(true);
    try {
      await supabase.from('promociones').insert([{
        titulo: nuevaPromo.titulo,
        descripcion: nuevaPromo.descripcion,
        precio: Number(nuevaPromo.precio),
        tipo: nuevaPromo.tipo,
        condicion: nuevaPromo.condicion,
        hora_inicio: parseTime(nuevaPromo.hora_inicio),
        hora_fin: parseTime(nuevaPromo.hora_fin),
        activa: true
      }]);
      setNuevaPromo({ titulo: '', descripcion: '', precio: '', tipo: 'combo', condicion: '', hora_inicio: '', hora_fin: '' });
      mostrarMensaje('Promoción publicada');
    } catch (err: any) { alert(`Error: ${err.message}`); } 
    finally { setCreandoPromo(false); }
  };

  const togglePromo = async (id: string, estadoActual: boolean) => {
    await supabase.from('promociones').update({ activa: !estadoActual }).eq('id', id);
  };

  const eliminarPromo = async (id: string) => {
    if(!confirm('¿Borrar promo?')) return;
    await supabase.from('promociones').delete().eq('id', id);
  };

  const mostrarMensaje = (msj: string) => {
    setMensaje(msj);
    setTimeout(() => setMensaje(''), 4000);
  };

  return (
    <LockScreen titulo="Centro de Control Súa">
      <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-4 md:p-12 font-sans relative">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto space-y-8 pb-32">
          
          <header className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-[#CBA36A]/20 pb-8">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-serif text-white">Operaciones</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">Sistema de Gestión Logística</p>
            </div>
            
            {/* 🔴 INTERRUPTOR MAESTRO */}
            <div className="flex items-center gap-4 bg-[#0A130D] p-3 rounded-full border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 px-4">
                <Store size={18} className={tiendaAbierta ? 'text-green-500' : 'text-red-500'} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  Estado: {tiendaAbierta ? 'Operando' : 'Cerrado'}
                </span>
              </div>
              <button 
                onClick={toggleTienda} 
                disabled={cambiandoEstado}
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${tiendaAbierta ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'} border`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 ${tiendaAbierta ? 'translate-x-8 bg-green-500' : 'translate-x-0 bg-red-500'}`}></div>
              </button>
            </div>

            <div className="flex bg-white/5 p-1 rounded-full">
              <button onClick={() => setPestana('menu')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pestana === 'menu' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><LayoutGrid size={14} /> Menú</button>
              <button onClick={() => setPestana('promos')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pestana === 'promos' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Megaphone size={14} /> Promos</button>
            </div>
          </header>

          {mensaje && <div className="bg-[#CBA36A]/10 border border-[#CBA36A]/50 text-[#CBA36A] p-4 rounded-2xl flex items-center gap-2 text-sm font-bold justify-center fixed top-24 left-1/2 -translate-x-1/2 z-[100] shadow-2xl animate-in slide-in-from-top-4"><CheckCircle size={18} /> {mensaje}</div>}

          {/* 🍽️ GESTOR DE MENÚ */}
          {pestana === 'menu' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
              
              <div className="xl:col-span-1 bg-[#0A130D] p-6 rounded-[2.5rem] border border-[#CBA36A]/30 h-fit sticky top-32 shadow-2xl">
                <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><PackagePlus size={20}/> Nuevo Ítem</h2>
                <form onSubmit={handleCrearProducto} className="space-y-4">
                  <input required placeholder="Nombre" value={nuevoProducto.nombre} onChange={e=>setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="number" placeholder="Precio ($)" value={nuevoProducto.precio_venta} onChange={e=>setNuevoProducto({...nuevoProducto, precio_venta: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] font-serif" />
                    <select value={nuevoProducto.categoria} onChange={e=>setNuevoProducto({...nuevoProducto, categoria: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-3 rounded-xl text-white text-[10px] uppercase font-bold">
                      <option value="caliente">Caliente</option>
                      <option value="frio">Frío</option>
                      <option value="frappe">Frappé</option>
                      <option value="pan">Panadería</option>
                    </select>
                  </div>
                  
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-[#CBA36A]/70 mb-2 flex items-center gap-1"><Clock size={12}/> Disponibilidad (Opcional)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" title="Hora Inicio" value={nuevoProducto.hora_inicio} onChange={e=>setNuevoProducto({...nuevoProducto, hora_inicio: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white/70 text-xs outline-none focus:border-[#CBA36A]" />
                      <input type="time" title="Hora Fin" value={nuevoProducto.hora_fin} onChange={e=>setNuevoProducto({...nuevoProducto, hora_fin: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white/70 text-xs outline-none focus:border-[#CBA36A]" />
                    </div>
                  </div>

                  <button type="submit" disabled={creandoProducto} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest mt-2 active:scale-95 transition-all">
                    {creandoProducto ? <Loader2 className="animate-spin mx-auto"/> : 'Agregar al Menú'}
                  </button>
                </form>
              </div>

              <div className="xl:col-span-3 space-y-4">
                <div className="flex justify-between items-center bg-[#0A130D] p-5 rounded-[2rem] border border-white/10">
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Editor de Precios y Tiempos</p>
                  <button onClick={guardarCambiosMenu} disabled={guardando} className="bg-white/10 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#CBA36A] hover:text-black transition-all">
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
                
                <div className="bg-[#0A130D] rounded-[2rem] border border-white/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-[#CBA36A]">
                        <th className="p-4">Producto</th>
                        <th className="p-4 w-24">Precio</th>
                        <th className="p-4 w-24">Inicio</th>
                        <th className="p-4 w-24">Fin</th>
                        <th className="p-4">URL Imagen</th>
                        <th className="p-4 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {productos.map((p, index) => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="p-4">
                            <p className="font-bold text-white leading-none mb-1">{p.nombre}</p>
                            <span className="text-[8px] uppercase px-1.5 py-0.5 bg-white/5 rounded text-white/40 font-black">{p.categoria}</span>
                          </td>
                          <td className="p-4 font-serif">
                            <input type="number" value={p.precio_venta} onChange={(e) => actualizarProductoLocal(index, 'precio_venta', e.target.value)} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white text-lg outline-none focus:border-[#CBA36A]" />
                          </td>
                          <td className="p-4">
                            <input type="time" value={p.hora_inicio || ''} onChange={(e) => actualizarProductoLocal(index, 'hora_inicio', e.target.value)} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white/70 text-xs outline-none focus:border-[#CBA36A]" />
                          </td>
                          <td className="p-4">
                            <input type="time" value={p.hora_fin || ''} onChange={(e) => actualizarProductoLocal(index, 'hora_fin', e.target.value)} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white/70 text-xs outline-none focus:border-[#CBA36A]" />
                          </td>
                          <td className="p-4">
                            <input type="text" value={p.imagen_url || ''} onChange={(e) => actualizarProductoLocal(index, 'imagen_url', e.target.value)} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white/50 text-[10px] outline-none focus:border-[#CBA36A]" placeholder="Link..." />
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => borrarProducto(p.id)} className="p-2 text-red-900 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 📢 GESTOR DE PROMOS */}
          {pestana === 'promos' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
                <div className="md:col-span-1 bg-[#0A130D] p-6 rounded-[2.5rem] border border-[#CBA36A]/30 h-fit sticky top-32 shadow-2xl">
                   <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><Tag size={20}/> Nueva Promo</h2>
                   <form onSubmit={handleCrearPromo} className="space-y-4">
                      <input required placeholder="Título" value={nuevaPromo.titulo} onChange={e=>setNuevaPromo({...nuevaPromo, titulo: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] text-sm" />
                      <textarea required rows={2} placeholder="Descripción" value={nuevaPromo.descripcion} onChange={e=>setNuevaPromo({...nuevaPromo, descripcion: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] text-sm resize-none" />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input required type="number" placeholder="Precio ($)" value={nuevaPromo.precio} onChange={e=>setNuevaPromo({...nuevaPromo, precio: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-3 rounded-xl text-white font-serif outline-none focus:border-[#CBA36A]" />
                        <select value={nuevaPromo.tipo} onChange={e=>setNuevaPromo({...nuevaPromo, tipo: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-3 rounded-xl text-white text-[10px] font-bold uppercase outline-none focus:border-[#CBA36A]">
                          <option value="combo">Combo</option>
                          <option value="flash">Flash</option>
                          <option value="condicional">Condicional</option>
                        </select>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[9px] uppercase tracking-widest text-[#CBA36A]/70 mb-2 flex items-center gap-1"><Clock size={12}/> Disponibilidad (Opcional)</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="time" title="Hora Inicio" value={nuevaPromo.hora_inicio} onChange={e=>setNuevaPromo({...nuevaPromo, hora_inicio: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white/70 text-xs outline-none focus:border-[#CBA36A]" />
                          <input type="time" title="Hora Fin" value={nuevaPromo.hora_fin} onChange={e=>setNuevaPromo({...nuevaPromo, hora_fin: e.target.value})} className="w-full bg-[#050A06] border border-white/10 p-2 rounded-lg text-white/70 text-xs outline-none focus:border-[#CBA36A]" />
                        </div>
                      </div>

                      <input placeholder="Restricción (Ej. Con Credencial)" value={nuevaPromo.condicion} onChange={e=>setNuevaPromo({...nuevaPromo, condicion: e.target.value})} className="w-full bg-[#CBA36A]/5 border border-[#CBA36A]/30 p-3 rounded-xl text-[#CBA36A] text-xs outline-none focus:bg-[#CBA36A]/10" />
                      
                      <button type="submit" disabled={creandoPromo} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest mt-2 active:scale-95 transition-all">
                        {creandoPromo ? <Loader2 className="animate-spin mx-auto"/> : 'Publicar Promo'}
                      </button>
                   </form>
                </div>

                <div className="md:col-span-2 space-y-4">
                   {promos.map(promo => (
                      <div key={promo.id} className={`p-6 rounded-[2rem] border transition-all flex justify-between items-center ${promo.activa ? 'bg-[#050A06] border-[#CBA36A]/30 shadow-lg' : 'bg-black border-white/10 opacity-50 grayscale'}`}>
                         <div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${promo.activa ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{promo.activa ? 'Visible' : 'Off'}</span>
                            <h3 className="text-xl font-serif text-white mt-1">{promo.titulo}</h3>
                            <div className="flex gap-4 mt-2">
                              {promo.condicion && <p className="text-[9px] text-[#CBA36A] font-black uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={10}/> {promo.condicion}</p>}
                              {(promo.hora_inicio || promo.hora_fin) && (
                                <p className="text-[9px] text-white/50 font-black uppercase tracking-widest flex items-center gap-1">
                                  <Clock size={10}/> {promo.hora_inicio || '00:00'} - {promo.hora_fin || '23:59'}
                                </p>
                              )}
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-2xl font-serif text-[#CBA36A]">${promo.precio}</span>
                            <button onClick={()=>togglePromo(promo.id, promo.activa)} className={`p-3 rounded-full transition-colors ${promo.activa ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/20 text-white'}`}><Power size={18}/></button>
                            <button onClick={()=>eliminarPromo(promo.id)} className="p-3 bg-red-900/10 text-red-500 rounded-full hover:bg-red-500 hover:text-black transition-all"><Trash2 size={18}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </main>
    </LockScreen>
  );
}