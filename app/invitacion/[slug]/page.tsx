import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function PublicInvitation({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const supabase = await createClient()
  
  // 1. En Next.js > 14, params es una promesa. Debemos usar await.
  const resolvedParams = await params
  
  // 2. Buscamos el evento público
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single()

  // 3. Manejo de errores claro si la base de datos bloquea o no encuentra el registro
  if (error || !event) {
    console.error("Error buscando la invitación:", error?.message || "No se encontró el slug")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl text-gray-800">Invitación no encontrada 😕</h1>
      </div>
    )
  }

  // 4. Formateamos la fecha para lectura pública
  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
        
        <h1 
          className="text-4xl md:text-5xl font-serif mb-6"
          style={{ color: event.design_config.primaryColor }}
        >
          {event.title}
        </h1>

        <div className="w-16 h-px bg-gray-300 mx-auto my-6"></div>

        <p className="text-gray-700 font-medium text-lg mb-10 capitalize">
          {formattedDate}
        </p>

        {event.design_config.showGifts && (
          <div className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-8">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-2xl">🎁</span>
              <h3 className="font-semibold text-gray-900 text-base">Mesa de Regalos</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros, tendremos un buzón para sobres el día del evento.
            </p>
          </div>
        )}

        <button 
          className="mt-10 w-full text-white font-semibold py-4 px-6 rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: event.design_config.primaryColor }}
        >
          Confirmar Asistencia
        </button>

      </div>
    </main>
  )
}