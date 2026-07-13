import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('delivery_session');
    
    if (!token) return NextResponse.json({ error: 'Infiltración detectada' }, { status: 401 });
    
    jwt.verify(token.value, process.env.JWT_SECRET || 'secreto_de_respaldo');

    const { id_pedido } = await request.json();

    // Conexión de Máxima Autoridad
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🛠️ CORRECCIÓN: Actualización táctica en lugar de borrado
    const { error } = await supabaseAdmin
      .from('pedidos')
      .update({ estado: 'entregado' })
      .eq('id', id_pedido);

    if (error) throw error;

    return NextResponse.json({ exito: true });
  } catch (error: any) {
    console.error('Fallo en actualización:', error);
    return NextResponse.json({ error: 'Error en la matriz de actualización' }, { status: 500 });
  }
}