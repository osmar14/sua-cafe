import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Faltan las llaves de Supabase en el servidor.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { telefono, pin } = body;

    if (!telefono || telefono.length !== 10 || !pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Formato de credenciales inválido' }, { status: 400 });
    }

    // 1. Escrutinio de la Base de Datos
    const { data: cliente, error: dbError } = await supabaseAdmin
      .from('clientes')
      .select('id, telefono, pin_hash, nombre, rango, visitas')
      .eq('telefono', telefono)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      throw new Error(`Error leyendo Supabase: ${dbError.message}`);
    }

    let clienteFinal = cliente;

    // 2. Lógica de Bifurcación Tricéfala
    if (!cliente) {
      // CASO A: Cliente totalmente nuevo (Fast-Checkout)
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

      if (insertError) throw new Error(`Error insertando cliente: ${insertError.message}`);
      clienteFinal = nuevoCliente;

    } else {
      // CASO B: Cliente Legado (Tiene cuenta, pero no tiene Hash válido)
      // Detectamos si el campo es nulo o si usted metió el texto plano por accidente (menos de 20 caracteres)
      if (!cliente.pin_hash || cliente.pin_hash.length < 20) {
        
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pin, salt);

        const { data: clienteActualizado, error: updateError } = await supabaseAdmin
          .from('clientes')
          .update({ pin_hash: hash })
          .eq('id', cliente.id)
          .select()
          .single();

        if (updateError) throw new Error(`Error migrando cliente: ${updateError.message}`);
        clienteFinal = clienteActualizado;
        
      } else {
        // CASO C: Cliente Moderno (Validación Estándar)
        const pinValido = await bcrypt.compare(pin, cliente.pin_hash);
        if (!pinValido) {
          return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
        }
      }
    }

    if (!clienteFinal) throw new Error('Fallo crítico de resolución de identidad.');

    // 3. Firma Criptográfica de la Sesión
    const token = jwt.sign(
      { id: clienteFinal.id, telefono: clienteFinal.telefono, rango: clienteFinal.rango },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // 4. Empaquetado de Cookie
    const cookieSerialized = serialize('sua_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    const response = NextResponse.json({ exito: true, cliente: clienteFinal });
    response.headers.append('Set-Cookie', cookieSerialized);
    return response;

  } catch (error: any) {
    console.error('Fallo en el protocolo de autenticación:', error);
    return NextResponse.json({ 
      error: `Error 500: ${error.message || 'Fallo desconocido en el servidor'}` 
    }, { status: 500 });
  }
}