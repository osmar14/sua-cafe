import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(request: Request) {
  try {
    const { pin, modulo } = await request.json();
    
    // Leemos los pines de la bóveda segura
    const adminPin = process.env.ADMIN_PIN;
    const cajaPin = process.env.CAJA_PIN || adminPin; // Si no hay PIN de caja, el admin funciona
    const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';

    if (!adminPin) {
      return NextResponse.json({ error: 'Fallo de infraestructura: PIN no configurado.' }, { status: 500 });
    }

    // Lógica de bifurcación: Dependiendo de qué estemos bloqueando, validamos un PIN u otro
    let accesoConcedido = false;
    let rol = '';

    if (modulo === 'caja' && pin === cajaPin) {
      accesoConcedido = true;
      rol = 'operador_caja';
    } else if (pin === adminPin) {
      // El PIN de admin es la llave maestra, abre todo (Caja, Admin, Finanzas)
      accesoConcedido = true;
      rol = 'comandante_supremo';
    }

    if (accesoConcedido) {
      const token = jwt.sign({ rol }, jwtSecret, { expiresIn: '12h' });

      // Creamos una cookie llamada 'sua_lock_session'
      const cookieSerialized = serialize('sua_lock_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 12,
        path: '/',
      });

      const response = NextResponse.json({ exito: true });
      response.headers.append('Set-Cookie', cookieSerialized);
      return response;
    } else {
      return NextResponse.json({ error: 'Clave de acceso denegada' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando solicitud de seguridad' }, { status: 500 });
  }
}