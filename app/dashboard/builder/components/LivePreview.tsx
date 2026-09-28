'use client'

import { useEvent } from '@/context/EventContext'

export default function LivePreview() {
  const { eventData } = useEvent()

  return (
    <div className="w-[375px] h-[750px] bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-gray-900 flex flex-col overflow-hidden relative">
      
      {/* Dynamic Island simulada */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>

      {/* Contenedor principal de la invitación (Scrollable interno) */}
      <div 
        className="flex-1 flex flex-col items-center p-8 text-center overflow-y-auto transition-colors duration-500 ease-in-out pt-16"
        style={{ 
          backgroundColor: `${eventData.design_config.primaryColor}10` 
        }}
      >
        <span className="text-xs uppercase tracking-widest text-gray-500 mb-2">
          Estás invitado a la celebración
        </span>
        
        {/* Título reactivo */}
        <h2 
          className="text-3xl font-serif mb-4"
          style={{ color: eventData.design_config.primaryColor }}
        >
          {eventData.title || 'Título de tu Evento'}
        </h2>

        <div className="w-12 h-px bg-gray-300 my-4"></div>

        {/* Fecha reactiva */}
        <p className="text-gray-700 font-medium text-sm mb-8 capitalize">
          {eventData.event_date ? new Date(eventData.event_date).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Fecha por definir'}
        </p>

        {/* Módulo condicional de Mesa de Regalos */}
        {eventData.design_config.showGifts && (
          <div className="w-full bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm mt-auto mb-4 animate-fade-in">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-lg">🎁</span>
              <h3 className="font-semibold text-gray-900 text-sm">Mesa de Regalos</h3>
            </div>
            <p className="text-xs text-gray-500">
              Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros...
            </p>
          </div>
        )}
      </div>

    </div>
  )
}