'use client'

import { useEvent } from '@/context/EventContext'

export default function EditorForm() {
  const { eventData, updateEventData, updateDesignConfig } = useEvent()

  // Formatear la fecha para que el input type="datetime-local" la reconozca (YYYY-MM-DDTHH:mm)
  const formattedDate = eventData?.event_date 
    ? new Date(new Date(eventData.event_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : ''

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SECCIÓN: Información Básica */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Información Básica
        </h2>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título de la Invitación
          </label>
          <input
            id="title"
            type="text"
            value={eventData.title}
            onChange={(e) => updateEventData({ title: e.target.value })}
            placeholder="Ej. Boda de Ana y Carlos"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y Hora del Evento
          </label>
          <input
            id="event_date"
            type="datetime-local"
            value={formattedDate}
            onChange={(e) => updateEventData({ event_date: new Date(e.target.value).toISOString() })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </section>

      {/* SECCIÓN: Apariencia */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Apariencia
        </h2>
        
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
            Color Principal
          </label>
          <div className="flex items-center space-x-3">
            <input
              id="primaryColor"
              type="color"
              value={eventData.design_config.primaryColor}
              onChange={(e) => updateDesignConfig({ primaryColor: e.target.value })}
              className="h-10 w-10 cursor-pointer rounded-md border border-gray-300 bg-white p-0.5"
            />
            <span className="text-sm text-gray-500 font-mono uppercase bg-gray-100 px-2 py-1 rounded">
              {eventData.design_config.primaryColor}
            </span>
          </div>
        </div>
      </section>

      {/* SECCIÓN: Módulos y Secciones */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Módulos de la Invitación
        </h2>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <span className="block text-sm font-medium text-gray-900">Mesa de Regalos</span>
            <span className="text-xs text-gray-500">Muestra la sección de sobres o regalos en efectivo.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={eventData.design_config.showGifts}
              onChange={(e) => updateDesignConfig({ showGifts: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </section>

      {/* SECCIÓN DE CONTACTO: ORGANIZADOR / WEDDING PLANNER */}
      <section className="space-y-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Contacto del Organizador / Wedding Planner</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Se mostrará a los invitados en la invitación para resolver dudas o solicitar cambios en sus pases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campo Teléfono / WhatsApp */}
          <div>
            <label htmlFor="organizer_phone" className="block text-xs font-medium text-gray-700 mb-1.5">
              Teléfono / WhatsApp
            </label>
            <input
              id="organizer_phone"
              type="tel"
              placeholder="Ej. +52 81 1234 5678"
              value={eventData?.design_config?.organizerPhone || ''}
              onChange={(e) =>
                updateEventData({
                  design_config: {
                    ...eventData.design_config,
                    organizerPhone: e.target.value
                  }
                })
              }
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Campo Correo de Contacto */}
          <div>
            <label htmlFor="organizer_email" className="block text-xs font-medium text-gray-700 mb-1.5">
              Correo Electrónico
            </label>
            <input
              id="organizer_email"
              type="email"
              placeholder="Ej. planner@tuinvita.online"
              value={eventData?.design_config?.organizerEmail || ''}
              onChange={(e) =>
                updateEventData({
                  design_config: {
                    ...eventData.design_config,
                    organizerEmail: e.target.value
                  }
                })
              }
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>
      </section>

    </div>
  )
}