// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_respaldo_inseguro';

export async function GET() {
  try {
    // 1. Extraer la cookie segura
    const cookieStore = await cookies();
    const token = cookieStore.get('sua_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Desencriptar y validar la firma matemática del token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, telefono: string };

    // 3. Consultar datos frescos del cliente (para mantener visitas y rango al día)
    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('id, nombre, telefono, rango, visitas, domicilio_entrega')
      .eq('id', decoded.id)
      .single();

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ exito: true, cliente });

  } catch (error) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
}