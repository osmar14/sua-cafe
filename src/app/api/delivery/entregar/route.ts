import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function DELETE(request: Request) {
  try {
    // 🛠️ CORRECCIÓN: Inyección de 'await' en la validación
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

    // Ejecución de Borrado Táctico
    const { error } = await supabaseAdmin.from('pedidos').delete().eq('id', id_pedido);

    if (error) throw error;

    return NextResponse.json({ exito: true });
  } catch (error: any) {
    console.error('Fallo en eliminación:', error);
    return NextResponse.json({ error: 'Error en la matriz de borrado' }, { status: 500 });
  }
}