'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { QRCodeSVG } from 'qrcode.react'

// Definimos los tipos de datos que recibimos del servidor
type Pass = {
  id: string
  guest_name: string
  rsvp_status: 'pending' | 'confirmed' | 'declined'
  dietary_restrictions: string | null
  qr_hash: string
}

export default function RSVPForm({ groupId, initialPasses, primaryColor }: { groupId: string, initialPasses: Pass[], primaryColor: string }) {
  const [passes, setPasses] = useState<Pass[]>(initialPasses)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  // Actualiza el estado local de un pase específico
  const updatePass = (id: string, field: keyof Pass, value: string) => {
    setPasses(passes.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  // Guardar en base de datos
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Iteramos y actualizamos cada pase en Supabase
    for (const pass of passes) {
      await supabase
        .from('individual_passes')
        .update({
          rsvp_status: pass.rsvp_status,
          dietary_restrictions: pass.dietary_restrictions
        })
        .eq('id', pass.id)
    }

    setIsSubmitting(false)
    setSuccess(true)
  }

  // Si ya guardó con éxito, mostramos los QRs de los confirmados
  if (success) {
    const confirmedPasses = passes.filter(p => p.rsvp_status === 'confirmed')
    
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800">¡Gracias por confirmar!</h2>
        {confirmedPasses.length === 0 ? (
          <p className="text-gray-600">Lamentamos que no puedan acompañarnos.</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-6">Presenta estos códigos QR en la entrada del evento:</p>
            {confirmedPasses.map(pass => (
              <div key={pass.id} className="mb-8 p-4 border-2 border-dashed rounded-xl">
                <p className="font-bold text-lg mb-4">{pass.guest_name}</p>
                {/* Dibujamos el Hash seguro como QR */}
                <div className="flex justify-center">
                  <QRCodeSVG value={pass.qr_hash} size={180} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Vista del Formulario
  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm text-center mb-6">Por favor, confirma la asistencia de cada invitado:</p>
      
      {passes.map((pass) => (
        <div key={pass.id} className="p-4 bg-gray-50 rounded-xl border">
          <p className="font-bold text-gray-800 mb-3">{pass.guest_name}</p>
          
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => updatePass(pass.id, 'rsvp_status', 'confirmed')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                pass.rsvp_status === 'confirmed' ? 'text-white' : 'bg-white text-gray-600 border'
              }`}
              style={{ backgroundColor: pass.rsvp_status === 'confirmed' ? primaryColor : undefined }}
            >
              Sí, asistiré
            </button>
            <button
              onClick={() => updatePass(pass.id, 'rsvp_status', 'declined')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                pass.rsvp_status === 'declined' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              No asistiré
            </button>
          </div>

          {/* Solo preguntamos alergias si va a asistir */}
          {pass.rsvp_status === 'confirmed' && (
            <input
              type="text"
              placeholder="¿Alergias o restricciones? (Opcional)"
              value={pass.dietary_restrictions || ''}
              onChange={(e) => updatePass(pass.id, 'dietary_restrictions', e.target.value)}
              className="w-full p-2 text-sm border rounded focus:ring-2 focus:outline-none"
            />
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || passes.some(p => p.rsvp_status === 'pending')}
        className="w-full py-4 mt-4 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: primaryColor }}
      >
        {isSubmitting ? 'Guardando...' : 'Enviar Confirmación'}
      </button>
      
      {passes.some(p => p.rsvp_status === 'pending') && (
        <p className="text-xs text-red-500 text-center mt-2">
          Debes seleccionar Sí o No para todos los invitados antes de enviar.
        </p>
      )}
    </div>
  )
}