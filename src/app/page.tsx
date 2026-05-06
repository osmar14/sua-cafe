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
    // Ahora es el lienzo completo donde todo se mueve junto
    <main className="relative w-full min-h-screen bg-[#060B08] text-[#CBA36A] font-sans antialiased overflow-x-hidden">
      
      {/* 🖼️ EL ÁRBOL COMO INTERFAZ (Se mueve con el scroll) */}
      {/* Al usar absolute en lugar de fixed, el árbol se queda pegado al contenido, no a la pantalla */}
      <div className="absolute top-0 left-0 w-full h-[150vh] z-0 pointer-events-none">
        <img 
          src="/bg-bosque.png" 
          className="w-full h-full object-cover object-top opacity-60 mix-blend-lighten" 
          alt="Árbol Interfaz" 
        />
        {/* Este degradado hace que el árbol se difumine suavemente hacia abajo, fusionándose con el fondo negro para que la página pueda seguir creciendo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B08]/10 via-[#060B08]/60 to-[#060B08]"></div>
      </div>

      {/* 🏷️ HEADER */}
      <header className="relative z-50 w-full p-6 flex justify-between items-center bg-transparent">
        <span className="text-3xl font-serif font-bold text-[#CBA36A] drop-shadow-md">SÚA</span>
        <Link href="/carrito" className="flex items-center gap-2 bg-[#CBA36A]/10 backdrop-blur-md px-4 py-2 rounded-full border border-[#CBA36A]/30 text-white text-[10px] uppercase tracking-widest hover:bg-[#CBA36A] hover:text-black transition-all">
          <ShoppingCart size={14} /> Carrito
        </Link>
      </header>

      {/* 📜 CONTENIDO PRINCIPAL (Flotando sobre las ramas) */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-32">
        
        {/* LOGO (En la copa del árbol) */}
        <div className="flex flex-col items-center mb-32 relative">
          <div className="w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden border border-[#CBA36A]/40 shadow-[0_0_60px_rgba(203,163,106,0.4)] bg-[#101C13]">
            <img src="/logo.jpeg" alt="Súa Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* TARJETAS (Entre las ramas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-40">
          
          <div className="bg-[#050A06]/60 backdrop-blur-md p-8 md:p-10 rounded-[2.5rem] border border-[#CBA36A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CBA36A]/10 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-3xl md:text-4xl font-serif mb-6 text-[#CBA36A]">Combo Imperial</h2>
            <div className="space-y-3 mb-8 border-l border-[#CBA36A]/30 pl-4">
              <p className="text-white font-bold tracking-widest uppercase text-xs">Imperdible Universitaria:</p>
              <ul className="text-sm text-white/80 space-y-2 list-disc pl-3">
                <li>• Moka Imperial cremoso</li>
                <li>• Rol de Canela artesanal</li>
              </ul>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-3xl md:text-4xl font-serif text-white">$90.00</span>
              <button className="bg-[#CBA36A] text-[#0A130D] px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white active:scale-95 transition-all">
                Agregar
              </button>
            </div>
          </div>

          <div className="bg-[#050A06]/60 backdrop-blur-md p-8 md:p-10 rounded-[2.5rem] border border-[#CBA36A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-[#CBA36A]">Los Favoritos</h2>
            <div className="space-y-6">
              {topVentas?.map((producto) => (
                <div key={producto.id} className="flex justify-between items-end border-b border-[#CBA36A]/20 pb-4">
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

        {/* 🌿 BOTONES DE CATEGORÍA (En las "Raíces" finales) */}
        {/* Este bloque está posicionado estratégicamente más abajo para coincidir visualmente con el final de tu imagen */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold tracking-[0.5em] uppercase opacity-50 block mb-2 text-[#CBA36A]/70">Explora el menú</span>
          <h2 className="text-4xl font-serif italic text-white drop-shadow-md">¿Qué se te antoja?</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
          {[
            { n: 'Caliente', icon: <Coffee size={32} className="mb-3" /> },
            { n: 'Frío', icon: <CupSoda size={32} className="mb-3" /> },
            { n: 'Frappé', icon: <Snowflake size={32} className="mb-3" /> },
            { n: 'Pan', icon: <Croissant size={32} className="mb-3" /> }
          ].map((cat) => (
            <Link href={`/menu?cat=${cat.n.toLowerCase()}`} key={cat.n} className="group flex flex-col items-center justify-center p-8 bg-[#050A06]/80 backdrop-blur-xl border border-[#CBA36A]/20 rounded-[2rem] hover:bg-[#CBA36A]/10 hover:-translate-y-2 transition-all duration-300 shadow-xl">
              <div className="text-[#CBA36A] group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-[#CBA36A]">{cat.n}</span>
            </Link>
          ))}
        </div>

      </div>

      <footer className="relative z-10 py-12 text-center border-t border-[#CBA36A]/10 bg-[#060B08]">
        <p className="text-[10px] tracking-[0.4em] uppercase opacity-30">Súa · Cochera Jalisco</p>
      </footer>

    </main>
  );
}