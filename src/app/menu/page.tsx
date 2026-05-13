'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, ArrowLeft, Coffee, CupSoda, Snowflake, Croissant, LayoutGrid, X, Check } from 'lucide-react';

// Subcomponente para manejar los parámetros de búsqueda sin romper la página
function MenuContent() {
  const searchParams = useSearchParams();
  const categoriaURL = searchParams.get('cat') || 'todos';

  const [productos, setProductos] = useState<any[]>([]);
  const [categoria, setCategoria] = useState(categoriaURL);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  
  // Estados para los extras del modal
  const [extraDeslactosada, setExtraDeslactosada] = useState(false);
  const [extraShot, setExtraShot] = useState(false);
  const [extraCrema, setExtraCrema] = useState(false);

  // Estado para la notificación bonita (Toast)
  const [notificacion, setNotificacion] = useState<{ visible: boolean, mensaje: string }>({ visible: false, mensaje: '' });

  useEffect(() => {
    // Cargar carrito guardado
    const guardado = localStorage.getItem('sua_carrito');
    if (guardado) setCarrito(JSON.parse(guardado));
  }, []);

  useEffect(() => {
    setCategoria(categoriaURL);
  }, [categoriaURL]);

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
    
    const sub = supabase.channel(`menu_${categoria}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => fetchProductos())
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [categoria]);

  // Mostrar notificación bonita
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
    
    // Lógica de Crema Batida (Gratis si es Frappé)
    const esFrappe = itemSeleccionado.categoria.toLowerCase().includes('frap');
    if (extraCrema) {
      if (!esFrappe) costoExtras += 10;
      extrasNombres.push(esFrappe ? "Crema Batida (Gratis)" : "Crema Batida");
    }

    const productoFinal = {
      ...itemSeleccionado,
      id_carrito: Math.random().toString(36).substr(2, 9),
      precio_final: Number(itemSeleccionado.precio_venta) + costoExtras,
      extras_str: extrasNombres.join(", ")
    };

    const nuevoCarrito = [...carrito, productoFinal];
    setCarrito(nuevoCarrito);
    localStorage.setItem('sua_carrito', JSON.stringify(nuevoCarrito));
    
    // Cerrar modal y limpiar
    setItemSeleccionado(null);
    setExtraDeslactosada(false); setExtraShot(false); setExtraCrema(false);
    
    mostrarNotificacion(`${itemSeleccionado.nombre} agregado a tu cuenta`);
  };

  const abrirModal = (producto: any) => {
    // Si es pan, se agrega directo sin preguntar por leche
    if (producto.categoria.toLowerCase().includes('pan')) {
      const productoFinal = { ...producto, id_carrito: Math.random().toString(36).substr(2, 9), precio_final: Number(producto.precio_venta), extras_str: "" };
      const nuevoCarrito = [...carrito, productoFinal];
      setCarrito(nuevoCarrito);
      localStorage.setItem('sua_carrito', JSON.stringify(nuevoCarrito));
      mostrarNotificacion(`${producto.nombre} agregado a tu cuenta`);
    } else {
      setItemSeleccionado(producto);
    }
  };

  // Calculo en tiempo real del total en el modal
  const esFrappe = itemSeleccionado?.categoria?.toLowerCase().includes('frap');
  const costoTotalModal = itemSeleccionado ? 
    Number(itemSeleccionado.precio_venta) + 
    (extraDeslactosada ? 10 : 0) + 
    (extraShot ? 10 : 0) + 
    (extraCrema && !esFrappe ? 10 : 0) : 0;

  return (
    <>
      {/* 🏷️ HEADER DINÁMICO */}
      <header className="fixed top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-center bg-[#060B08]/90 backdrop-blur-xl border-b border-[#CBA36A]/10 shadow-lg">
        <Link href="/" className="flex items-center gap-2 text-[#CBA36A] hover:text-white transition-colors">
          <ArrowLeft size={20} /> <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Volver</span>
        </Link>
        
        <span className="text-2xl md:text-3xl font-serif font-bold text-[#CBA36A] drop-shadow-md tracking-widest absolute left-1/2 -translate-x-1/2">SÚA</span>
        
        <Link href="/carrito" className="relative bg-[#CBA36A] p-3 md:px-6 md:py-3 rounded-full text-[#060B08] active:scale-90 transition-all shadow-xl flex items-center gap-2 hover:bg-yellow-500">
          <ShoppingCart size={20} />
          {/* 🔴 EL CONTADOR DINÁMICO */}
          {carrito.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#060B08] animate-in zoom-in">
              {carrito.length}
            </span>
          )}
          <span className="hidden md:inline text-xs font-black uppercase tracking-widest">Cuenta</span>
        </Link>
      </header>

      {/* 🔔 LA NOTIFICACIÓN ELEGANTE (Toast) */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-[#CBA36A] text-[#0A130D] px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2 transition-all duration-500 transform ${notificacion.visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <Check size={16} /> {notificacion.mensaje}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-32">
        <div className="text-center mb-10 mt-10">
          <h1 className="text-4xl md:text-5xl font-serif italic text-white drop-shadow-md mb-2">Nuestro Menú</h1>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#CBA36A]/60">Selección Artesanal</p>
        </div>

        {/* 🗂️ FILTROS */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-12 pb-4 snap-x snap-mandatory">
          {[
            { id: 'todos', label: 'Todo', icon: <LayoutGrid size={16} /> },
            { id: 'caliente', label: 'Caliente', icon: <Coffee size={16} /> },
            { id: 'frio', label: 'Frío', icon: <CupSoda size={16} /> },
            { id: 'frappe', label: 'Frappé', icon: <Snowflake size={16} /> },
            { id: 'pan', label: 'Pan', icon: <Croissant size={16} /> },
          ].map((filtro) => (
            <Link key={filtro.id} href={`/menu?cat=${filtro.id}`} className={`snap-center flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoria === filtro.id ? 'bg-[#CBA36A] text-[#0A130D] shadow-[0_0_20px_rgba(203,163,106,0.4)]' : 'bg-[#050A06]/80 backdrop-blur-md border border-[#CBA36A]/20 text-[#CBA36A] hover:bg-[#CBA36A]/10'}`}>
              {filtro.icon} {filtro.label}
            </Link>
          ))}
        </div>

        {/* ☕ PRODUCTOS */}
        <div key={categoria} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {productos.map((producto) => (
            <div key={producto.id} className="bg-[#050A06]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#CBA36A]/20 shadow-xl flex flex-col justify-between group hover:border-[#CBA36A]/50 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-[#CBA36A]/10 text-[#CBA36A] px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-[#CBA36A]/20">{producto.categoria}</span>
                </div>
                <h3 className="text-xl font-serif text-white mb-2">{producto.nombre}</h3>
                <p className="text-sm text-white/50 font-light mb-6 line-clamp-2">Preparación exacta de Súa.</p>
              </div>
              <div className="flex items-center justify-between border-t border-[#CBA36A]/10 pt-4 mt-auto">
                <span className="text-2xl font-serif text-[#CBA36A]">${producto.precio_venta}</span>
                <button onClick={() => abrirModal(producto)} className="w-10 h-10 rounded-full bg-[#CBA36A]/10 border border-[#CBA36A]/30 flex items-center justify-center text-[#CBA36A] hover:bg-[#CBA36A] hover:text-[#0A130D] active:scale-90 transition-all">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 🥛 MODAL DE EXTRAS INTELIGENTE */}
        {itemSeleccionado && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0A130D] border border-[#CBA36A]/30 p-8 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-md relative animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 shadow-[0_0_50px_rgba(203,163,106,0.1)]">
              <button onClick={() => { setItemSeleccionado(null); setExtraDeslactosada(false); setExtraShot(false); setExtraCrema(false); }} className="absolute top-6 right-6 text-white/50 hover:text-white"><X /></button>
              <h2 className="text-3xl font-serif mb-1 text-[#CBA36A]">{itemSeleccionado.nombre}</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-8 border-b border-white/10 pb-4">Personaliza tu bebida</p>
              
              <div className="space-y-3 mb-8">
                <button onClick={() => setExtraDeslactosada(!extraDeslactosada)} className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all ${extraDeslactosada ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-white' : 'border-white/10 text-white/60'}`}>
                  <span className="font-bold text-sm">Cambiar a Deslactosada</span>
                  <span className="text-[#CBA36A] font-serif">+$10.00</span>
                </button>

                <button onClick={() => setExtraShot(!extraShot)} className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all ${extraShot ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-white' : 'border-white/10 text-white/60'}`}>
                  <span className="font-bold text-sm">Doble Shot Expreso</span>
                  <span className="text-[#CBA36A] font-serif">+$10.00</span>
                </button>

                <button onClick={() => setExtraCrema(!extraCrema)} className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all ${extraCrema ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-white' : 'border-white/10 text-white/60'}`}>
                  <span className="font-bold text-sm">Crema Batida</span>
                  <span className="text-[#CBA36A] font-serif">{esFrappe ? 'Gratis' : '+$10.00'}</span>
                </button>
              </div>

              <button onClick={confirmarAgregarAlCarrito} className="w-full bg-[#CBA36A] text-[#0A130D] py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform shadow-[0_10px_30px_rgba(203,163,106,0.2)]">
                Añadir por ${costoTotalModal.toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Estructura principal de la página
export default function MenuPage() {
  return (
    <main className="relative w-full min-h-screen bg-[#060B08] text-[#CBA36A] font-sans antialiased overflow-x-hidden selection:bg-[#CBA36A] selection:text-[#060B08]">
      {/* 🖼️ FONDO INMERSIVO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="md:hidden absolute inset-0 bg-[url('/bg-bosque.png')] bg-top bg-repeat-y bg-[length:100%_auto] opacity-60 mix-blend-lighten"></div>
        <div className="hidden md:block absolute inset-0">
           <img src="/bg-bosque.png" className="w-full h-full object-cover object-top opacity-40 mix-blend-lighten" alt="Fondo" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B08]/40 via-[#060B08]/80 to-[#060B08]"></div>
      </div>

      {/* Cargar el contenido con Suspense para que no bloquee */}
      <Suspense fallback={<div className="pt-40 text-center text-white">Cargando la magia de Súa...</div>}>
        <MenuContent />
      </Suspense>
    </main>
  );
}