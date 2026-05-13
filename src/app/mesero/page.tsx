'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Coffee, CupSoda, Snowflake, Croissant, LayoutGrid, X, Check,
  Send, UserCircle, Phone, ListOrdered, Trash2
} from 'lucide-react';

export default function MeseroPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categoria, setCategoria] = useState('todos');
  const [carrito, setCarrito] = useState<any[]>([]);

  // Datos del Pedido
  const [mesa, setMesa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Estados del Modal de Extras
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [extraDeslactosada, setExtraDeslactosada] = useState(false);
  const [extraShot, setExtraShot] = useState(false);
  const [extraCrema, setExtraCrema] = useState(false);
  const [saborJarabe, setSaborJarabe] = useState(''); // 'Vainilla', 'Caramelo', 'Avellana'

  // Notificación (Toast)
  const [notificacion, setNotificacion] = useState<{ visible: boolean, mensaje: string }>({ visible: false, mensaje: '' });

  useEffect(() => {
    async function fetchProductos() {
      let peticion = supabase.from('productos').select('*');

      if (categoria === 'caliente') peticion = peticion.ilike('categoria', '%alient%');
      else if (categoria === 'frio') peticion = peticion.or('categoria.ilike.%frio%,categoria.ilike.%frío%');
      else if (categoria === 'frappe') peticion = peticion.or('categoria.ilike.%frappe%,categoria.ilike.%frappé%,categoria.ilike.%frap%');
      else if (categoria === 'pan') peticion = peticion.ilike('categoria', '%pan%');

      const { data } = await peticion;
      setProductos(data || []);
    }
    fetchProductos();
  }, [categoria]);

  const mostrarNotificacion = (mensaje: string) => {
    setNotificacion({ visible: true, mensaje });
    setTimeout(() => setNotificacion({ visible: false, mensaje: '' }), 3000);
  };

  const confirmarAgregarAlCarrito = () => {
    if (!itemSeleccionado) return;

    let costoExtras = 0;
    let extrasNombres = [];

    if (extraDeslactosada) { costoExtras += 10; extrasNombres.push("Deslactosada"); }
    if (extraShot) { costoExtras += 10; extrasNombres.push("Doble Shot"); }

    const esFrappe = itemSeleccionado.categoria.toLowerCase().includes('frap');
    if (extraCrema) {
      if (!esFrappe) costoExtras += 10;
      extrasNombres.push(esFrappe ? "Crema Batida (Gratis)" : "Crema Batida");
    }

    if (saborJarabe) {
      costoExtras += 15; // Precio ejemplo por jarabe
      extrasNombres.push(`Jarabe ${saborJarabe}`);
    }

    const productoFinal = {
      ...itemSeleccionado,
      id_carrito: Math.random().toString(36).substr(2, 9),
      precio_final: Number(itemSeleccionado.precio_venta) + costoExtras,
      extras_str: extrasNombres.join(", ")
    };

    setCarrito([...carrito, productoFinal]);

    // Cerrar modal y limpiar
    setItemSeleccionado(null);
    setExtraDeslactosada(false); setExtraShot(false); setExtraCrema(false); setSaborJarabe('');

    mostrarNotificacion(`${itemSeleccionado.nombre} agregado`);
  };

  const abrirModal = (producto: any) => {
    // Si es pan, se agrega directo
    if (producto.categoria.toLowerCase().includes('pan')) {
      const productoFinal = { ...producto, id_carrito: Math.random().toString(36).substr(2, 9), precio_final: Number(producto.precio_venta), extras_str: "" };
      setCarrito([...carrito, productoFinal]);
      mostrarNotificacion(`${producto.nombre} agregado`);
    } else {
      setItemSeleccionado(producto);
    }
  };

  const eliminarDelCarrito = (idx: number) => {
    setCarrito(carrito.filter((_, i) => i !== idx));
  };

  const enviarOrden = async () => {
    if (!mesa) return alert('Por favor ingresa el número de mesa.');
    if (carrito.length === 0) return alert('La orden está vacía.');

    setEnviando(true);
    try {
      const total = carrito.reduce((acc, item) => acc + item.precio_final, 0);

      // Si se proporcionó teléfono, checar si existe cliente (registro silencioso)
      if (telefono) {
        const { data: clienteExiste } = await supabase.from('clientes').select('*').eq('telefono', telefono).single();
        if (!clienteExiste) {
          await supabase.from('clientes').insert([{ telefono, nombre: `Cliente Mesa ${mesa}`, visitas: 0 }]);
        }
      }

      const { error } = await supabase.from('pedidos').insert([{
        cliente_nombre: `Mesa ${mesa}`,
        telefono: telefono || '0000000000', // Teléfono default si no lo da
        hora_recogida: 'Local',
        items: carrito,
        total: total,
        estado: 'pendiente'
      }]);

      if (error) throw error;

      // Limpiar todo después de enviar con éxito
      setCarrito([]);
      setMesa('');
      setTelefono('');
      mostrarNotificacion('¡Orden enviada a cocina!');

    } catch (err) {
      console.error(err);
      alert('Error al enviar la orden.');
    } finally {
      setEnviando(false);
    }
  };

  const esFrappe = itemSeleccionado?.categoria?.toLowerCase().includes('frap');
  const costoTotalModal = itemSeleccionado ?
    Number(itemSeleccionado.precio_venta) +
    (extraDeslactosada ? 10 : 0) +
    (extraShot ? 10 : 0) +
    (extraCrema && !esFrappe ? 10 : 0) +
    (saborJarabe ? 15 : 0) : 0;

  return (
    <main className="min-h-screen bg-[#060B08] flex flex-col md:flex-row text-[#CBA36A] font-sans selection:bg-[#CBA36A] selection:text-black">

      {/* 🛎️ SECCIÓN IZQUIERDA: MENÚ Y CATEGORÍAS */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen pb-40 md:pb-8">
        <header className="mb-8 border-b border-[#CBA36A]/20 pb-4">
          <h1 className="text-3xl font-serif text-white mb-2">Toma de Órdenes</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#CBA36A]/60">Interfaz para Meseros Súa</p>
        </header>

        {/* 🗂️ FILTROS */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
          {[
            { id: 'todos', label: 'Todo', icon: <LayoutGrid size={14} /> },
            { id: 'caliente', label: 'Calientes', icon: <Coffee size={14} /> },
            { id: 'frio', label: 'Fríos', icon: <CupSoda size={14} /> },
            { id: 'frappe', label: 'Frappés', icon: <Snowflake size={14} /> },
            { id: 'pan', label: 'Pan', icon: <Croissant size={14} /> },
          ].map((filtro) => (
            <button key={filtro.id} onClick={() => setCategoria(filtro.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoria === filtro.id ? 'bg-[#CBA36A] text-[#0A130D]' : 'bg-[#0A130D] border border-white/10 text-white hover:border-[#CBA36A]/50'}`}>
              {filtro.icon} {filtro.label}
            </button>
          ))}
        </div>

        {/* ☕ PRODUCTOS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {productos.map((producto) => (
            <button key={producto.id} onClick={() => abrirModal(producto)} className="bg-[#0A130D] border border-white/10 p-4 rounded-2xl text-left hover:border-[#CBA36A]/50 transition-colors group flex flex-col h-full">
              <span className="text-[8px] bg-white/5 text-white/50 px-2 py-1 rounded-md uppercase tracking-widest mb-2 inline-block">{producto.categoria}</span>
              <h3 className="text-sm font-bold text-white mb-2 group-hover:text-[#CBA36A] transition-colors">{producto.nombre}</h3>
              <div className="mt-auto pt-3 border-t border-white/5 w-full flex justify-between items-center">
                <span className="text-[#CBA36A] font-serif">${producto.precio_venta}</span>
                <div className="w-6 h-6 rounded-full bg-[#CBA36A]/10 text-[#CBA36A] flex items-center justify-center text-sm group-hover:bg-[#CBA36A] group-hover:text-black transition-colors">+</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 🧾 SECCIÓN DERECHA: LA ORDEN / COMANDA */}
      <div className="w-full md:w-96 bg-[#0A130D] border-t md:border-t-0 md:border-l border-[#CBA36A]/20 flex flex-col max-h-screen z-40 relative shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">

        {/* CABECERA COMANDA */}
        <div className="p-6 border-b border-white/10 bg-[#060B08]">
          <h2 className="text-xl font-serif text-white mb-4 flex items-center gap-2"><ListOrdered size={20} className="text-[#CBA36A]" /> Detalles de la Orden</h2>

          <div className="space-y-3">
            <div className="flex items-center bg-black/40 border border-[#CBA36A]/30 rounded-xl px-4 focus-within:border-[#CBA36A] transition-colors">
              <span className="text-[#CBA36A] font-black text-xs uppercase tracking-widest mr-2">Mesa</span>
              <input type="number" placeholder="Ej. 5" value={mesa} onChange={e => setMesa(e.target.value)} className="bg-transparent w-full py-3 text-white font-bold outline-none placeholder-white/20" />
            </div>

            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 focus-within:border-[#CBA36A] transition-colors">
              <Phone size={14} className="text-white/40 mr-2" />
              <input type="tel" placeholder="Teléfono Cliente (Opcional)" value={telefono} onChange={e => setTelefono(e.target.value)} className="bg-transparent w-full py-3 text-white text-sm outline-none placeholder-white/20" />
            </div>
            <p className="text-[8px] text-[#CBA36A] font-black uppercase tracking-widest text-center">Pide el teléfono para sumar visitas de lealtad</p>
          </div>
        </div>

        {/* LISTA DE ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <ListOrdered size={40} className="mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">Comanda Vacía</p>
            </div>
          ) : (
            carrito.map((item, idx) => (
              <div key={idx} className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between group">
                <div className="flex-1 pr-2">
                  <p className="text-sm font-bold text-white uppercase">{item.nombre}</p>
                  {item.extras_str && <p className="text-[9px] text-[#CBA36A] mt-1">{item.extras_str}</p>}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="text-white font-serif">${item.precio_final}</span>
                  <button onClick={() => eliminarDelCarrito(idx)} className="text-red-500/50 hover:text-red-500 mt-2"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTAL Y ENVÍO */}
        <div className="p-6 bg-[#060B08] border-t border-white/10">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Total Orden</span>
            <span className="text-3xl font-serif text-white">${carrito.reduce((acc, item) => acc + item.precio_final, 0).toFixed(2)}</span>
          </div>
          <button
            onClick={enviarOrden}
            disabled={enviando || carrito.length === 0}
            className="w-full bg-[#CBA36A] hover:bg-yellow-500 text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {enviando ? 'Enviando...' : <><Send size={16} /> Enviar a Cocina</>}
          </button>
        </div>
      </div>

      {/* 🥛 MODAL DE EXTRAS INTELIGENTE */}
      {itemSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-[#0A130D] border border-[#CBA36A]/30 p-6 md:p-8 rounded-[2rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => { setItemSeleccionado(null); setExtraDeslactosada(false); setExtraShot(false); setExtraCrema(false); setSaborJarabe(''); }} className="absolute top-6 right-6 text-white/50 hover:text-white"><X /></button>
            <h2 className="text-2xl md:text-3xl font-serif mb-1 text-[#CBA36A]">{itemSeleccionado.nombre}</h2>
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-6 border-b border-white/10 pb-4">Personalización del Mesero</p>

            <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <button onClick={() => setExtraDeslactosada(!extraDeslactosada)} className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${extraDeslactosada ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-white' : 'border-white/10 text-white/60 hover:border-white/30'}`}>
                <span className="font-bold text-sm">Cambiar a Deslactosada</span>
                <span className="text-[#CBA36A] font-serif">+$10</span>
              </button>

              <button onClick={() => setExtraShot(!extraShot)} className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${extraShot ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-white' : 'border-white/10 text-white/60 hover:border-white/30'}`}>
                <span className="font-bold text-sm">Doble Shot Expreso</span>
                <span className="text-[#CBA36A] font-serif">+$10</span>
              </button>

              <button onClick={() => setExtraCrema(!extraCrema)} className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${extraCrema ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-white' : 'border-white/10 text-white/60 hover:border-white/30'}`}>
                <span className="font-bold text-sm">Crema Batida</span>
                <span className="text-[#CBA36A] font-serif">{esFrappe ? 'Gratis' : '+$10'}</span>
              </button>

              {/* JARABES DE SABORES */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-3">Jarabes de Sabor (+ $15.00)</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Vainilla', 'Caramelo', 'Avellana', 'Crema Irlandesa'].map(sabor => (
                    <button
                      key={sabor}
                      onClick={() => setSaborJarabe(saborJarabe === sabor ? '' : sabor)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${saborJarabe === sabor ? 'bg-[#CBA36A] text-black border-[#CBA36A]' : 'bg-black/40 text-white/60 border-white/10 hover:border-white/30'}`}
                    >
                      {sabor}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={confirmarAgregarAlCarrito} className="w-full bg-[#CBA36A] text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-lg">
              Añadir a Orden • ${costoTotalModal.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* 🔔 LA NOTIFICACIÓN ELEGANTE (Toast) */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-[#CBA36A] text-[#0A130D] px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2 transition-all duration-500 transform ${notificacion.visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <Check size={16} /> {notificacion.mensaje}
      </div>

    </main>
  );
}
