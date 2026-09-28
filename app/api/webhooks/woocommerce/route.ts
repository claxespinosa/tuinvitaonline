import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 1. Evita que Next.js intente analizar o pre-renderizar este webhook en el build
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 2. Instanciación segura dentro de la petición
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Faltan credenciales de Supabase en las variables de entorno')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Validación de Seguridad Estricta
    const signature = request.headers.get('x-wc-webhook-secret')
    if (signature !== process.env.WC_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Firma no válida. Acceso denegado.' }, { status: 401 })
    }

    // 2. Extraer el Payload de la Orden
    const body = await request.json()
    
    if (body.status !== 'completed') {
      return NextResponse.json({ message: 'Orden ignorada: no está completada.' }, { status: 200 })
    }

    const customerEmail = body.billing.email
    const customerName = body.billing.first_name
    
    const eventTitle = `Evento de ${customerName}` 
    const tempSlug = `${customerName.toLowerCase()}-${Date.now().toString().slice(-4)}`

    // 3. Crear el Usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
      user_metadata: { name: customerName }
    })

    let userId = authData?.user?.id

    if (authError && authError.message.includes('already exists')) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === customerEmail)
      if (existingUser) userId = existingUser.id
    } else if (authError) {
      throw new Error(`Error creando usuario: ${authError.message}`)
    }

    if (!userId) throw new Error('No se pudo establecer el ID del anfitrión')

    // 4. Crear el Registro del Evento
    const { error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        owner_id: userId,
        title: eventTitle,
        slug: tempSlug,
        event_date: new Date(Date.now() + 2592000000).toISOString(),
        tenant_brand: 'tuinvita'
      })

    if (eventError) throw new Error(`Error creando evento: ${eventError.message}`)

    // 5. Respuesta de Éxito
    return NextResponse.json({ 
      success: true, 
      message: 'Cuenta y evento aprovisionados correctamente' 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}