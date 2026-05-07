'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingCart, Coffee, CupSoda, Snowflake, Croissant, 
  X, Check, Star, Trophy, Crown, Gift, Map as MapIcon, 
  Shield, Compass, Bean, Handshake 
} from 'lucide-react';

export default function LandingPrincipal() {
  const [topVentas, setTopVentas] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<'misiones' | 'rangos'>('misiones');

  useEffect(() => {
    async function loadData() {
      const { data: productos } = await supabase.from('productos').select('*').limit(4);
      setTopVentas(productos || []);

      const phone = localStorage.getItem('sua_user_phone');
      if (phone) {
        const { data: client } = await supabase.from('clientes').select('*').eq('telefono', phone).single();
        if (client) setUsuario(client);
      }
    }
    loadData();
  }, []);

  const misiones = [
    { v: 5, premio: "5% de Descuento", icon: <Star size={16}/> },
    { v: 10, premio: "Bebida Gratis + Sube a Conocedor", icon: <Trophy size={16}/> },
    { v: 13, premio: "Pan Súa de Cortesía", icon: <Croissant size={16}/> },
    { v: 17, premio: "Café Clásico Gratis", icon: <Coffee size={16}/> },
    { v: 20, premio: "15% Descuento + Sube a Cómplice", icon: <Star size={16} className="text-yellow-500"/> },
    { v: 36, premio: "Sube a Familia Súa (10% Permanente)", icon: <Crown size={16}/> },
    { v: 50, premio: "Taza Oficial Súa", icon: <Gift size={16}/> }
  ];

  // LOGICA BLINDADA DE MEDALLAS Y COLORES
  const getRangoData = (visitas: number, rangoDB: string) => {
    // Si la DB está vacía, calculamos el rango real por sus visitas
    let rangoReal = rangoDB;
    if (!rangoReal) {
      if (visitas >= 36) rangoReal = 'Familia Súa';
      else if (visitas >= 21) rangoReal = 'Cómplice';
      else if (visitas >= 11) rangoReal = 'Conocedor';
      else rangoReal = 'Explorador';
    }

    switch(rangoReal) {
      case 'Familia Súa': 
        return { nombre: 'Familia Súa', icon: <Crown size={14} />, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', glow: 'from-yellow-400 to-orange-600' };
      case 'Cómplice': 
        return { nombre: 'Cómplice', icon: <Handshake size={14} />, color: 'text-[#CBA36A]', bg: 'bg-[#CBA36A]/20', border: 'border-[#CBA36A]', glow: 'from-[#CBA36A] to-yellow-700' };
      case 'Conocedor': 
        return { nombre: 'Conocedor', icon: <Bean size={14} />, color: 'text-gray-300', bg: 'bg-gray-400/20', border: 'border-gray-400', glow: 'from-gray-300 to-gray-600' };
      default: // Explorador
        return { nombre: 'Explorador', icon: <Compass size={14} />, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500', glow: 'from-orange-400 to-orange-700' };
    }
  };

  const rd = usuario ? getRangoData(usuario.visitas, usuario.rango) : null;

  return (
    <main className="relative w-full min-h-screen bg-[#060B08] text-[#CBA36A] font-sans antialiased overflow-x-hidden selection:bg-[#CBA36A] selection:text-[#060B08]">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="md:hidden absolute inset-0 bg-[url('/bg-bosque.png')] bg-top bg-repeat-y bg-[length:100%_auto] opacity-70 mix-blend-lighten"></div>
        <div className="hidden md:block absolute inset-0">
           <img src="/bg-bosque.png" className="w-full h-full object-cover object-top opacity-50 mix-blend-lighten" alt="Árbol" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B08]/10 via-[#060B08]/70 to-[#060B08]"></div>
      </div>

      {/* 🏷️ HEADER CON PASE DE MIEMBRO PREMIUM */}
      <header className="fixed top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-center bg-[#060B08]/90 backdrop-blur-xl border-b border-[#CBA36A]/10 shadow-lg">
        <span className="text-2xl md:text-4xl font-serif font-bold text-[#CBA36A] drop-shadow-md tracking-widest">SÚA</span>
        
        <div className="flex items-center gap-3 md:gap-8">
          
          {/* 🎟️ PASE DE RANGO PERSONALIZADO */}
          {usuario && rd && (
            <button onClick={() => setMostrarModal(true)} className="relative group cursor-pointer active:scale-95 transition-all text-left">
              <div className={`absolute -inset-1 rounded-full blur-md opacity-20 group-hover:opacity-60 transition duration-500 bg-gradient-to-r ${rd.glow}`}></div>
              
              <div className={`relative flex items-center gap-3 bg-[#0A130D]/90 border ${rd.border}/30 pl-4 pr-1 py-1 rounded-full shadow-2xl`}>
                <div className="flex flex-col items-end">
                  <span className="text-base md:text-2xl font-serif font-bold text-white leading-none capitalize">
                    {usuario.nombre}
                  </span>
                  <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-sm ${rd.bg}`}>
                    {rd.icon}
                    <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest ${rd.color}`}>
                      {rd.nombre}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 border-[#0A130D] shadow-inner text-[#0A130D] bg-gradient-to-br ${rd.glow}`}>
                  <span className="font-serif font-black text-xl md:text-3xl">{usuario.nombre.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </button>
          )}

          <Link href="/carrito" className="relative bg-[#CBA36A] p-3 md:px-6 md:py-3 rounded-full text-[#060B08] active:scale-90 transition-all shadow-xl flex items-center gap-2">
            <ShoppingCart size={20} />
            <span className="hidden md:inline text-xs font-black uppercase tracking-widest">Cuenta</span>
          </Link>
        </div>
      </header>

      {/* 📜 CONTENIDO PRINCIPAL */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-48 pb-32">
        
        <div className="flex flex-col items-center mb-24 relative animate-in fade-in zoom-in duration-1000">
          <div className="absolute -top-10 text-[9px] uppercase tracking-[0.4em] text-[#CBA36A]/60 font-bold">Bienvenido al Refugio</div>
          <div className="w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden border border-[#CBA36A]/40 shadow-[0_0_60px_rgba(203,163,106,0.3)] bg-[#101C13]">
            <img src="/logo.jpeg" alt="Súa Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-32">
          {/* Combo Imperial */}
          <div className="bg-[#050A06]/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-[#CBA36A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CBA36A]/10 rounded-full blur-3xl pointer-events-none"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CBA36A] opacity-80 mb-2 block">Selección del Barista</span>
            <h2 className="text-3xl md:text-4xl font-serif mb-6 text-[#CBA36A]">Combo Imperial</h2>
            <ul className="text-sm text-white/90 space-y-2 border-l-2 border-[#CBA36A]/40 pl-4 mb-8">
              <li>• Moka Imperial cremoso</li>
              <li>• Rol de Canela recién horneado</li>
            </ul>
            <div className="flex justify-between items-center border-t border-[#CBA36A]/20 pt-6">
              <span className="text-3xl md:text-4xl font-serif text-white">$90.00</span>
              <a href="/menu" className="bg-[#CBA36A] text-[#0A130D] px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-90 transition-transform">Agregar</a>
            </div>
          </div>

          {/* Favoritos */}
          <div className="bg-[#050A06]/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-[#CBA36A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-[#CBA36A]">Los Favoritos</h2>
            <div className="space-y-6">
              {topVentas?.map((p) => (
                <div key={p.id} className="flex justify-between items-end border-b border-[#CBA36A]/20 pb-4 p-2 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">{p.nombre}</h3>
                    <span className="text-[9px] uppercase tracking-widest text-[#CBA36A]/70 mt-1 block">{p.categoria}</span>
                  </div>
                  <span className="font-serif text-xl text-[#CBA36A]">${p.precio_venta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categorías */}
        <div className="text-center mb-12 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-[#CBA36A]/50 to-transparent" />
          <h2 className="text-4xl font-serif italic text-white drop-shadow-md">¿Qué se te antoja?</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto px-2">
          {[
            { id: 'caliente', n: 'Caliente', icon: <Coffee size={32} /> },
            { id: 'frio', n: 'Frío', icon: <CupSoda size={32} /> },
            { id: 'frappe', n: 'Frappé', icon: <Snowflake size={32} /> },
            { id: 'pan', n: 'Pan', icon: <Croissant size={32} /> }
          ].map((cat) => (
            <a href={`/menu?cat=${cat.id}`} key={cat.n} className="group relative aspect-square flex flex-col items-center justify-center bg-[#050A06]/80 backdrop-blur-xl border border-[#CBA36A]/40 rounded-full active:scale-95 transition-all duration-300 shadow-2xl overflow-hidden cursor-pointer">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#CBA36A] opacity-60 animate-[spin_15s_linear_infinite] pointer-events-none">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
                <path d="M 50 2 L 52 8 L 48 8 Z" fill="currentColor" />
                <path d="M 50 98 L 52 92 L 48 92 Z" fill="currentColor" />
              </svg>
              <div className="text-[#CBA36A] mb-2 md:group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-[0_0_10px_rgba(203,163,106,0.8)]">
                {cat.icon}
              </div>
              <span className="text-[11px] md:text-xs font-black uppercase tracking-widest text-[#CBA36A] relative z-10">{cat.n}</span>
            </a>
          ))}
        </div>
      </div>

      <footer className="relative z-10 py-12 text-center border-t border-[#CBA36A]/10 bg-[#060B08]">
        <p className="text-[9px] tracking-[0.5em] uppercase opacity-40">Súa · Refugio y Café · 2026</p>
      </footer>

      {/* 🗺️ MODAL CLUB SÚA */}
      {mostrarModal && usuario && rd && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-[#0A130D] border border-[#CBA36A]/30 w-full max-w-2xl md:rounded-[3rem] rounded-t-[3rem] p-6 md:p-10 relative shadow-[0_0_80px_rgba(203,163,106,0.1)] flex flex-col max-h-[85vh]">
            <button onClick={() => setMostrarModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10"><X size={28}/></button>
            
            <header className="mb-6 text-center shrink-0">
               <h2 className="text-3xl font-serif text-[#CBA36A] mb-1">Club Súa</h2>
               <p className="text-[10px] uppercase tracking-widest text-white/50">{usuario.nombre} • {usuario.visitas} Visitas Totales</p>
            </header>

            <div className="flex bg-white/5 p-1 rounded-full mb-6 shrink-0">
               <button onClick={() => setPestanaActiva('misiones')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${pestanaActiva === 'misiones' ? 'bg-[#CBA36A] text-[#0A130D] shadow-lg' : 'text-white/50 hover:text-white'}`}>
                 <MapIcon size={14} className="inline mr-1 -mt-0.5" /> Misiones
               </button>
               <button onClick={() => setPestanaActiva('rangos')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${pestanaActiva === 'rangos' ? 'bg-[#CBA36A] text-[#0A130D] shadow-lg' : 'text-white/50 hover:text-white'}`}>
                 <Shield size={14} className="inline mr-1 -mt-0.5" /> Niveles
               </button>
            </div>

            <div className="overflow-y-auto hide-scrollbar flex-1 pr-2">
              {pestanaActiva === 'misiones' && (
                <div className="space-y-6 pt-2 pb-8">
                  {misiones.map((m, idx, arr) => {
                    const completada = usuario.visitas >= m.v;
                    const proxima = !completada && (idx === 0 || usuario.visitas >= arr[idx-1].v);
                    return (
                      <div key={idx} className={`relative flex gap-4 items-start transition-all duration-700 ${completada ? 'opacity-100' : 'opacity-40'}`}>
                          {idx !== arr.length - 1 && <div className={`absolute left-[19px] top-10 w-0.5 h-12 ${completada ? 'bg-[#CBA36A]' : 'bg-white/10'}`}></div>}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 shrink-0 transition-colors ${completada ? 'bg-[#CBA36A] border-[#CBA36A] text-[#060B08]' : 'bg-[#0A130D] border-white/20 text-white'}`}>{completada ? <Check size={20}/> : m.icon}</div>
                          <div className="pt-1">
                            <h3 className={`text-base md:text-lg font-serif italic ${completada ? 'text-[#CBA36A]' : 'text-white'}`}>{m.premio}</h3>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Meta: {m.v} Visitas</p>
                            {proxima && <div className="mt-2 bg-[#CBA36A]/10 border border-[#CBA36A]/40 px-3 py-1 rounded text-[8px] md:text-[9px] font-black text-[#CBA36A] inline-block animate-pulse">FALTAN {m.v - usuario.visitas} VISITAS</div>}
                          </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {pestanaActiva === 'rangos' && (
                <div className="space-y-4 pt-2 pb-8">
                  <div className={`p-5 md:p-6 rounded-2xl border ${rd.nombre === 'Explorador' ? 'bg-gradient-to-br from-orange-500/20 to-transparent border-orange-500' : 'bg-white/5 border-white/10'}`}>
                     <div className="flex justify-between items-center mb-2">
                       <p className="text-xs font-black uppercase text-white flex items-center gap-2"><Compass size={14}/> 🥉 Explorador</p>
                       <p className="text-[9px] text-orange-400 font-bold bg-black/40 px-2 py-1 rounded">0-10 Visitas</p>
                     </div>
                     <p className="text-[10px] md:text-xs text-white/60 leading-relaxed">Estás descubriendo el refugio. Suma visitas para desbloquear beneficios permanentes.</p>
                  </div>

                  <div className={`p-5 md:p-6 rounded-2xl border ${rd.nombre === 'Conocedor' ? 'bg-gradient-to-br from-gray-400/20 to-transparent border-gray-400' : 'bg-white/5 border-white/10'}`}>
                     <div className="flex justify-between items-center mb-2">
                       <p className="text-xs font-black uppercase text-white flex items-center gap-2"><Bean size={14}/> 🥈 Conocedor</p>
                       <p className="text-[9px] text-gray-300 font-bold bg-black/40 px-2 py-1 rounded">11-20 Visitas</p>
                     </div>
                     <p className="text-[10px] md:text-xs text-white/80 leading-relaxed"><span className="text-gray-300 font-bold">Pase VIP:</span> Leche vegetal (Deslactosada/Avena) o Extra Shot totalmente GRATIS en todas tus bebidas.</p>
                  </div>

                  <div className={`p-5 md:p-6 rounded-2xl border ${rd.nombre === 'Cómplice' ? 'bg-gradient-to-br from-[#CBA36A]/20 to-transparent border-[#CBA36A]' : 'bg-white/5 border-white/10'}`}>
                     <div className="flex justify-between items-center mb-2">
                       <p className="text-xs font-black uppercase text-white flex items-center gap-2"><Handshake size={14}/> 🥇 Cómplice</p>
                       <p className="text-[9px] text-[#CBA36A] font-bold bg-black/40 px-2 py-1 rounded">21-35 Visitas</p>
                     </div>
                     <p className="text-[10px] md:text-xs text-white/80 leading-relaxed"><span className="text-[#CBA36A] font-bold">Pase VIP:</span> Derecho a Refill de Café Americano por solo $15 pesos.</p>
                  </div>

                  <div className={`p-5 md:p-6 rounded-2xl border ${rd.nombre === 'Familia Súa' ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-900/40 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'bg-white/5 border-white/10'}`}>
                     <div className="flex justify-between items-center mb-2">
                       <p className="text-xs md:text-sm font-black uppercase text-white flex items-center gap-2"><Crown size={18} className="text-yellow-400" /> 👑 Familia Súa</p>
                       <p className="text-[9px] text-yellow-400 font-bold bg-black/40 px-2 py-1 rounded">36+ Visitas</p>
                     </div>
                     <p className="text-[10px] md:text-xs text-white/80 leading-relaxed"><span className="text-yellow-400 font-bold">Pase Supremo:</span> 10% de descuento automático en TODAS tus cuentas para siempre y acceso al menú secreto.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}