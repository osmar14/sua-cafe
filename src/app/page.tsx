import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Coffee, CupSoda, Snowflake, Croissant } from 'lucide-react';

export default async function LandingPrincipal() {
  const { data: topVentas } = await supabase
    .from('productos')
    .select('*')
    .limit(4);

  return (
    // 🌲 CONTENEDOR MAESTRO
    <main className="min-h-screen bg-[#060B08] text-[#CBA36A] font-sans antialiased relative">
      
      {/* 🖼️ FONDO ESTÁTICO (FIJO) */}
      {/* 'object-bottom' asegura que las raíces dibujadas siempre estén pegadas abajo */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/bg-bosque.png" 
          className="w-full h-full object-cover object-bottom opacity-50 mix-blend-lighten" 
          alt="Fondo Súa" 
        />
        {/* Degradado para que el texto del centro se lea bien, dejando el fondo inferior visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B08] via-[#060B08]/50 to-[#060B08]/20"></div>
      </div>

      {/* 🏷️ HEADER FIJO (No se mueve) */}
      <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-[#060B08] to-transparent">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-serif font-bold text-[#CBA36A] drop-shadow-md">SÚA</span>
        </div>
        <nav className="flex gap-6 text-[10px] font-bold tracking-[0.3em] uppercase">
          <Link href="/carrito" className="flex items-center gap-2 hover:text-white transition-colors bg-[#0A130D]/80 px-4 py-2 rounded-full border border-[#CBA36A]/30">
            <ShoppingCart size={14} /> Carrito
          </Link>
        </nav>
      </header>

      {/* 📜 ÁREA DE SCROLL (Solo esto se mueve) */}
      {/* pb-48 asegura que el contenido no quede oculto detrás de los botones fijos */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-48 h-screen overflow-y-auto hide-scrollbar">
        
        {/* LOGO CENTRAL */}
        <div className="flex flex-col items-center mb-16 relative">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border border-[#CBA36A]/40 shadow-[0_0_60px_rgba(203,163,106,0.3)] bg-[#101C13]">
            <img src="/logo.jpeg" alt="Súa Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* TARJETAS DE PRODUCTOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          
          {/* Combo Imperial */}
          <div className="bg-[#050A06]/70 backdrop-blur-xl p-8 rounded-3xl border border-[#CBA36A]/20 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-serif mb-6 text-[#CBA36A]">Combo Imperial</h2>
            <div className="space-y-3 mb-8 border-l border-[#CBA36A]/30 pl-4">
              <p className="text-white font-bold tracking-widest uppercase text-xs">Imperdible Universitaria:</p>
              <ul className="text-sm text-white/80 space-y-2 list-disc pl-3">
                <li>• Moka Imperial cremoso</li>
                <li>• Rol de Canela artesanal</li>
              </ul>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-3xl font-serif text-white">$90.00</span>
              <button className="bg-[#CBA36A] text-[#0A130D] px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest active:scale-95">
                Agregar
              </button>
            </div>
          </div>

          {/* Más Vendidos */}
          <div className="bg-[#050A06]/70 backdrop-blur-xl p-8 rounded-3xl border border-[#CBA36A]/20 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-[#CBA36A]">Los Favoritos</h2>
            <div className="space-y-6">
              {topVentas?.map((producto) => (
                <div key={producto.id} className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-white">{producto.nombre}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-[#CBA36A]/60">{producto.categoria}</span>
                  </div>
                  <span className="font-serif text-2xl text-[#CBA36A]">${producto.precio_venta}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 🌿 BOTONES ANCLADOS A LAS HOJAS (Navbar Inferior Fijo) */}
      {/* Esta sección nunca se mueve, haciendo que los iconos floten sobre las hojas de tu imagen de fondo */}
      <div className="fixed bottom-6 left-0 w-full z-50 px-4 md:px-8 pointer-events-none">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-2 md:gap-6 pointer-events-auto">
          
          <Link href="/menu?cat=caliente" className="flex flex-col items-center justify-center p-2 text-[#CBA36A] hover:text-white hover:-translate-y-2 transition-all drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">
            <Coffee size={32} className="mb-2" />
            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Caliente</span>
          </Link>

          <Link href="/menu?cat=frio" className="flex flex-col items-center justify-center p-2 text-[#CBA36A] hover:text-white hover:-translate-y-2 transition-all drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">
            <CupSoda size={32} className="mb-2" />
            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Frío</span>
          </Link>

          <Link href="/menu?cat=frappe" className="flex flex-col items-center justify-center p-2 text-[#CBA36A] hover:text-white hover:-translate-y-2 transition-all drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">
            <Snowflake size={32} className="mb-2" />
            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Frappé</span>
          </Link>

          <Link href="/menu?cat=pan" className="flex flex-col items-center justify-center p-2 text-[#CBA36A] hover:text-white hover:-translate-y-2 transition-all drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">
            <Croissant size={32} className="mb-2" />
            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">Pan</span>
          </Link>

        </div>
      </div>

    </main>
  );
}