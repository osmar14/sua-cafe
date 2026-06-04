import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sua_lock_session');

  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    jwt.verify(token.value, process.env.JWT_SECRET || 'secreto_de_respaldo');
    return NextResponse.json({ exito: true });
  } catch (error) {
    return NextResponse.json({ error: 'Firma de sesión caducada' }, { status: 401 });
  }
}