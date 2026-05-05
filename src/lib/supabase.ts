import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ ERROR CRÍTICO: No se detectan las llaves en .env.local. Verifica que el archivo esté en la RAÍZ del proyecto.")
}

export const supabase = createClient(supabaseUrl, supabaseKey)