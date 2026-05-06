import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, ArrowLeft, Coffee, CupSoda, Snowflake, Croissant, LayoutGrid } from 'lucide-react';

// 🚀 OPCIÓN NUCLEAR: Apagamos todos los cachés posibles de Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const parametros = await searchParams;
  const categoriaActual = parametros.cat || 'todos';

  // 🧠 BÚSQUEDA BLINDADA: Filtros exactos sin variables raras
  let peticion = supabase.from('productos').select('*');
  
  if (categoriaActual === 'caliente') {
    // Busca cualquier cosa que tenga "alient" (Caliente, Calientes, calientes)
    peticion = peticion.ilike('categoria', '%alient%');
  } 
  else if (categoriaActual === 'frio') {
    // Busca explícitamente las 4 formas posibles en las que pudiste escribirlo en tu base de datos
    peticion = peticion.or('categoria.ilike.%frio%,categoria.ilike.%frío%,categoria.ilike.%Frio%,categoria.ilike.%Frío%');
  } 
  else if (categoriaActual === 'frappe') {
    // Busca con y sin acento, con y sin 's'
    peticion = peticion.or('categoria.ilike.%frappe%,categoria.ilike.%frappé%,categoria.ilike.%frap%');
  } 
  else if (categoriaActual === 'pan') {
    peticion = peticion.ilike('categoria', '%pan%');
  }

  // Ejecutamos la búsqueda
  const { data: productos } = await peticion;

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

      {/* 🏷️ HEADER FIJO DE NAVEGACIÓN */}
      <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-[#060B08]/80 backdrop-blur-md border-b border-[#CBA36A]/10 shadow-lg">
        {/* Aquí sí usamos Link porque queremos volver rápido al inicio */}
        <Link href="/" className="flex items-center gap-2 text-[#CBA36A] hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Volver</span>
        </Link>
        <span className="text-2xl font-serif font-bold text-[#CBA36A] drop-shadow-md tracking-widest absolute left-1/2 -translate-x-1/2">SÚA</span>
        <Link href="/carrito" className="flex items-center gap-2 bg-[#CBA36A] px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[#060B08] text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-[0_0_15px_rgba(203,163,106,0.4)]">
          <ShoppingCart size={14} /> <span className="hidden md:inline">Carrito</span>
        </Link>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-32">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-serif italic text-white drop-shadow-md mb-2">Nuestro Menú</h1>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#CBA36A]/60">Selección Artesanal</p>
        </div>

        {/* 🗂️ BARRA DE FILTROS */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-12 pb-4 snap-x snap-mandatory">
          {[
            { id: 'todos', label: 'Todo', icon: <LayoutGrid size={16} /> },
            { id: 'caliente', label: 'Caliente', icon: <Coffee size={16} /> },
            { id: 'frio', label: 'Frío', icon: <CupSoda size={16} /> },
            { id: 'frappe', label: 'Frappé', icon: <Snowflake size={16} /> },
            { id: 'pan', label: 'Pan', icon: <Croissant size={16} /> },
          ].map((filtro) => {
            const activo = categoriaActual === filtro.id;
            return (
              // ⚠️ CAMBIO CRUCIAL: Cambiamos <Link> por <a> nativo. 
              // Esto obliga al celular a recargar la base de datos sin usar memoria guardada.
              <a 
                key={filtro.id} 
                href={`/menu?cat=${filtro.id}`}
                className={`snap-center flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activo 
                    ? 'bg-[#CBA36A] text-[#0A130D] shadow-[0_0_20px_rgba(203,163,106,0.4)]' 
                    : 'bg-[#050A06]/80 backdrop-blur-md border border-[#CBA36A]/20 text-[#CBA36A] hover:bg-[#CBA36A]/10'
                }`}
              >
                {filtro.icon} {filtro.label}
              </a>
            );
          })}
        </div>

        {/* ☕ REJILLA DE PRODUCTOS */}
        <div key={categoriaActual} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!productos || productos.length === 0 ? (
            <div className="col-span-full text-center py-20 opacity-50 bg-[#050A06]/50 rounded-3xl border border-[#CBA36A]/10 backdrop-blur-md">
              <Coffee size={48} className="mx-auto mb-4 opacity-50 text-[#CBA36A]" />
              <p className="font-serif text-xl text-white">Pronto añadiremos más delicias aquí.</p>
            </div>
          ) : (
            productos?.map((producto) => (
              <div key={producto.id} className="bg-[#050A06]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#CBA36A]/20 shadow-xl flex flex-col justify-between group hover:border-[#CBA36A]/50 transition-colors">
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[#CBA36A]/10 text-[#CBA36A] px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-[#CBA36A]/20">
                      {producto.categoria}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif text-white mb-2">{producto.nombre}</h3>
                  <p className="text-sm text-white/50 font-light mb-6 line-clamp-2">
                    Preparado con precisión y los mejores ingredientes artesanales de la casa.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[#CBA36A]/10 pt-4 mt-auto">
                  <span className="text-2xl font-serif text-[#CBA36A]">${producto.precio_venta}</span>
                  <button className="w-10 h-10 rounded-full bg-[#CBA36A]/10 border border-[#CBA36A]/30 flex items-center justify-center text-[#CBA36A] hover:bg-[#CBA36A] hover:text-[#0A130D] active:scale-90 transition-all">
                    +
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}