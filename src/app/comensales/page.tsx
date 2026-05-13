'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Coffee, CupSoda, Snowflake, Croissant, LayoutGrid, Image as ImageIcon } from 'lucide-react';

function ComensalesContent() {
  const searchParams = useSearchParams();
  const categoriaURL = searchParams.get('cat') || 'todos';

  const [productos, setProductos] = useState<any[]>([]);
  const [categoria, setCategoria] = useState(categoriaURL);

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
    
    const sub = supabase.channel(`comensales_${categoria}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => fetchProductos())
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [categoria]);

  return (
    <>
      {/* 🏷️ HEADER DINÁMICO */}
      <header className="fixed top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-center bg-[#060B08]/90 backdrop-blur-xl border-b border-[#CBA36A]/10 shadow-lg">
        <div className="w-10"></div> {/* Espaciador */}
        <span className="text-2xl md:text-3xl font-serif font-bold text-[#CBA36A] drop-shadow-md tracking-widest absolute left-1/2 -translate-x-1/2">SÚA</span>
        <div className="w-10"></div> {/* Espaciador */}
      </header>

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
            <Link key={filtro.id} href={`/comensales?cat=${filtro.id}`} scroll={false} className={`snap-center flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoria === filtro.id ? 'bg-[#CBA36A] text-[#0A130D] shadow-[0_0_20px_rgba(203,163,106,0.4)]' : 'bg-[#050A06]/80 backdrop-blur-md border border-[#CBA36A]/20 text-[#CBA36A] hover:bg-[#CBA36A]/10'}`}>
              {filtro.icon} {filtro.label}
            </Link>
          ))}
        </div>

        {/* ☕ PRODUCTOS */}
        <div key={categoria} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {productos.map((producto) => (
            <div key={producto.id} className="bg-[#0A130D]/90 backdrop-blur-xl rounded-3xl border border-[#CBA36A]/20 shadow-2xl overflow-hidden flex flex-col group hover:border-[#CBA36A]/50 transition-colors">
              {/* ÁREA DE IMAGEN */}
              <div className="relative w-full h-56 bg-[#060B08] flex items-center justify-center border-b border-[#CBA36A]/10 overflow-hidden">
                {producto.imagen_url ? (
                  <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="text-[#CBA36A]/20 flex flex-col items-center">
                    <ImageIcon size={48} className="mb-2 opacity-50" />
                    <span className="text-[10px] uppercase tracking-widest opacity-50">Súa Café</span>
                  </div>
                )}
                
                {/* PROMOCIÓN (SI APLICA) */}
                {producto.promocion && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-red-500">
                    Promo: {producto.promocion}
                  </div>
                )}
              </div>

              {/* CONTENIDO DEL PRODUCTO */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-[#CBA36A]/10 text-[#CBA36A] px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-[#CBA36A]/20">{producto.categoria}</span>
                </div>
                <h3 className="text-xl font-serif text-white mb-2">{producto.nombre}</h3>
                <p className="text-sm text-white/50 font-light mb-6 flex-1">{producto.descripcion || 'Preparación exacta de Súa. Ingredientes de alta calidad.'}</p>
                
                <div className="flex items-center justify-between border-t border-[#CBA36A]/10 pt-4 mt-auto">
                  <span className="text-2xl font-serif text-[#CBA36A]">${producto.precio_venta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ComensalesPage() {
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

      <Suspense fallback={<div className="pt-40 text-center text-white">Cargando el menú de Súa...</div>}>
        <ComensalesContent />
      </Suspense>
    </main>
  );
}
