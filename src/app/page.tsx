import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Coffee, Star, ArrowRight, TreePine, Leaf } from 'lucide-react';

export default async function LandingPrincipal() {
  const { data: topVentas } = await supabase
    .from('productos')
    .select('*')
    .limit(3);

  return (
    // Fondo crema cálido unificado para toda la página
    <main className="min-h-screen bg-sua-fondo text-sua-cuerpo font-sans antialiased pb-20 relative overflow-x-hidden">
      
      {/* 🌲 Decoraciones Orgánicas de Fondo (Solo visibles en Desktop para no estorbar en móvil) */}
      <div className="hidden lg:block absolute top-10 -left-20 opacity-10 -rotate-12 pointer-events-none">
        <TreePine size={400} className="text-sua-primario" />
      </div>
      <div className="hidden lg:block absolute top-1/2 -right-20 opacity-10 rotate-12 pointer-events-none">
        <Leaf size={300} className="text-sua-primario" />
      </div>

      {/* 🏔️ Encabezado y Hero - Todo integrado */}
      <section className="pt-16 pb-12 px-6 flex flex-col items-center text-center max-w-4xl mx-auto relative z-10">
        
        {/* RUTA DEL LOGO: Asegúrate de que el archivo esté en /public/logo.jpg */}
        <div className="w-32 h-32 md:w-48 md:h-48 mb-8 rounded-full overflow-hidden border-4 border-sua-acentos/20 shadow-xl bg-white">
          <img 
            src="/logo.jpeg"
            alt="Súa Logo" 
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-5xl md:text-8xl font-serif font-bold text-sua-primario tracking-tighter mb-4">
          Súa
        </h1>
        <p className="text-xs md:text-sm tracking-[0.5em] uppercase font-bold text-sua-acentos mb-6">
          Refugio · Café · Pan
        </p>
        <p className="text-base md:text-lg text-sua-cuerpo/80 font-light leading-relaxed max-w-xl italic mb-10">
          "Pausa el tiempo en Cochera Jalisco. Café de especialidad y panadería artesanal para acompañar tus ideas."
        </p>
        
        <Link href="/menu" className="w-full md:w-auto inline-flex justify-center items-center gap-3 bg-sua-primario text-sua-fondo px-10 py-4 rounded-xl font-bold hover:bg-sua-titulos transition-all shadow-lg active:scale-95 group">
          Explorar el Menú <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      <div className="max-w-5xl mx-auto px-6 space-y-12 relative z-10">
        
        {/* ☕ Producto Destacado: Combo Imperial (Optimizado para móvil) */}
        <section className="bg-sua-primario text-sua-fondo rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          {/* Patrón de fondo sutil solo en esta tarjeta */}
          <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
            <Coffee size={200} />
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left z-10">
            <span className="inline-block bg-sua-acentos/20 text-sua-acentos px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-sua-acentos/30">
              Imperdible
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold">
              Combo <span className="italic text-sua-acentos">Imperial</span>
            </h2>
            <p className="text-sua-fondo/70 text-sm md:text-lg font-light leading-relaxed">
              Moka Imperial + Rol de Canela. La combinación definitiva para sobrevivir a la semana.
            </p>
            <div className="flex flex-col md:flex-row items-center gap-6 pt-4">
              <span className="text-4xl font-serif font-black">$90.00</span>
              <button className="w-full md:w-auto bg-sua-fondo text-sua-primario px-8 py-3 rounded-full text-sm font-black hover:bg-sua-acentos hover:text-white transition-colors">
                Pedir Ahora
              </button>
            </div>
          </div>
          
          {/* Espacio para la foto real */}
          <div className="w-full md:w-5/12 aspect-square bg-sua-fondo/10 rounded-3xl flex items-center justify-center border-2 border-dashed border-sua-fondo/20">
             <div className="text-center text-sua-fondo/40 font-serif p-6">
               <Coffee size={40} className="mx-auto mb-4 opacity-30" />
               <p className="text-xs italic">Sube aquí tu foto del Moka y el Rol</p>
             </div>
          </div>
        </section>

        {/* 🏆 Los Favoritos - Grid Responsivo */}
        <section className="pt-8">
          <div className="flex items-center justify-between border-b-2 border-sua-acentos/10 pb-4 mb-8">
            <h2 className="text-3xl font-serif font-bold text-sua-titulos italic">La Barra</h2>
            <Link href="/menu" className="text-sua-primario font-bold text-xs uppercase tracking-widest hover:underline">Ver Todo</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topVentas?.map((producto) => (
              <div 
                key={producto.id} 
                className="bg-white p-6 rounded-3xl border border-sua-acentos/10 shadow-sm flex md:flex-col justify-between items-center md:items-start gap-4"
              >
                <div className="flex-1">
                  <span className="text-[9px] font-black uppercase text-sua-acentos tracking-tighter mb-1 block">
                    {producto.categoria}
                  </span>
                  <h3 className="text-xl font-bold text-sua-titulos leading-tight">
                    {producto.nombre}
                  </h3>
                </div>
                <div className="flex items-center md:w-full md:justify-between gap-4">
                  <span className="text-xl font-serif font-bold text-sua-acentos">${producto.precio_venta}</span>
                  <button className="w-10 h-10 rounded-full bg-sua-fondo text-sua-primario flex items-center justify-center hover:bg-sua-primario hover:text-white transition-all active:scale-90">
                    <Star size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}