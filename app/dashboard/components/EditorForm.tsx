'use client'

import { useEvent } from '@/context/EventContext'

export default function EditorForm() {
  const { eventData, updateEventData, updateDesignConfig } = useEvent()

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN 1: Textos Básicos */}
      <div className="bg-gray-50 p-4 rounded border">
        <h2 className="font-semibold mb-4 text-gray-700">1. Detalles Principales</h2>
        
        <label className="block text-sm mb-1 text-gray-600">Título del Evento</label>
        <input 
          type="text" 
          value={eventData.title}
          onChange={(e) => updateEventData({ title: e.target.value })}
          className="w-full p-2 border rounded mb-4"
        />

        <label className="block text-sm mb-1 text-gray-600">Fecha y Hora</label>
        <input 
          type="datetime-local" 
          value={eventData.event_date.slice(0, 16)}
          onChange={(e) => updateEventData({ event_date: new Date(e.target.value).toISOString() })}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* SECCIÓN 2: Diseño */}
      <div className="bg-gray-50 p-4 rounded border">
        <h2 className="font-semibold mb-4 text-gray-700">2. Estilo Visual</h2>
        
        <label className="block text-sm mb-1 text-gray-600">Color Primario</label>
        <input 
          type="color" 
          value={eventData.design_config.primaryColor}
          onChange={(e) => updateDesignConfig({ primaryColor: e.target.value })}
          className="w-full h-10 border rounded mb-4 cursor-pointer"
        />

        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={eventData.design_config.showGifts}
            onChange={(e) => updateDesignConfig({ showGifts: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Mostrar sección de Mesa de Regalos</span>
        </label>
      </div>

    </div>
    
  )
}