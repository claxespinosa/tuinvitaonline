'use client'
import { useEvent } from '@/context/EventContext'

export default function SaveIndicator() {
  const { isSaving } = useEvent()

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors duration-300 ${
      isSaving 
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
        : 'bg-green-50 text-green-700 border-green-200'
    }`}>
      {isSaving ? 'Guardando...' : 'Guardado en la nube'}
    </span>
  )
}