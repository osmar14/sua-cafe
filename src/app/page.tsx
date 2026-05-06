import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Leaf } from 'lucide-react';

export default async function LandingPrincipal() {
  const { data: topVentas } = await supabase
    .from('productos')
    .select('*')
    .limit(4);

  return (
    // 🌲 CONTENEDOR MAESTRO (Verde Bosque Base)
    <main className="min-h-screen bg-[#060B08] text-[#CBA36A] font-sans antialiased relative overflow-x-hidden">
      
      {/* 🖼️ EL TAPIZ BOTÁNICO ADAPTATIVO (La Solución Mágica) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#060B08]">
        
        {/* 📱 VERSIÓN MÓVIL: Como tu imagen es 1024x1536 (vertical), aquí encaja perfecto */}
        <div className="md:hidden absolute inset-0">
           <img src="/bg-bosque.png" className="w-full h-full object-cover opacity-50 mix-blend-lighten" alt="fondo movil" />
        </div>

        {/* 💻 VERSIÓN COMPUTADORA: Ponemos la imagen a los lados como telón para que NO haga zoom gigante */}
        <div className="hidden md:flex absolute inset-0 justify-between">
           <img src="/bg-bosque.png" className="w-[35vw] max-w-[500px] h-full object-cover opacity-50 mix-blend-lighten object-left" alt="fondo izq" />
           {/* La imagen derecha está invertida (scale-x-[-1]) para crear simetría */}
           <img src="/bg-bosque.png" className="w-[35vw] max-w-[500px] h-full object-cover opacity-50 mix-blend-lighten object-left scale-x-[-1]" alt="fondo der" />
        </div>

        {/* Filtros mágicos para oscurecer y fusionar el centro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,#060B08_80%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B08]/60 via-transparent to-[#060B08]/95"></div>
      </div>

      {/* 🏷️ HEADER PREMIUM */}
      <header className="relative z-50 w-full max-w-7xl mx-auto p-6 flex justify-between items-center border-b border-[#CBA36A]/10 bg-[#060B08]/40 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-serif font-bold text-[#CBA36A] tracking-wider drop-shadow-md">SÚA</span>
        </div>
        <nav className="flex gap-6 text-[10px] font-bold tracking-[0.3em] uppercase">
          <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
          <Link href="/menu" className="hover:text-white transition-colors">Menú</Link>
          <Link href="/carrito" className="flex items-center gap-2 hover:text-white transition-colors">
            <ShoppingCart size={14} /> Carrito
          </Link>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* 🏔️ LOGO Y ÁRBOL INVERTIDO (La conexión central) */}
        <div className="flex flex-col items-center mt-12 mb-16 relative">
          
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border border-[#CBA36A]/40 shadow-[0_0_60px_rgba(203,163,106,0.3)] bg-[#101C13] relative z-20">
            <img src="/logo.jpeg" alt="Súa Logo" className="w-full h-full object-cover" />
          </div>

          {/* 🌿 EL TRONCO CENTRAL SVG */}
          <div className="absolute top-20 w-full h-[600px] pointer-events-none z-0 opacity-40">
            <svg viewBox="0 0 400 800" className="w-full h-full text-[#CBA36A]" preserveAspectRatio="xMidYMin meet">
              <path d="M200,150 C180,300 220,400 200,500" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M200,500 C150,550 50,580 0,650" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M200,500 C250,550 350,580 400,650" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="200" cy="500" r="4" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* 🃏 SECCIÓN DE CRISTAL (Combo e Imperdibles) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-24 relative z-10">
          
          {/* Combo Imperial */}
          <div className="bg-[#050A06]/70 backdrop-blur-2xl p-8 rounded-3xl border border-[#CBA36A]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group hover:border-[#CBA36A]/50 transition-all duration-500 overflow-hidden relative">
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
              <span className="text-3xl md:text-4xl font-serif text-white drop-shadow-md">$90.00</span>
              <button className="bg-[#CBA36A] text-[#0A130D] px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">
                Añadir al Carrito
              </button>
            </div>
          </div>

          {/* Más Vendidos */}
          <div className="bg-[#050A06]/70 backdrop-blur-2xl p-8 rounded-3xl border border-[#CBA36A]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CBA36A]/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-[#CBA36A]">Los Favoritos</h2>
            <div className="space-y-6">
              {topVentas?.map((producto) => (
                <div key={producto.id} className="flex justify-between items-end border-b border-white/10 pb-4 hover:border-[#CBA36A]/40 transition-colors cursor-pointer group">
                  <div>
                    <h3 className="text-white group-hover:text-[#CBA36A] transition-colors">{producto.nombre}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-[#CBA36A]/60 mt-1">{producto.categoria}</span>
                  </div>
                  <span className="font-serif text-2xl text-[#CBA36A]">${producto.precio_venta}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 🌿 BIFURCACIÓN DE LA RAÍZ FINAL HACIA CATEGORÍAS */}
        <div className="relative mb-32 z-10">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold tracking-[0.5em] uppercase opacity-50 block mb-2 text-[#CBA36A]/70">Explora por</span>
            <h2 className="text-4xl md:text-5xl font-serif italic text-white drop-shadow-md">Categorías</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {['Caliente', 'Frío', 'Frappé', 'Pan'].map((cat) => (
              <Link href="/menu" key={cat} className="relative group aspect-square flex flex-col items-center justify-center bg-[#050A06]/60 backdrop-blur-xl border border-[#CBA36A]/10 rounded-2xl hover:border-[#CBA36A]/50 hover:-translate-y-2 transition-all duration-500 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[#CBA36A]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-lg md:text-xl font-serif text-[#CBA36A] group-hover:scale-110 transition-transform drop-shadow-md">
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      <footer className="relative z-10 py-12 text-center border-t border-white/5 bg-[#050A06]/90">
        <p className="text-[10px] tracking-[0.4em] uppercase opacity-40">Súa · Cochera Jalisco · Desde 2026</p>
      </footer>

    </main>
  );
}