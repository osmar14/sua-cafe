'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LockScreen from '@/components/LockScreen';
import { LayoutGrid, Megaphone, Save, Image as ImageIcon, Clock, CheckCircle, Plus, Power, Trash2, Tag, ShieldAlert } from 'lucide-react';

export default function AdminPage() {
  const [pestana, setPestana] = useState<'menu' | 'promos'>('menu');
  const [productos, setProductos] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [promos, setPromos] = useState<any[]>([]);
  const [creandoPromo, setCreandoPromo] = useState(false);
  const [nuevaPromo, setNuevaPromo] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    tipo: 'combo',
    condicion: ''
  });

  useEffect(() => {
    fetchProductos();
    fetchPromos();
  }, []);

  async function fetchProductos() {
    const { data } = await supabase.from('productos').select('*').order('categoria', { ascending: true });
    setProductos(data || []);
  }

  async function fetchPromos() {
    const { data } = await supabase.from('promociones').select('*').order('created_at', { ascending: false });
    setPromos(data || []);
  }

  const actualizarProducto = (index: number, campo: string, valor: any) => {
    const nuevos = [...productos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setProductos(nuevos);
  };

  const guardarCambiosMenu = async () => {
    setGuardando(true);
    try {
      for (const p of productos) {
        await supabase.from('productos').update({ precio_venta: p.precio_venta, imagen_url: p.imagen_url, horario: p.horario }).eq('id', p.id);
      }
      mostrarMensaje('¡Menú actualizado con éxito!');
    } catch (error) {
      mostrarMensaje('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoPromo(true);
    try {
      const { error } = await supabase.from('promociones').insert([{
        titulo: nuevaPromo.titulo,
        descripcion: nuevaPromo.descripcion,
        precio: Number(nuevaPromo.precio),
        tipo: nuevaPromo.tipo,
        condicion: nuevaPromo.condicion,
        activa: true
      }]);
      if (error) throw error;
      
      mostrarMensaje('Promoción creada con éxito');
      setNuevaPromo({ titulo: '', descripcion: '', precio: '', tipo: 'combo', condicion: '' });
      fetchPromos();
    } catch (error) {
      mostrarMensaje('Error al crear promoción');
    } finally {
      setCreandoPromo(false);
    }
  };

  const togglePromo = async (id: string, estadoActual: boolean) => {
    await supabase.from('promociones').update({ activa: !estadoActual }).eq('id', id);
    fetchPromos();
  };

  const eliminarPromo = async (id: string) => {
    if(!confirm('¿Estás seguro de eliminar esta promoción?')) return;
    await supabase.from('promociones').delete().eq('id', id);
    fetchPromos();
  };

  const mostrarMensaje = (msj: string) => {
    setMensaje(msj);
    setTimeout(() => setMensaje(''), 3000);
  };

  return (
    <LockScreen titulo="Centro de Control Súa">
      <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-6 md:p-12 font-sans relative">
        <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-5 bg-cover pointer-events-none grayscale"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#CBA36A]/20 pb-8">
            <div>
              <h1 className="text-4xl font-serif text-white">Operaciones</h1>
            </div>
            <div className="flex bg-white/5 p-1 rounded-full">
              <button onClick={() => setPestana('menu')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pestana === 'menu' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><LayoutGrid size={14} /> Menú Digital</button>
              <button onClick={() => setPestana('promos')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pestana === 'promos' ? 'bg-[#CBA36A] text-[#0A130D]' : 'text-white/50 hover:text-white'}`}><Megaphone size={14} /> Promociones</button>
            </div>
          </header>

          {mensaje && <div className="bg-[#CBA36A]/10 border border-[#CBA36A]/50 text-[#CBA36A] p-4 rounded-2xl flex items-center gap-2 text-sm font-bold justify-center"><CheckCircle size={18} /> {mensaje}</div>}

          {pestana === 'menu' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center bg-[#0A130D] p-6 rounded-[2rem] border border-[#CBA36A]/30">
                <p className="text-sm text-white/70">Asigna horarios, actualiza precios y añade URLs de imágenes.</p>
                <button onClick={guardarCambiosMenu} disabled={guardando} className="bg-[#CBA36A] text-black px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">{guardando ? 'Guardando...' : <><Save size={14} /> Guardar Menú</>}</button>
              </div>
              <div className="bg-[#0A130D] rounded-[2rem] border border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-[#CBA36A]"><th className="p-4">Producto</th><th className="p-4 w-32">Precio ($)</th><th className="p-4 w-40">Horario</th><th className="p-4">URL Imagen</th></tr></thead>
                  <tbody className="text-sm">
                    {productos.map((p, index) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4"><p className="font-bold text-white">{p.nombre}</p><p className="text-[9px] uppercase text-white/40">{p.categoria}</p></td>
                        <td className="p-4"><input type="number" value={p.precio_venta} onChange={(e) => actualizarProducto(index, 'precio_venta', e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-white" /></td>
                        <td className="p-4"><select value={p.horario || 'siempre'} onChange={(e) => actualizarProducto(index, 'horario', e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-white text-xs"><option value="siempre">Siempre</option><option value="mañana">Solo Mañana</option><option value="noche">Solo Noche</option></select></td>
                        <td className="p-4"><input type="text" value={p.imagen_url || ''} onChange={(e) => actualizarProducto(index, 'imagen_url', e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded-lg text-white text-xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pestana === 'promos' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
              <div className="md:col-span-1 bg-[#0A130D] p-6 rounded-[2.5rem] border border-[#CBA36A]/30 h-fit sticky top-24 shadow-2xl">
                <h2 className="text-2xl font-serif text-white mb-2 flex items-center gap-2"><Tag className="text-[#CBA36A]"/> Nueva Promo</h2>
                <form onSubmit={handleCrearPromo} className="space-y-4 mt-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBA36A]">Título (Ej. Combo Imperial)</label>
                    <input required type="text" value={nuevaPromo.titulo} onChange={e => setNuevaPromo({...nuevaPromo, titulo: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#CBA36A]">Descripción (Usa "Enter" para separar artículos)</label>
                    <textarea required rows={3} placeholder="Moka Imperial&#10;Rol de Canela" value={nuevaPromo.descripcion} onChange={e => setNuevaPromo({...nuevaPromo, descripcion: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] mt-1 resize-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#CBA36A]">Precio ($)</label>
                      <input required type="number" value={nuevaPromo.precio} onChange={e => setNuevaPromo({...nuevaPromo, precio: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] mt-1 font-serif" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#CBA36A]">Tipo</label>
                      <select value={nuevaPromo.tipo} onChange={e => setNuevaPromo({...nuevaPromo, tipo: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#CBA36A] mt-1 text-xs">
                        <option value="combo">Combo Fijo</option>
                        <option value="flash">Oferta Flash</option>
                        <option value="condicional">Condicional</option>
                      </select>
                    </div>
                  </div>
                  {nuevaPromo.tipo !== 'combo' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold uppercase text-[#CBA36A]">Restricción (Letras Chiquitas)</label>
                      <input type="text" placeholder="Ej. Presenta tu credencial..." value={nuevaPromo.condicion} onChange={e => setNuevaPromo({...nuevaPromo, condicion: e.target.value})} className="w-full bg-black/40 border border-[#CBA36A]/50 p-3 rounded-xl text-white outline-none mt-1 text-xs" />
                    </div>
                  )}
                  <button type="submit" disabled={creandoPromo} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-4 active:scale-95 transition-transform"><Plus size={16} className="inline mr-1"/> Publicar</button>
                </form>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Tus Promociones</h3>
                {promos.map((promo) => (
                  <div key={promo.id} className={`p-6 rounded-[2rem] border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${promo.activa ? 'bg-[#050A06] border-[#CBA36A]/40' : 'bg-black/40 border-white/10 opacity-60'}`}>
                    <div className="flex-1">
                      <div className="flex gap-2 mb-1"><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm ${promo.activa ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{promo.activa ? 'Visible' : 'Apagada'}</span></div>
                      <h4 className="text-2xl font-serif text-white">{promo.titulo}</h4>
                      {promo.condicion && <p className="text-[9px] text-[#CBA36A] uppercase font-bold mt-1 flex items-center gap-1"><ShieldAlert size={10}/> {promo.condicion}</p>}
                    </div>
                    <div className="flex items-center gap-6 border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                      <span className="text-3xl font-serif text-[#CBA36A]">${promo.precio}</span>
                      <div className="flex gap-2">
                        <button onClick={() => togglePromo(promo.id, promo.activa)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black"><Power size={18} /></button>
                        <button onClick={() => eliminarPromo(promo.id)} className="w-10 h-10 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-black"><Trash2 size={18} /></button>
                      </div>
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