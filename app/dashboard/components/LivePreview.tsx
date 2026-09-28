'use client'

import { useEvent } from '@/context/EventContext'

export default function LivePreview() {
  const { eventData } = useEvent()
  const { title, event_date, design_config } = eventData

  // Formatear la fecha para que se vea legible
  const formattedDate = new Date(event_date).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    // Contenedor que simula la pantalla de un teléfono (iPhone)
    <div className="w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl border-[8px] border-gray-900 overflow-hidden relative">
      
      {/* Dynamic Content */}
      <div className="h-full overflow-y-auto pb-20">
        
        {/* Cabecera dinámica con el color elegido */}
        <div 
          className="h-64 flex flex-col items-center justify-center text-white text-center p-6"
          style={{ backgroundColor: design_config.primaryColor }}
        >
          <p className="text-sm uppercase tracking-widest mb-2 opacity-80">Estás invitado a</p>
          <h1 className="text-3xl font-serif">{title}</h1>
        </div>

        {/* Detalles */}
        <div className="p-8 text-center space-y-6">
          <div>
            <h3 className="text-gray-500 text-sm uppercase tracking-wider">Cuándo</h3>
            <p className="text-lg text-gray-800 font-medium capitalize mt-1">{formattedDate}</p>
          </div>

          {/* Renderizado condicional basado en el toggle */}
          {design_config.showGifts && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-2">Mesa de Regalos</h3>
              <p className="text-sm text-gray-600">El mejor regalo es tu asistencia, pero si deseas tener un detalle con nosotros, haz clic abajo.</p>
              <button 
                className="mt-4 px-6 py-2 rounded-full text-white text-sm"
                style={{ backgroundColor: design_config.primaryColor }}
              >
                Ver opciones
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Botón Flotante RSVP (Simulación) */}
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button 
          className="w-full py-4 rounded-xl text-white font-bold shadow-lg"
          style={{ backgroundColor: design_config.primaryColor }}
        >
          Confirmar Asistencia
        </button>
      </div>

    </div>
  )
}