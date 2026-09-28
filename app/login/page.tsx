'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const supabase = createClient()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Esta ruta es vital: le dice a Supabase a dónde enviar al usuario después de hacer clic en el correo
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error enviando magic link:', error)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Acceso Anfitriones
        </h1>
        
        {status === 'success' ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center font-medium">
            ¡Enlace enviado! Revisa tu bandeja de entrada (y la carpeta de spam).
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo con el que compraste tu invitación
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                disabled={status === 'loading'}
              />
            </div>
            
            {status === 'error' && (
              <p className="text-red-600 text-sm">Ocurrió un error al enviar el enlace. Intenta de nuevo.</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:bg-blue-400"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviarme enlace mágico'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}