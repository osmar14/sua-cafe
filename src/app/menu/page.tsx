'use client'; // Kaizen: Necesario para la interactividad de los botones

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Coffee, Cloud, IceCream, Croissant, Check } from 'lucide-react';

export default function Home() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Carga de datos desde Supabase
  useEffect(() => {
    async function fetchProductos() {
      const { data } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });
      if (data) setProductos(data);
      setLoading(false);
    }
    fetchProductos();
  }, []);

  const categorias = ['Todos', 'Caliente', 'Frio', 'Frape', 'Pan'];

  // Mapeo de iconos para las categorías
  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Caliente': return <Coffee size={20} />;
      case 'Frio': return <Cloud size={20} />;
      case 'Frape': return <IceCream size={20} />;
      case 'Pan': return <Croissant size={20} />;
      default: return <Check size={20} />;
    }
  };

  const productosFiltrados = categoriaActiva === 'Todos' 
    ? productos 
    : productos.filter(p => p.categoria === categoriaActiva);

  return (
    <main className="min-h-screen bg-[#FCFBF9] text-[#594E48] font-sans">
      
      {/* 🏔️ Hero Section - Minimalismo Moderno */}
      <header className="pt-20 pb-12 px-6 text-center border-b border-[#F2E8E4]">
        <h1 className="text-7xl md:text-8xl font-serif font-bold text-[#D9AFA0] tracking-tighter mb-4">
          Súa
        </h1>
        <p className="text-sm tracking-[0.5em] uppercase font-light opacity-70">
          Refugio · Café · Pan
        </p>
      </header>

      {/* 🔘 Selector de Categorías (Pills Modernas) */}
      <nav className="sticky top-0 z-10 bg-[#FCFBF9]/80 backdrop-blur-md py-6 px-4 border-b border-[#F2E8E4]">
        <div className="max-w-3xl mx-auto flex gap-3 overflow-x-auto pb-2 no-scrollbar justify-start md:justify-center">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 whitespace-nowrap font-medium text-sm
                ${categoriaActiva === cat 
                  ? 'bg-[#D9AFA0] border-[#D9AFA0] text-white shadow-lg shadow-[#D9AFA0]/20 scale-105' 
                  : 'bg-white border-[#F2E8E4] text-[#594E48] hover:border-[#D9AFA0]'}`}
            >
              {getIcon(cat)}
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* 📜 Menú Grid dinámico */}
      <section className="max-w-5xl mx-auto p-6 md:p-12">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-[#D9AFA0]">Preparando el refugio...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {productosFiltrados.map((producto) => (
              <div 
                key={producto.id} 
                className="group flex justify-between items-start p-6 bg-white rounded-3xl border border-[#F2E8E4] hover:border-[#D9AFA0] hover:shadow-xl hover:shadow-[#D9AFA0]/5 transition-all duration-500 cursor-pointer"
              >
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#D9AFA0] font-bold mb-2 block">
                    {producto.categoria}
                  </span>
                  <h3 className="text-2xl font-serif font-medium mb-2 group-hover:text-[#D9AFA0] transition-colors">
                    {producto.nombre}
                  </h3>
                  <p className="text-sm font-light opacity-60 leading-relaxed pr-4">
                    Selección artesanal preparada al momento para disfrutar en calma.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-[#FCFBF9] px-4 py-3 rounded-2xl border border-[#F2E8E4] text-[#594E48]">
                    ${producto.precio_venta}
                  </div>
                  {/* Botón rápido de añadir (modernidad) */}
                  <button className="mt-4 w-10 h-10 rounded-full bg-[#FCFBF9] border border-[#F2E8E4] flex items-center justify-center hover:bg-[#D9AFA0] hover:text-white transition-all shadow-sm">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="py-20 text-center border-t border-[#F2E8E4] opacity-40 text-xs tracking-[0.3em] uppercase">
        Cochera Jalisco · Súa 2026
      </footer>
    </main>
  );
}