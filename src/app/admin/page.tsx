'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LockScreen from '@/components/LockScreen';
import { 
  LayoutGrid, Megaphone, Save, Image as ImageIcon, 
  Clock, CheckCircle, Plus, Power, Trash2, Tag, 
  ShieldAlert, PackagePlus, Loader2 
} from 'lucide-react';

export default function AdminPage() {
  const [pestana, setPestana] = useState<'menu' | 'promos'>('menu');
  const [productos, setProductos] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Estados para crear producto nuevo
  const [creandoProducto, setCreandoProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', precio_venta: '', categoria: 'caliente', horario: 'siempre'
  });

  // Estados para Promociones
  const [promos, setPromos] = useState<any[]>([]);
  const [creandoPromo, setCreandoPromo] = useState(false);
  const [nuevaPromo, setNuevaPromo] = useState({
    titulo: '', descripcion: '', precio: '', tipo: 'combo', condicion: ''
  });

  useEffect(() => {
    fetchProductos();
    fetchPromos();
    
    const sub = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => fetchProductos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promociones' }, () => fetchPromos())
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function fetchProductos() {
    const { data } = await supabase.from('productos').select('*').order('categoria', { ascending: true });
    setProductos(data || []);
  }

  async function fetchPromos() {
    const { data } = await supabase.from('promociones').select('*').order('created_at', { ascending: false });
    setPromos(data || []);
  }

  // --- LÓGICA DE PRODUCTOS ---
  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoProducto(true);
    try {
      const { error } = await supabase.from('productos').insert([{
        nombre: nuevoProducto.nombre,
        precio_venta: Number(nuevoProducto.precio_venta),
        categoria: nuevoProducto.categoria,
        horario: nuevoProducto.horario
      }]);
      if (error) throw error;
      setNuevoProducto({ nombre: '', precio_venta: '', categoria: 'caliente', horario: 'siempre' });
      fetchProductos();
      mostrarMensaje('Producto agregado');
    } catch (err: any) { 
      console.error(err);
      alert('Error al crear producto: ' + (err.message || JSON.stringify(err))); 
    } 
    finally { setCreandoProducto(false); }
  };

  const borrarProducto = async (id: string) => {
    if(!confirm('¿Eliminar este producto permanentemente?')) return;
    await supabase.from('productos').delete().eq('id', id);
    fetchProductos();
  };

  const actualizarProductoLocal = (index: number, campo: string, valor: any) => {
    const nuevos = [...productos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setProductos(nuevos);
  };

  const guardarCambiosMenu = async () => {
    setGuardando(true);
    let conteoErrores = 0;
    let mensajeError = '';

    try {
      // Usamos Promise.all para ejecutar actualizaciones en paralelo (Más rápido que un ciclo for tradicional)
      const promesas = productos.map(async (p) => {
        // Validación matemática: Forzamos la conversión a número puro para evitar rechazos en BD
        const precioNumerico = Number(p.precio_venta);
        
        if (isNaN(precioNumerico)) {
          throw new Error(`El precio de ${p.nombre} no es un número válido.`);
        }

        const { error } = await supabase.from('productos').update({
          precio_venta: precioNumerico,
          imagen_url: p.imagen_url,
          horario: p.horario
        }).eq('id', p.id);

        if (error) {
          console.error(`Fallo en la matriz al actualizar ${p.nombre}:`, error);
          conteoErrores++;
          mensajeError = error.message; // Capturamos el grito real de la base de datos
        }
      });

      await Promise.all(promesas);

      if (conteoErrores > 0) {
        // Rompemos la ilusión: Forzamos el salto al bloque catch
        throw new Error(mensajeError || `Falló la actualización de ${conteoErrores} productos.`);
      }

      mostrarMensaje('¡Sincronización con BD exitosa!');
    } catch (error: any) { 
      console.error('Telemetría de Error:', error);
      mostrarMensaje('Error de sistema: Revisa la consola'); 
      alert(`Fallo Crítico: ${error.message}`); // Te mostrará si es un problema de permisos RLS
    } 
    finally { 
      setGuardando(false); 
    }
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
        activa: true
      }]);
      setNuevaPromo({ titulo: '', descripcion: '', precio: '', tipo: 'combo', condicion: '' });
      fetchPromos();
      mostrarMensaje('Promoción publicada');
    } catch (err) { alert('Error'); } 
    finally { setCreandoPromo(false); }
  };

  const togglePromo = async (id: string, estadoActual: boolean) => {
    await supabase.from('promociones').update({ activa: !estadoActual }).eq('id', id);
    fetchPromos();
  };

  const eliminarPromo = async (id: string) => {
    if(!confirm('¿Borrar promo?')) return;
    await supabase.from('promociones').delete().eq('id', id);
    fetchPromos();
  };

  const mostrarMensaje = (msj: string) => {
    setMensaje(msj);
    setTimeout(() => setMensaje(''), 3000);
  };

  return (
    <LockScreen titulo="Centro de Control Súa">
      <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-4 md:p-12 font-sans relative">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#CBA36A]/20 pb-8">
            <div>
              <h1 className="text-4xl font-serif text-white">Operaciones</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">Súa Refugio y Café</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-full">
              <button onClick={() => setPestana('menu')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pestana === 'menu' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><LayoutGrid size={14} /> Menú</button>
              <button onClick={() => setPestana('promos')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pestana === 'promos' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Megaphone size={14} /> Promos</button>
            </div>
          </header>

          {mensaje && <div className="bg-[#CBA36A]/10 border border-[#CBA36A]/50 text-[#CBA36A] p-4 rounded-2xl flex items-center gap-2 text-sm font-bold justify-center fixed top-24 left-1/2 -translate-x-1/2 z-[100] shadow-2xl animate-in slide-in-from-top-4"><CheckCircle size={18} /> {mensaje}</div>}

          {/* 🍽️ GESTOR DE MENÚ */}
          {pestana === 'menu' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
              
              {/* Formulario Nuevo Producto */}
              <div className="lg:col-span-1 bg-[#0A130D] p-6 rounded-[2.5rem] border border-[#CBA36A]/30 h-fit sticky top-32 shadow-2xl">
                <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><PackagePlus size={20}/> Nuevo Item</h2>
                <form onSubmit={handleCrearProducto} className="space-y-4">
                  <input required placeholder="Nombre" value={nuevoProducto.nombre} onChange={e=>setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] text-sm" />
                  <input required type="number" placeholder="Precio ($)" value={nuevoProducto.precio_venta} onChange={e=>setNuevoProducto({...nuevoProducto, precio_venta: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] font-serif" />
                  <select value={nuevoProducto.categoria} onChange={e=>setNuevoProducto({...nuevoProducto, categoria: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs">
                    <option value="caliente">Caliente</option>
                    <option value="frio">Frío</option>
                    <option value="frappe">Frappé</option>
                    <option value="pan">Panadería</option>
                  </select>
                  <button type="submit" disabled={creandoProducto} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest mt-2 active:scale-95 transition-all">
                    {creandoProducto ? <Loader2 className="animate-spin mx-auto"/> : 'Agregar al Menú'}
                  </button>
                </form>
              </div>

              {/* Tabla de Edición */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex justify-between items-center bg-[#0A130D] p-5 rounded-[2rem] border border-white/10">
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Edición de precios y visuales</p>
                  <button onClick={guardarCambiosMenu} disabled={guardando} className="bg-white/10 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#CBA36A] hover:text-black transition-all">
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
                
                <div className="bg-[#0A130D] rounded-[2rem] border border-white/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-[#CBA36A]">
                        <th className="p-4">Producto</th>
                        <th className="p-4 w-28">Precio</th>
                        <th className="p-4 w-32">Horario</th>
                        <th className="p-4">URL Imagen</th>
                        <th className="p-4 w-16 text-center"></th>
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
                            <input type="number" value={p.precio_venta} onChange={(e) => actualizarProductoLocal(index, 'precio_venta', e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-white text-lg" />
                          </td>
                          <td className="p-4">
                            <select value={p.horario || 'siempre'} onChange={(e) => actualizarProductoLocal(index, 'horario', e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-white text-[10px] font-bold uppercase">
                              <option value="siempre">Siempre</option>
                              <option value="mañana">Mañana</option>
                              <option value="noche">Noche</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <input type="text" value={p.imagen_url || ''} onChange={(e) => actualizarProductoLocal(index, 'imagen_url', e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-white text-[10px]" placeholder="Link de foto..." />
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

          {/* 📢 GESTOR DE PROMOS (Igual que antes pero con campo restricción) */}
          {pestana === 'promos' && (
             /* Aquí va el código de promos que ya teníamos pero ajustado al diseño nuevo */
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
                <div className="md:col-span-1 bg-[#0A130D] p-6 rounded-[2.5rem] border border-[#CBA36A]/30 h-fit sticky top-32 shadow-2xl">
                   <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2"><Tag size={20}/> Nueva Promo</h2>
                   <form onSubmit={handleCrearPromo} className="space-y-4">
                      <input required placeholder="Título (Ej. Combo Estudiante)" value={nuevaPromo.titulo} onChange={e=>setNuevaPromo({...nuevaPromo, titulo: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] text-sm" />
                      <textarea required rows={3} placeholder="Descripción (Usa Enter)" value={nuevaPromo.descripcion} onChange={e=>setNuevaPromo({...nuevaPromo, descripcion: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] text-sm resize-none" />
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="number" placeholder="Precio ($)" value={nuevaPromo.precio} onChange={e=>setNuevaPromo({...nuevaPromo, precio: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-serif" />
                        <select value={nuevaPromo.tipo} onChange={e=>setNuevaPromo({...nuevaPromo, tipo: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-[10px] font-bold uppercase">
                          <option value="combo">Combo</option>
                          <option value="flash">Flash</option>
                          <option value="condicional">Condicional</option>
                        </select>
                      </div>
                      <input placeholder="Restricción (Ej. Con Credencial)" value={nuevaPromo.condicion} onChange={e=>setNuevaPromo({...nuevaPromo, condicion: e.target.value})} className="w-full bg-[#CBA36A]/5 border border-[#CBA36A]/30 p-3 rounded-xl text-[#CBA36A] text-xs outline-none" />
                      <button type="submit" disabled={creandoPromo} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest mt-2 active:scale-95 transition-all">
                        {creandoPromo ? <Loader2 className="animate-spin mx-auto"/> : 'Publicar'}
                      </button>
                   </form>
                </div>

                <div className="md:col-span-2 space-y-4">
                   {promos.map(promo => (
                      <div key={promo.id} className={`p-6 rounded-[2rem] border transition-all flex justify-between items-center ${promo.activa ? 'bg-[#050A06] border-[#CBA36A]/30' : 'bg-black border-white/10 opacity-50 grayscale'}`}>
                         <div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${promo.activa ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{promo.activa ? 'Visible' : 'Off'}</span>
                            <h3 className="text-xl font-serif text-white mt-1">{promo.titulo}</h3>
                            {promo.condicion && <p className="text-[9px] text-[#CBA36A] font-black uppercase tracking-widest mt-1 flex items-center gap-1"><ShieldAlert size={10}/> {promo.condicion}</p>}
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-2xl font-serif text-[#CBA36A]">${promo.precio}</span>
                            <button onClick={()=>togglePromo(promo.id, promo.activa)} className="p-3 bg-white/5 rounded-full hover:bg-white/10"><Power size={18}/></button>
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