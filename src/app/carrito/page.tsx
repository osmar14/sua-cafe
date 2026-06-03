// src/app/carrito/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Trash2, CheckCircle, Clock, MapPin, Truck, Home, Building, FileText, Check } from 'lucide-react';
import Link from 'next/link';

export default function CarritoPage() {
  // 1. Estados de Datos
  const [carrito, setCarrito] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  
  // 2. Estados Logísticos
  const [metodoEntrega, setMetodoEntrega] = useState<'domicilio' | 'recoger' | null>(null);
  const [hora, setHora] = useState('');
  
  // 3. Estados de Domicilio Dinámico (JSONB en Supabase)
  const [domicilioGuardado, setDomicilioGuardado] = useState<any>(null);
  const [mostrarFormDomicilio, setMostrarFormDomicilio] = useState(false);
  const [formDom, setFormDom] = useState({ calle: '', numero: '', fraccionamiento: '', notas: '' });

  // 4. Estados de Sistema
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorSesion, setErrorSesion] = useState(false);

  useEffect(() => {
    async function inicializarCarrito() {
      // Cargar productos
      const g = localStorage.getItem('sua_carrito');
      if (g) setCarrito(JSON.parse(g));
      
      // Validar identidad del cliente con la API criptográfica
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUsuario(data.cliente);
          
          // Escrutinio de Estado: ¿Tiene domicilio guardado?
          if (data.cliente.domicilio_entrega && Object.keys(data.cliente.domicilio_entrega).length > 0) {
            setDomicilioGuardado(data.cliente.domicilio_entrega);
          }
        } else {
          setErrorSesion(true);
        }
      } catch (e) {
        setErrorSesion(true);
      }
    }
    inicializarCarrito();
  }, []);

  const total = carrito.reduce((acc, i) => acc + Number(i.precio_final || i.precio_venta || 0), 0);

  // --- 🚚 LÓGICA DE INTERCEPCIÓN LOGÍSTICA ---
  const gestionarMetodo = (metodo: 'domicilio' | 'recoger') => {
    setMetodoEntrega(metodo);
    if (metodo === 'domicilio') {
      if (!domicilioGuardado) setMostrarFormDomicilio(true);
      else setMostrarFormDomicilio(false);
    } else {
      setMostrarFormDomicilio(false);
    }
  };

  const guardarNuevoDomicilio = async () => {
    if (!formDom.calle || !formDom.numero || !formDom.fraccionamiento) return alert('Completa los campos obligatorios del domicilio.');
    
    // Transacción al servidor para actualizar el perfil del cliente
    const nuevoDom = { ...formDom };
    const { error } = await supabase.from('clientes').update({ domicilio_entrega: nuevoDom }).eq('id', usuario.id);
    
    if (error) {
      alert('Error guardando el domicilio.');
    } else {
      setDomicilioGuardado(nuevoDom);
      setMostrarFormDomicilio(false);
    }
  };

  const enviarPedido = async () => {
    if (metodoEntrega === 'recoger' && !hora) return alert("Indica la hora a la que pasarás.");
    if (metodoEntrega === 'domicilio' && !domicilioGuardado && !mostrarFormDomicilio) return alert("Falta el domicilio.");
    
    setEnviando(true);

    try {
      // Enviar a Cocina (Estructura de Orden Mejorada)
      const { error } = await supabase.from('pedidos').insert([{
        cliente_nombre: usuario.nombre,
        telefono: usuario.telefono,
        tipo_entrega: metodoEntrega,
        hora_recogida: metodoEntrega === 'recoger' ? hora : null,
        domicilio: metodoEntrega === 'domicilio' ? domicilioGuardado : null,
        items: carrito,
        total: total,
        estado: 'pendiente'
      }]);

      if (error) throw error;

      localStorage.removeItem('sua_carrito');
      setExito(true);

    } catch (error) {
      alert("Hubo un error al procesar tu pedido.");
    } finally {
      setEnviando(false);
    }
  };

  // --- RENDERIZADOS CONDICIONALES DE SEGURIDAD ---
  if (errorSesion) return (
    <main className="min-h-screen bg-[#060B08] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 border-2 border-red-500/30 rounded-full flex items-center justify-center mb-6 text-red-500 bg-red-500/10">
        <MapPin size={32} />
      </div>
      <h1 className="text-3xl font-serif text-[#CBA36A] mb-4">Acceso Requerido</h1>
      <p className="text-white/60 mb-8 max-w-sm">Para finalizar tu orden, debes iniciar sesión o crear tu PIN en la página principal.</p>
      <Link href="/" className="bg-[#CBA36A] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest">Regresar al Refugio</Link>
    </main>
  );

  if (exito) return (
    <main className="min-h-screen bg-[#060B08] flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle size={80} className="text-[#CBA36A] mb-6 animate-bounce" />
      <h1 className="text-4xl font-serif text-white mb-4">¡Orden Recibida!</h1>
      {metodoEntrega === 'recoger' ? (
        <p className="text-white/60 mb-8">Te esperamos a las {hora} para entregarte tu pedido.</p>
      ) : (
        <p className="text-white/60 mb-8">Comenzamos a preparar tu pedido. Te enviaremos un WhatsApp cuando el repartidor vaya en camino a {domicilioGuardado.fraccionamiento}.</p>
      )}
      <Link href="/" className="bg-[#CBA36A] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest">
        VOLVER AL MENÚ
      </Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#060B08] text-[#CBA36A] p-6 font-sans">
      <div className="fixed inset-0 z-0 bg-[url('/bg-bosque.png')] opacity-10 bg-cover pointer-events-none grayscale"></div>
      
      <div className="relative z-10 max-w-xl mx-auto pt-6 pb-20">
        <header className="flex justify-between items-center mb-8">
          <Link href="/menu" className="p-2 hover:bg-white/5 rounded-full transition-colors"><ArrowLeft/></Link>
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold text-white tracking-widest uppercase">Tu Cuenta</h1>
            {usuario && <p className="text-[10px] uppercase tracking-widest text-[#CBA36A]/60">Titular: {usuario.nombre}</p>}
          </div>
          <div className="w-10"></div>
        </header>

        <div className="space-y-4 mb-8">
          {carrito.length === 0 ? <p className="text-center opacity-50 py-10 border border-dashed border-white/20 rounded-2xl">Tu carrito está vacío</p> : 
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
            <div className="pt-6 border-t border-[#CBA36A]/20 flex justify-between items-end mb-8">
              <p className="text-xs font-black uppercase tracking-widest text-white/50">Total Neto</p>
              <p className="text-5xl font-serif text-white">${total.toFixed(2)}</p>
            </div>

            <div className="bg-[#0A130D] p-6 md:p-8 rounded-[2.5rem] border border-[#CBA36A]/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CBA36A]/10 via-[#CBA36A] to-[#CBA36A]/10"></div>
              
              <h2 className="text-lg font-serif text-[#CBA36A] mb-6 text-center">Selecciona Método de Entrega</h2>
              
              {/* SELECTOR LOGÍSTICO (Pilar Central) */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => gestionarMetodo('recoger')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${metodoEntrega === 'recoger' ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-[#CBA36A]' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                >
                  <Store size={24} className="mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pasar por él</span>
                </button>
                <button 
                  onClick={() => gestionarMetodo('domicilio')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${metodoEntrega === 'domicilio' ? 'bg-[#CBA36A]/10 border-[#CBA36A] text-[#CBA36A]' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                >
                  <Truck size={24} className="mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">A Domicilio</span>
                </button>
              </div>

              {/* RUTA A: PICK-UP */}
              {metodoEntrega === 'recoger' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-[10px] uppercase text-white/50 tracking-widest mb-2 border-b border-white/10 pb-2">Establecer hora de recolección</p>
                  <div className="relative">
                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CBA36A]" />
                    <input type="time" value={hora} onChange={e=>setHora(e.target.value)} className="w-full bg-[#050A06] border border-white/10 py-4 pl-12 pr-4 rounded-xl text-white outline-none focus:border-[#CBA36A]" />
                  </div>
                  <button onClick={enviarPedido} disabled={enviando} className="w-full bg-[#CBA36A] text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-6">
                    {enviando ? 'Enviando Ticket...' : 'Confirmar Pick-Up'}
                  </button>
                </div>
              )}

              {/* RUTA B: DOMICILIO */}
              {metodoEntrega === 'domicilio' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  
                  {/* B.1 Interrupción: Formulario Nuevo Domicilio */}
                  {mostrarFormDomicilio ? (
                    <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-dashed border-[#CBA36A]/30">
                       <p className="text-[10px] uppercase text-[#CBA36A] font-bold tracking-widest mb-4 flex items-center gap-2"><MapPin size={14}/> Alta de Dirección</p>
                       
                       <div className="relative">
                         <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                         <input type="text" placeholder="Calle / Avenida" value={formDom.calle} onChange={e=>setFormDom({...formDom, calle: e.target.value})} className="w-full bg-[#050A06] border border-white/10 py-3 pl-12 pr-4 text-sm rounded-xl text-white focus:border-[#CBA36A]" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                         <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">#</span>
                           <input type="text" placeholder="Exterior / Interior" value={formDom.numero} onChange={e=>setFormDom({...formDom, numero: e.target.value})} className="w-full bg-[#050A06] border border-white/10 py-3 pl-10 pr-4 text-sm rounded-xl text-white focus:border-[#CBA36A]" />
                         </div>
                         <div className="relative">
                           <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                           <input type="text" placeholder="Col / Fracc." value={formDom.fraccionamiento} onChange={e=>setFormDom({...formDom, fraccionamiento: e.target.value})} className="w-full bg-[#050A06] border border-white/10 py-3 pl-10 pr-4 text-sm rounded-xl text-white focus:border-[#CBA36A]" />
                         </div>
                       </div>
                       
                       <div className="relative">
                         <FileText size={16} className="absolute left-4 top-4 text-white/40" />
                         <textarea placeholder="Referencias (Ej. Casa blanca con portón negro)" value={formDom.notas} onChange={e=>setFormDom({...formDom, notas: e.target.value})} rows={2} className="w-full bg-[#050A06] border border-white/10 py-3 pl-12 pr-4 text-sm rounded-xl text-white focus:border-[#CBA36A] resize-none"></textarea>
                       </div>

                       <button onClick={guardarNuevoDomicilio} className="w-full border border-[#CBA36A] text-[#CBA36A] py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#CBA36A]/10">
                         Guardar Domicilio
                       </button>
                    </div>
                  ) : (
                    /* B.2 Flujo Continuo: Domicilio Existente */
                    domicilioGuardado && (
                      <div className="space-y-6">
                        <div className="bg-[#050A06] border border-white/10 p-4 rounded-2xl flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-2 mb-1"><MapPin size={12} className="text-[#CBA36A]"/> Entregar a:</p>
                            <p className="text-sm text-white/80">{domicilioGuardado.calle} #{domicilioGuardado.numero}</p>
                            <p className="text-[10px] text-white/50 uppercase">{domicilioGuardado.fraccionamiento}</p>
                          </div>
                          <button onClick={() => setMostrarFormDomicilio(true)} className="text-[9px] uppercase tracking-widest text-[#CBA36A] border-b border-[#CBA36A]/30">Cambiar</button>
                        </div>
                        
                        <button onClick={enviarPedido} disabled={enviando} className="w-full bg-[#CBA36A] text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                           {enviando ? 'Conectando con Repartidor...' : 'Confirmar Pedido'}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Micro-componente de icono omitido en importación superior
function Store(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-2.205a2 2 0 0 1 1.79 0L12 7l3.8-1.9a2 2 0 0 1 1.8 0L22 7v14H2V7Z"/><path d="M16 12v4"/><path d="M8 12v4"/>
    </svg>
  )
}