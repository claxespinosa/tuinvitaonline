import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import RsvpModule from '../components/RsvpModule'

export const revalidate = 0

export default async function PublicInvitation({
  params
}: {
  params: Promise<{ slug: string, guestId: string }>
}) {
  const supabase = await createClient()
  const { slug, guestId } = await params
  
  // 1. Buscamos el evento
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (eventError || !event) notFound()

  // 2. Buscamos el grupo de invitados usando el UUID de la URL
  // Asumiendo que guestId es el id de guest_groups
  const { data: group, error: groupError } = await supabase
    .from('guest_groups')
    .select('*, individual_passes(*)')
    .eq('id', guestId)
    .single()

  if (groupError || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <h1 className="text-2xl text-gray-800">Invitación no encontrada o enlace inválido 😕</h1>
      </div>
    )
  }

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'Fecha por definir'

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 transition-colors duration-500"
      style={{ backgroundColor: `${event.design_config.primaryColor}10` }}
    >
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-xl text-center border border-gray-100">
        
        <span className="text-xs uppercase tracking-widest text-gray-500 mb-4 block font-semibold">
          Estás invitado a la celebración
        </span>
        
        {/* Saludo personalizado directo desde el servidor */}
        <h2 className="text-xl text-gray-600 mb-2 font-medium">
          ¡Hola, {group.group_name}!
        </h2>

        <h1 className="text-4xl md:text-5xl font-serif mb-6" style={{ color: event.design_config.primaryColor }}>
          {event.title}
        </h1>

        <div className="w-16 h-px bg-gray-300 mx-auto my-6"></div>

        <p className="text-gray-700 font-medium text-lg mb-10 capitalize">
          {formattedDate}
        </p>

        {event.design_config.showGifts && (
          <div className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-8 mb-8">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-2xl">🎁</span>
              <h3 className="font-semibold text-gray-900 text-base">Mesa de Regalos</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros, tendremos un buzón para sobres el día del evento.
            </p>
          </div>
        )}

        {/* Le pasamos los pases directamente al módulo RSVP para evitar búsquedas */}
        <RsvpModule 
          initialPasses={group.individual_passes} 
          primaryColor={event.design_config.primaryColor} 
          contactEmail={group.contact_email}
          organizerPhone={event.design_config?.organizerPhone}
          organizerEmail={event.design_config?.organizerEmail}
          eventTitle={event.title}
          eventDate={formattedDate}
          eventLocation={event.location || event.design_config?.location || 'Ubicación por confirmar'}
        />

      </div>

      
    </main>
  )
}