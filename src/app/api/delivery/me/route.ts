import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  // 🛠️ CORRECCIÓN: Inyección de 'await'
  const cookieStore = await cookies();
  const token = cookieStore.get('delivery_session');

  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'secreto_de_respaldo';
    jwt.verify(token.value, jwtSecret);
    return NextResponse.json({ exito: true });
  } catch (error) {
    return NextResponse.json({ error: 'Firma de sesión caducada' }, { status: 401 });
  }
}