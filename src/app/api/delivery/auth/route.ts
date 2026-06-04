import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const pinReal = process.env.DELIVERY_PIN;
    const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';

    if (!pinReal) {
      return NextResponse.json({ error: 'Fallo de infraestructura: PIN no configurado en el servidor.' }, { status: 500 });
    }

    if (pin === pinReal) {
      const token = jwt.sign({ rol: 'escuadron_reparto' }, jwtSecret, { expiresIn: '12h' });

      const cookieSerialized = serialize('delivery_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 12, // 12 Horas de turno operativo
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