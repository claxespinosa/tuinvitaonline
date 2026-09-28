import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Delegamos toda la lógica de seguridad al archivo especializado
  return await updateSession(request)
}

// Configuramos en qué rutas debe ejecutarse este proxy
export const config = {
  matcher: [
    /*
     * Intercepta todas las peticiones excepto:
     * - Archivos estáticos de Next.js (_next/static, _next/image)
     * - Favicon y archivos de imagen (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}