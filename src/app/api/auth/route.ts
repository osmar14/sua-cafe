// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_respaldo_inseguro';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { telefono, pin } = body;

    // Validación de integridad de datos de entrada
    if (!telefono || telefono.length !== 10 || !pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Formato de credenciales inválido' }, { status: 400 });
    }

    // 1. Buscar al cliente en la base de datos
    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('id, telefono, pin_hash, nombre, rango, visitas')
      .eq('telefono', telefono)
      .single();

    let clienteFinal = cliente;

    // 2. Lógica de bifurcación: Registro vs Acceso
    if (!cliente) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(pin, salt);

      const { data: nuevoCliente, error: insertError } = await supabaseAdmin
        .from('clientes')
        .insert([{
          telefono: telefono,
          pin_hash: hash,
          nombre: `Invitado ${telefono.substring(6)}`,
          visitas: 0,
          rango: 'Explorador'
        }])
        .select()
        .single();

      if (insertError) throw new Error('Error al registrar cliente en la base de datos');
      clienteFinal = nuevoCliente;
    } else {
      const pinValido = await bcrypt.compare(pin, cliente.pin_hash);
      if (!pinValido) {
        return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
      }
    }

    // 🛡️ GUARDA DE TIPO (Aquí resolvemos el error de TypeScript)
    // Si por alguna falla del servidor clienteFinal sigue siendo null, abortamos.
    if (!clienteFinal) {
      return NextResponse.json({ error: 'Fallo crítico: No se pudo resolver la identidad del cliente' }, { status: 500 });
    }

    // 3. Generación del Criptograma de Sesión (JWT)
    // TypeScript ahora sabe con 100% de certeza que clienteFinal no es null
    const token = jwt.sign(
      { 
        id: clienteFinal.id, 
        telefono: clienteFinal.telefono,
        rango: clienteFinal.rango
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 4. Empaquetado en Cookie Segura (HttpOnly)
    const cookieSerialized = serialize('sua_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    });

    // 5. Respuesta exitosa con inyección de cabecera
    const response = NextResponse.json({ 
      exito: true, 
      cliente: {
        id: clienteFinal.id,
        nombre: clienteFinal.nombre,
        visitas: clienteFinal.visitas,
        rango: clienteFinal.rango
      }
    });

    response.headers.append('Set-Cookie', cookieSerialized);
    return response;

  } catch (error) {
    console.error('Fallo en el protocolo de autenticación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}