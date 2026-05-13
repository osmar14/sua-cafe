'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Trash2, CheckCircle, Clock, User, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CarritoPage() {
  const [carrito, setCarrito] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [hora, setHora] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const g = localStorage.getItem('sua_carrito');
    if (g) setCarrito(JSON.parse(g));
    
    const savedName = localStorage.getItem('sua_user_name');
    const savedPhone = localStorage.getItem('sua_user_phone');
    if (savedName) setNombre(savedName);
    if (savedPhone) setTelefono(savedPhone);
  }, []);

  const total = carrito.reduce((acc, i) => acc + Number(i.precio_final || i.precio_venta || 0), 0);

  const enviarPedido = async () => {
    if (!nombre || !telefono || !hora) return alert("Faltan datos para procesar tu orden.");
    setEnviando(true);

    try {
      // 1. Registro Silencioso (Solo creamos el perfil si es nuevo, NO sumamos visita aquí)
      const { data: clienteExiste } = await supabase.from('clientes').select('*').eq('telefono', telefono).single();
      
      if (!clienteExiste) {
        await supabase.from('clientes').insert([{ telefono, nombre, visitas: 0 }]);
      }

      localStorage.setItem('sua_user_name', nombre);
      localStorage.setItem('sua_user_phone', telefono);

      // 2. Enviar a Cocina
      const { error } = await supabase.from('pedidos').insert([{
        cliente_nombre: nombre,
        telefono: telefono,
        hora_recogida: hora,
        items: carrito,
        total: total,
        estado: 'pendiente'
      }]);

      if (error) throw error;

      localStorage.removeItem('sua_carrito');
      setExito(true);

    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar tu pedido.");
    } finally {
      setEnviando(false);
    }
  };

  if (exito) return (
    <main className="min-h-screen bg-[#060B08] flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle size={80} className="text-[#CBA36A] mb-6 animate-bounce" />
      <h1 className="text-4xl font-serif text-white mb-4">¡Orden Recibida!</h1>
      <p className="text-white/60 mb-8">Te esperamos a las {hora} para preparar tu café.</p>
      <Link href="/" className="bg-[#CBA36A] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest">
        VOLVER AL INICIO
      </Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-6 font-sans">
      <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-10 bg-cover pointer-events-none grayscale"></div>
      
      <div className="relative z-10 max-w-xl mx-auto pt-6">
        <header className="flex justify-between items-center mb-12">
          <Link href="/menu" className="p-2 hover:bg-white/5 rounded-full transition-colors"><ArrowLeft/></Link>
          <h1 className="text-2xl font-serif font-bold text-white tracking-widest uppercase">Tu Cuenta</h1>
          <div className="w-10"></div>
        </header>

        <div className="space-y-4 mb-10">
          {carrito.length === 0 ? <p className="text-center opacity-50 py-10">Tu carrito está vacío</p> : 
            carrito.map((item, idx) => (
              <div key={idx} className="bg-[#0A130D] p-5 rounded-2xl border border-[#CBA36A]/20 flex justify-between items-center shadow-lg">
                <div>
                  <p className="font-bold text-white uppercase text-sm">{item.nombre}</p>
                  <p className="text-[10px] text-[#CBA36A] uppercase tracking-widest mt-1">{item.extras_str}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-serif text-lg text-white">${Number(item.precio_final || item.precio_venta || 0).toFixed(2)}</span>
                  <button onClick={() => {
                    const n = carrito.filter((_, i) => i !== idx);
                    setCarrito(n); localStorage.setItem('sua_carrito', JSON.stringify(n));
                  }}><Trash2 size={18} className="text-red-900 hover:text-red-500"/></button>
                </div>
              </div>
            ))
          }
        </div>

        {carrito.length > 0 && (
          <>
            <div className="pt-6 border-t border-white/10 flex justify-between items-end mb-12">
              <p className="text-xs font-black uppercase tracking-widest opacity-50">Total Neto</p>
              <p className="text-5xl font-serif text-white">${total.toFixed(2)}</p>
            </div>

            <div className="bg-[#0A130D] p-8 rounded-[2.5rem] border border-[#CBA36A]/20 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CBA36A]/10 via-[#CBA36A] to-[#CBA36A]/10"></div>
              
              <h2 className="text-xl font-serif text-white mb-2">Datos de Entrega</h2>
              <p className="text-[10px] text-white/50 mb-6 uppercase tracking-widest font-bold">Sumarás visitas al pagar en caja</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBA36A]/50" />
                  <input type="text" placeholder="Tu Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-white outline-none focus:border-[#CBA36A]" />
                </div>
                
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBA36A]/50" />
                  <input type="tel" placeholder="WhatsApp (10 dígitos)" value={telefono} onChange={e=>setTelefono(e.target.value)} className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-white outline-none focus:border-[#CBA36A]" />
                </div>

                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBA36A]/50" />
                  <input type="time" value={hora} onChange={e=>setHora(e.target.value)} className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-white outline-none focus:border-[#CBA36A]" />
                </div>
              </div>

              <button onClick={enviarPedido} disabled={enviando} className="w-full bg-[#CBA36A] text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50">
                {enviando ? 'PROCESANDO...' : 'ENVIAR ORDEN A COCINA'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}