'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

// Definimos la estructura de los datos del evento
type EventData = {
  id: string
  title: string
  event_date: string
  design_config: {
    primaryColor: string
    fontFamily: string
    showGifts: boolean
  }
}

type EventContextType = {
  eventData: EventData
  updateEventData: (newData: Partial<EventData>) => void
  updateDesignConfig: (newConfig: Partial<EventData['design_config']>) => void
  isSaving: boolean
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children, initialData }: { children: React.ReactNode, initialData: EventData }) {
  const [eventData, setEventData] = useState<EventData>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  // Funciones para actualizar el estado local al instante
  const updateEventData = (newData: Partial<EventData>) => {
    setEventData((prev) => ({ ...prev, ...newData }))
  }

  const updateDesignConfig = (newConfig: Partial<EventData['design_config']>) => {
    setEventData((prev) => ({
      ...prev,
      design_config: { ...prev.design_config, ...newConfig }
    }))
  }

  // AUTO-GUARDADO (Debounce): Espera 1 segundo después de que el usuario deja de teclear para guardar en BD
  // AUTO-GUARDADO (Debounce): Espera 1 segundo después de que el usuario deja de teclear
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      setIsSaving(true)
      try {
        const { error } = await supabase
          .from('events')
          .update({
            title: eventData.title,
            event_date: eventData.event_date,
            design_config: eventData.design_config
          })
          .eq('id', eventData.id)
        
        if (error) {
          console.error('Error al guardar en Supabase:', error.message)
        }
      } catch (err) {
        console.error('Error inesperado:', err)
      } finally {
        // El finally garantiza que siempre se apague el indicador, haya error o éxito
        setIsSaving(false)
      }
    }, 1000)

    return () => clearTimeout(saveTimer)
  }, [eventData, supabase])

  return (
    <EventContext.Provider value={{ eventData, updateEventData, updateDesignConfig, isSaving }}>
      {children}
    </EventContext.Provider>
  )
}

export const useEvent = () => {
  const context = useContext(EventContext)
  if (!context) throw new Error('useEvent debe usarse dentro de EventProvider')
  return context
}