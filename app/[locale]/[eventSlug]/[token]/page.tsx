import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import RSVPForm from './components/RSVPForm'

// En Next.js 16 params es una Promesa
interface PageProps {
  params: Promise<{
    locale: string
    eventSlug: string
    token: string
  }>
}

export default async function PublicRSVPPage({ params }: PageProps) {
  // 1. Resolvemos los params asíncronos
  const { eventSlug, token } = await params

  // 2. Inicializamos el cliente del servidor con await
  const supabase = await createClient()

  // 3. Consulta relacional a Supabase
  const { data: groupData, error } = await supabase
    .from('guest_groups')
    .select(`
      id,
      group_name,
      host_message,
      events!inner ( id, title, event_date, design_config ),
      individual_passes ( id, guest_name, rsvp_status, pass_status, dietary_restrictions, qr_hash )
    `)
    .eq('magic_link_token', token)
    .eq('events.slug', eventSlug)
    .single()

  if (error || !groupData) {
    notFound()
  }

  // Soporte seguro si Supabase devuelve events como objeto o arreglo
  const rawEvent = groupData.events as any
  const event = Array.isArray(rawEvent) ? rawEvent[0] : rawEvent
  const designConfig = event?.design_config || {}
  const passes = groupData.individual_passes || []

  const primaryColor = designConfig.primaryColor || '#3b82f6'
  const fontFamily = designConfig.fontFamily || 'sans-serif'

  return (
    <main 
      className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4"
      style={{ fontFamily }}
    >
      {/* Cabecera del Evento */}
      <div 
        className="w-full max-w-md p-8 rounded-t-3xl shadow-lg text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <p className="text-sm uppercase tracking-widest mb-2 opacity-90">Invitación Oficial</p>
        <h1 className="text-3xl font-serif mb-4">{event?.title || 'Invitación'}</h1>
        <p className="text-lg opacity-90">Familia / Grupo: {groupData.group_name}</p>
      </div>

      {/* Formulario Cliente */}
      <div className="w-full max-w-md bg-white p-6 rounded-b-3xl shadow-lg border-t-0">
        <RSVPForm 
          groupId={groupData.id} 
          initialPasses={passes} 
          primaryColor={primaryColor} 
        />
      </div>
    </main>
  )
}