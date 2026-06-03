import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(request: Request) {
  try {
    // 1. Verificación Estricta de Variables de Entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Fallo de Infraestructura: Faltan las llaves de Supabase en Vercel.' 
      }, { status: 500 });
    }

    // Inicializamos el cliente administrador de forma segura
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { telefono, pin } = body;

    if (!telefono || telefono.length !== 10 || !pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Formato de credenciales inválido' }, { status: 400 });
    }

    // 2. Búsqueda en Base de Datos
    const { data: cliente, error: dbError } = await supabaseAdmin
      .from('clientes')
      .select('id, telefono, pin_hash, nombre, rango, visitas')
      .eq('telefono', telefono)
      .single();

    // Si hay un error que NO sea "no se encontró el cliente", colapsamos.
    if (dbError && dbError.code !== 'PGRST116') {
      throw new Error(`Error leyendo Supabase: ${dbError.message}`);
    }

    let clienteFinal = cliente;

    // 3. Lógica de Registro o Acceso
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

      if (insertError) {
        throw new Error(`Error insertando cliente: ${insertError.message}`);
      }
      clienteFinal = nuevoCliente;
    } else {
      const pinValido = await bcrypt.compare(pin, cliente.pin_hash);
      if (!pinValido) {
        return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
      }
    }

    if (!clienteFinal) {
      throw new Error('Fallo crítico: clienteFinal es nulo tras la operación.');
    }

    // 4. Firma del Token
    const token = jwt.sign(
      { id: clienteFinal.id, telefono: clienteFinal.telefono, rango: clienteFinal.rango },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // 5. Empaquetado de Cookie
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
    // 🚨 EL REVELADOR DE VERDAD: Ahora el servidor nos enviará el texto exacto del fallo
    console.error('Fallo en el protocolo de autenticación:', error);
    return NextResponse.json({ 
      error: `Error 500: ${error.message || 'Fallo desconocido en el servidor'}` 
    }, { status: 500 });
  }
}