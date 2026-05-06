import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Coffee, CupSoda, Snowflake, Croissant } from 'lucide-react';

export default async function LandingPrincipal() {
  const { data: topVentas } = await supabase
    .from('productos')
    .select('*')
    .limit(4);

  return (
    <main className="relative w-full min-h-screen bg-[#060B08] text-[#CBA36A] font-sans antialiased overflow-x-hidden selection:bg-[#CBA36A] selection:text-[#060B08]">
      
      {/* 🖼️ FONDO ADAPTATIVO */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="md:hidden absolute inset-0 bg-[url('/bg-bosque.png')] bg-top bg-repeat-y bg-[length:100%_auto] opacity-70 mix-blend-lighten"></div>
        <div className="hidden md:block absolute inset-0">
           <img src="/bg-bosque.png" className="w-full h-full object-cover object-top opacity-50 mix-blend-lighten" alt="Árbol" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B08]/10 via-[#060B08]/70 to-[#060B08]"></div>
      </div>

      {/* 🏷️ HEADER FIJO */}
      <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-[#060B08]/80 backdrop-blur-md border-b border-[#CBA36A]/10 shadow-lg">
        <span className="text-3xl font-serif font-bold text-[#CBA36A] drop-shadow-md tracking-widest">SÚA</span>
        <Link href="/carrito" className="flex items-center gap-2 bg-[#CBA36A] px-5 py-2.5 rounded-full text-[#060B08] text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-[0_0_15px_rgba(203,163,106,0.4)]">
          <ShoppingCart size={14} /> Carrito
        </Link>
      </header>

      {/* 📜 CONTENIDO PRINCIPAL */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-40 pb-32">
        
        {/* 🏔️ LOGO */}
        <div className="flex flex-col items-center mb-24 relative">
          <div className="absolute -top-10 text-[9px] uppercase tracking-[0.4em] text-[#CBA36A]/60 font-bold">
            Bienvenido al Refugio
          </div>
          <div className="w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden border border-[#CBA36A]/40 shadow-[0_0_60px_rgba(203,163,106,0.3)] bg-[#101C13]">
            <img src="/logo.jpeg" alt="Súa Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* 🃏 TARJETAS DE PRODUCTOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-32">
          
          <div className="bg-[#050A06]/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-[#CBA36A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CBA36A]/10 rounded-full blur-3xl pointer-events-none"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CBA36A] opacity-80 mb-2 block">Selección del Barista</span>
            <h2 className="text-3xl md:text-4xl font-serif mb-6 text-[#CBA36A]">Combo Imperial</h2>
            <div className="space-y-3 mb-8 border-l-2 border-[#CBA36A]/40 pl-4">
              <ul className="text-sm text-white/90 space-y-2 list-disc pl-3">
                <li>Moka Imperial cremoso</li>
                <li>Rol de Canela recién horneado</li>
              </ul>
            </div>
            <div className="flex justify-between items-center gap-4 border-t border-[#CBA36A]/20 pt-6">
              <span className="text-3xl md:text-4xl font-serif text-white">$90.00</span>
              <button className="bg-[#CBA36A] text-[#0A130D] px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-90 transition-transform shadow-xl">
                Agregar
              </button>
            </div>
          </div>

          <div className="bg-[#050A06]/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-[#CBA36A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-[#CBA36A]">Los Favoritos</h2>
            <div className="space-y-6">
              {topVentas?.map((producto) => (
                <div key={producto.id} className="flex justify-between items-end border-b border-[#CBA36A]/20 pb-4 active:bg-[#CBA36A]/5 transition-colors p-2 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">{producto.nombre}</h3>
                    <span className="text-[9px] uppercase tracking-widest text-[#CBA36A]/70 mt-1 block">{producto.categoria}</span>
                  </div>
                  <span className="font-serif text-xl text-[#CBA36A]">${producto.precio_venta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🌿 BOTONES DE CATEGORÍA (Corregidos con IDs exactos) */}
        <div className="text-center mb-12 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-[#CBA36A]/50 to-transparent" />
          <span className="text-[10px] font-bold tracking-[0.5em] uppercase opacity-60 block mb-3 text-[#CBA36A]">Nuestra Carta</span>
          <h2 className="text-4xl font-serif italic text-white drop-shadow-md">¿Qué se te antoja?</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto px-2">
          {[
            // ⚠️ FIX: Agregamos un 'id' exacto sin acentos para la URL
            { id: 'caliente', n: 'Caliente', icon: <Coffee size={32} /> },
            { id: 'frio', n: 'Frío', icon: <CupSoda size={32} /> },
            { id: 'frappe', n: 'Frappé', icon: <Snowflake size={32} /> },
            { id: 'pan', n: 'Pan', icon: <Croissant size={32} /> }
          ].map((cat) => (
            // ⚠️ FIX: Usamos <a> en lugar de <Link> para romper el caché al cambiar de página
            <a href={`/menu?cat=${cat.id}`} key={cat.n} className="group relative aspect-square flex flex-col items-center justify-center bg-[#050A06]/80 backdrop-blur-xl border border-[#CBA36A]/40 rounded-full active:scale-95 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer">
              
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#CBA36A] opacity-60 animate-[spin_15s_linear_infinite] pointer-events-none">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 50 2 L 52 8 L 48 8 Z" fill="currentColor" />
                <path d="M 50 98 L 52 92 L 48 92 Z" fill="currentColor" />
                <path d="M 2 50 L 8 48 L 8 52 Z" fill="currentColor" />
                <path d="M 98 50 L 92 48 L 92 52 Z" fill="currentColor" />
              </svg>
              
              <div className="text-[#CBA36A] mb-2 md:group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-[0_0_10px_rgba(203,163,106,0.8)]">
                {cat.icon}
              </div>
              
              <span className="text-[11px] md:text-xs font-black uppercase tracking-widest text-[#CBA36A] relative z-10">
                {cat.n}
              </span>
            </a>
          ))}
        </div>

      </div>

      <footer className="relative z-10 py-12 text-center border-t border-[#CBA36A]/10 bg-[#060B08]">
        <p className="text-[9px] tracking-[0.5em] uppercase opacity-40">Súa · Refugio y Café · 2026</p>
      </footer>

    </main>
  );
}