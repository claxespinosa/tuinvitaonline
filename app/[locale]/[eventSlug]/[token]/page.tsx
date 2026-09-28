import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import RSVPForm from './components/RSVPForm'

// Definimos los parámetros que vienen de la URL
interface PageProps {
  params: {
    locale: string
    eventSlug: string
    token: string
  }
}

export default async function PublicRSVPPage({ params }: PageProps) {
  const supabase = createClient()
  
  // 1. Consulta Relacional: Buscamos el grupo usando el token, 
  // validamos que el slug del evento coincida, y traemos los pases de esa familia.
  const { data: groupData, error } = await supabase
    .from('guest_groups')
    .select(`
      id,
      group_name,
      host_message,
      events!inner ( id, title, event_date, design_config ),
      individual_passes ( id, guest_name, rsvp_status, pass_status, dietary_restrictions, qr_hash )
    `)
    .eq('magic_link_token', params.token)
    .eq('events.slug', params.eventSlug)
    .single()

  // Si el token no existe, fue manipulado o el slug está mal, devolvemos un 404
  if (error || !groupData) {
    notFound() 
  }

  const event = groupData.events
  const passes = groupData.individual_passes

  return (
    <main 
      className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4"
      style={{ fontFamily: event.design_config.fontFamily || 'sans-serif' }}
    >
      {/* Cabecera del Evento */}
      <div 
        className="w-full max-w-md p-8 rounded-t-3xl shadow-lg text-white text-center"
        style={{ backgroundColor: event.design_config.primaryColor || '#3b82f6' }}
      >
        <p className="text-sm uppercase tracking-widest mb-2 opacity-90">Invitación Oficial</p>
        <h1 className="text-3xl font-serif mb-4">{event.title}</h1>
        <p className="text-lg opacity-90">Familia / Grupo: {groupData.group_name}</p>
      </div>

      {/* Formulario Cliente para confirmar asistencia */}
      <div className="w-full max-w-md bg-white p-6 rounded-b-3xl shadow-lg border-t-0">
        <RSVPForm 
          groupId={groupData.id} 
          initialPasses={passes} 
          primaryColor={event.design_config.primaryColor || '#3b82f6'} 
        />
      </div>
    </main>
  )
}