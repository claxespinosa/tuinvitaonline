import { createClient } from '@supabase/supabase-js'

// Inicializa Supabase con la llave maestra para saltar el RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)