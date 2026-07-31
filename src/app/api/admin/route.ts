import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  let payload: any = {};
  
  try {
    // 1. Verificación de Seguridad (Bóveda JWT)
    const cookieStore = await cookies();
    const token = cookieStore.get('sua_lock_session'); // Llave de acceso de su panel
    
    if (!token) {
      return NextResponse.json({ error: 'Acceso denegado: Credenciales no detectadas en el perímetro.' }, { status: 401 });
    }
    
    jwt.verify(token.value, process.env.JWT_SECRET || 'secreto_de_respaldo');

    // 2. Extracción de la Orden del Cliente
    payload = await request.json();
    const { action, data } = payload;

    if (!action || !data) {
       return NextResponse.json({ error: 'Paquete de datos incompleto o malformado.' }, { status: 400 });
    }

    // 3. Conexión de Máxima Autoridad (Bypass seguro de RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Enrutador Lógico Central (Multiplexor)
    switch (action) {
      
      // --- MÓDULO DE INSUMOS ---
      case 'crear_insumo': {
        const { error } = await supabaseAdmin.from('insumos').insert([data]);
        if (error) throw error;
        break;
      }
      case 'eliminar_insumo': {
        const { error } = await supabaseAdmin.from('insumos').delete().eq('id', data.id);
        if (error) throw error;
        break;
      }

      // --- MÓDULO FINANCIERO (GASTOS Y DEUDAS) ---
      case 'crear_gasto': {
        const { error } = await supabaseAdmin.from('gastos').insert([data]);
        if (error) throw error;
        break;
      }
      case 'crear_deuda': {
        const { error } = await supabaseAdmin.from('deudas').insert([data]);
        if (error) throw error;
        break;
      }
      case 'eliminar_deuda': {
        const { error } = await supabaseAdmin.from('deudas').delete().eq('id', data.id);
        if (error) throw error;
        break;
      }

      // Válvula de escape para instrucciones no reconocidas
      default:
        return NextResponse.json({ error: 'Acción no reconocida por el procesador central.' }, { status: 400 });
    }

    // 5. Confirmación de éxito
    return NextResponse.json({ exito: true });

  } catch (error: any) {
    console.error(`Falla crítica en la matriz del servidor [Acción: ${payload?.action || 'Desconocida'}]:`, error);
    return NextResponse.json({ error: 'Falla en la ejecución del comando.' }, { status: 500 });
  }
}