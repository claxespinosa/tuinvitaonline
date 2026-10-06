'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// Tipos de datos esperados de Supabase
type PassData = {
  id: string
  guest_name: string
  rsvp_status: string
  scanned_at: string | null
  event_tables?: {
    table_number_or_name: string
  } | null
}

export default function PassValidationPage() {
  const params = useParams()
  const hash = params?.hash as string
  const supabase = createClient()

  // Estados de la interfaz
  const [isStaff, setIsStaff] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passData, setPassData] = useState<PassData | null>(null)
  const [scanMessage, setScanMessage] = useState('')

  // 1. Revisar si el dispositivo ya tiene una sesión de Staff iniciada (memoria local)
  useEffect(() => {
    const savedPin = sessionStorage.getItem('staff_pin')
    if (savedPin) {
      validateStaffPin(savedPin)
    }
  }, [hash])

  // 2. Validar el PIN contra la tabla event_staff
  const validateStaffPin = async (pin: string) => {
    setLoading(true)
    setPinError('')

    const { data: staffMember, error } = await supabase
      .from('event_staff')
      .select('id, role')
      .eq('pin_code', pin)
      .single()

    if (error || !staffMember) {
      setPinError('PIN de acceso inválido')
      sessionStorage.removeItem('staff_pin')
      setIsStaff(false)
      setLoading(false)
      return
    }

    // PIN correcto: Guardamos sesión y buscamos los datos del pase
    sessionStorage.setItem('staff_pin', pin)
    setIsStaff(true)
    await fetchPassData()
    setLoading(false)
  }

  // 3. Buscar la información del invitado usando el qr_hash de la URL
  const fetchPassData = async () => {
    const { data, error } = await supabase
      .from('individual_passes')
      .select(`
        id,
        guest_name,
        rsvp_status,
        scanned_at,
        event_tables ( table_number_or_name )
      `)
      .eq('qr_hash', hash)
      .single()

    if (data) {
      setPassData(data as unknown as PassData)
    }
  }

  // 4. Registrar el Check-in en la base de datos
  const handleCheckIn = async () => {
    if (!passData) return
    setLoading(true)

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('individual_passes')
      .update({ scanned_at: now })
      .eq('id', passData.id)

    if (!error) {
      setPassData({ ...passData, scanned_at: now })
      setScanMessage('✓ Acceso registrado exitosamente')
    }
    setLoading(false)
  }

  // PANTALLA 1: Vista bloqueada para invitados o curiosos
  if (!isStaff) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pase de Acceso Oficial</h1>
          <p className="text-sm text-gray-500 mb-8">
            Pase digital verificado. Escaneo exclusivo para el equipo de recepción en puerta.
          </p>

          <div className="border-t border-gray-100 pt-6 text-left">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Acceso Staff / Recepción
            </label>
            <div className="flex gap-2">
              <input 
                type="password"
                maxLength={6}
                placeholder="Ingresar PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-xl text-center tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => validateStaffPin(pinInput)}
                disabled={loading || pinInput.length < 4}
                className="bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Ingresar
              </button>
            </div>
            {pinError && <p className="text-xs text-red-500 mt-2 font-medium">{pinError}</p>}
          </div>
        </div>
      </main>
    )
  }

  // PANTALLA 2: Vista operativa para el Staff logueado
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-gray-200 shadow-xl text-center">
        
        {loading && !passData ? (
          <p className="text-sm text-gray-500 py-10">Consultando pase en la base de datos...</p>
        ) : !passData ? (
          <div className="py-10">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">Pase No Encontrado</h2>
            <p className="text-sm text-gray-500 mt-2">El código QR no corresponde a un registro válido en este evento.</p>
          </div>
        ) : (
          <div>
            {/* Estatus del boleto (Rojo si ya se usó, Verde si es válido) */}
            {passData.scanned_at ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6">
                <span className="text-red-700 font-black text-sm tracking-wider uppercase block mb-1">
                  ⛔ Boleto ya utilizado
                </span>
                <p className="text-xs text-red-600 font-medium">
                  Validado a las: {new Date(passData.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl mb-6">
                <span className="text-emerald-700 font-black text-sm tracking-wider uppercase">
                  ✓ Boleto Válido
                </span>
              </div>
            )}

            <h2 className="text-3xl font-black text-gray-900 mb-1">{passData.guest_name}</h2>
            <p className="text-xs font-mono text-gray-400 mb-6">FOLIO: #{passData.id.split('-')[0].toUpperCase()}</p>
            
            <div className="mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Mesa Asignada:</span>
                <span className="font-bold text-gray-900 text-base">
                  {passData.event_tables?.table_number_or_name || 'Sin asignar'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                <span className="text-gray-500 font-medium">Estado RSVP:</span>
                <span className="capitalize font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs">
                  {passData.rsvp_status}
                </span>
              </div>
            </div>

            {scanMessage && (
              <p className="text-sm font-bold text-emerald-600 mb-4">{scanMessage}</p>
            )}

            {/* Solo permitimos Check-in si el boleto NO ha sido escaneado */}
            {!passData.scanned_at && (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all text-[15px]"
              >
                {loading ? 'Registrando...' : 'Confirmar Ingreso (Check-in)'}
              </button>
            )}
          </div>
        )}

        <button 
          onClick={() => {
            sessionStorage.removeItem('staff_pin')
            setIsStaff(false)
            setPassData(null)
          }}
          className="mt-8 text-xs font-medium text-gray-400 hover:text-gray-600 underline block mx-auto transition-colors"
        >
          Cerrar sesión de Staff
        </button>
      </div>
    </main>
  )
}