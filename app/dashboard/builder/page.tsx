import { createClient } from '@/utils/supabase/server'
import { EventProvider } from '@/context/EventContext'
import EditorForm from './components/EditorForm'
import LivePreview from './components/LivePreview'
import SaveIndicator from './components/SaveIndicator'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardBuilder() {
  const supabase = await createClient()

  // 1. Verificar el usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // 2. Buscar el evento en la BD
  let { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  // 3. Si no existe, lo creamos (Enviando el ID explícitamente)
  if (!eventData || eventError) {
    const newId = crypto.randomUUID() // Generamos el ID antes para usarlo en el slug
    
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert({
        id: newId, 
        owner_id: user.id,
        title: 'Mi Evento',
        slug: `mi-evento-${newId.split('-')[0]}`, // <-- 🚀 AGREGAMOS EL SLUG OBLIGATORIO AQUÍ
        event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        design_config: { primaryColor: '#3b82f6', fontFamily: 'sans', showGifts: true }
      })
      .select()
      .single()

    if (createError) {
      // 🚨 MOSTRAMOS EL ERROR EXPLÍCITO EN PANTALLA PARA DEBUGEAR 🚨
      throw new Error(`Error de BD: ${createError.message} | Detalles: ${createError.details}`)
    } else {
      eventData = newEvent
    }
  }

  return (
    <EventProvider initialData={eventData}>
      <div className="flex h-[calc(100vh-4rem)] md:h-full bg-gray-50 overflow-hidden rounded-xl border border-gray-200">
        
        {/* PANEL IZQUIERDO */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto border-r border-gray-200 bg-white p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Editor de Invitación</h1>
            <SaveIndicator />
          </div>
          <EditorForm />
        </div>

        {/* PANEL DERECHO */}
        <div className="hidden md:flex w-1/2 h-full items-center justify-center bg-gray-100 p-8">
          <LivePreview />
        </div>

      </div>
    </EventProvider>
  )
}