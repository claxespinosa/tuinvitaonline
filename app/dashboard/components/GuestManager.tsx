'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Pass {
  id: string
  guest_name: string
  rsvp_status: string
}

interface RsvpModuleProps {
  initialPasses: Pass[]
  primaryColor: string
  contactEmail?: string | null
  organizerPhone?: string | null
  organizerEmail?: string | null
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventId?: string
}

export default function RsvpModule({
  initialPasses,
  primaryColor,
  contactEmail,
  organizerPhone,
  organizerEmail,
  eventTitle,
  eventDate,
  eventLocation,
  eventId
}: RsvpModuleProps) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [groupPasses, setGroupPasses] = useState<Pass[]>(initialPasses)
  const [activeSlide, setActiveSlide] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isProcessingPass, setIsProcessingPass] = useState(false)

  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'sent' | 'hidden'>('idle')

  // --- NUEVO: EFECTO DE MEMORIA ---
  // Verifica si ya se envió el correo en este dispositivo o si ya existe en la base de datos
  useEffect(() => {
    const storageKey = `promo_claimed_${eventId || 'default'}`
    const hasClaimedLocally = localStorage.getItem(storageKey)
    
    if (contactEmail || hasClaimedLocally) {
      setEmailStatus('hidden')
    }
  }, [contactEmail, eventId])

  const hasPhone = Boolean(organizerPhone && organizerPhone.trim().length > 0)
  const hasEmail = Boolean(organizerEmail && organizerEmail.trim().length > 0)
  const hasAnyContact = hasPhone || hasEmail

  const cleanPhone = organizerPhone?.replace(/[^0-9]/g, '') || ''
  const organizerWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hola, necesito solicitar una modificación en la confirmación de mis pases de asistencia.')}`

  const confirmedPasses = groupPasses.filter(p => p.rsvp_status === 'confirmed')
  const hasConfirmedGuests = confirmedPasses.length > 0
  const hasAnsweredAny = groupPasses.some(p => p.rsvp_status !== 'pending')

  const handleUpdateStatus = async (passId: string, newStatus: 'confirmed' | 'declined') => {
    setUpdatingId(passId)

    const updated = groupPasses.map(p => p.id === passId ? { ...p, rsvp_status: newStatus } : p)
    setGroupPasses(updated)
    setActiveSlide(0)

    await supabase
      .from('individual_passes')
      .update({ rsvp_status: newStatus })
      .eq('id', passId)

    setUpdatingId(null)
  }

  // --- ACTUALIZADO: ENVÍO DE CORREO CON MEMORIA PERSISTENTE ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setEmailStatus('loading')
    
    // Aquí conectarás tu Server Action cuando lo tengas listo
    // await sendPassAndCouponEmail(email, eventId, confirmedPasses)
    
    setTimeout(() => {
      setEmailStatus('sent') 
      
      // Guardamos en la memoria local del celular que ya usó la opción
      const storageKey = `promo_claimed_${eventId || 'default'}`
      localStorage.setItem(storageKey, 'true')
      
      // Esperamos 2 segundos y lo ocultamos
      setTimeout(() => {
        setEmailStatus('hidden')
      }, 2000)
    }, 1500)
  }

  // Generador de la imagen completa del Pase Digital
  const createPassCanvas = async (pass: Pass): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas')
    canvas.width = 750
    canvas.height = 1050
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo inicializar canvas')

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = primaryColor || '#4F46E5'
    ctx.fillRect(0, 0, canvas.width, 26)
    ctx.lineWidth = 3
    ctx.strokeStyle = '#E5E7EB'
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 36px serif'
    ctx.fillText(eventTitle, canvas.width / 2, 90)

    ctx.fillStyle = '#059669'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText('PASE DIGITAL DE ACCESO', canvas.width / 2, 130)

    ctx.strokeStyle = '#F3F4F6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(70, 155)
    ctx.lineTo(canvas.width - 70, 155)
    ctx.stroke()

    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 34px sans-serif'
    ctx.fillText(pass.guest_name, canvas.width / 2, 215)

    ctx.fillStyle = '#F9FAFB'
    ctx.fillRect(60, 250, canvas.width - 120, 140)
    ctx.strokeStyle = '#E5E7EB'
    ctx.strokeRect(60, 250, canvas.width - 120, 140)

    ctx.textAlign = 'left'
    ctx.fillStyle = '#374151'
    ctx.font = '20px sans-serif'
    ctx.fillText(`📅  ${eventDate}`, 90, 305)
    ctx.fillText(`📍  ${eventLocation}`, 90, 355)

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${pass.id}`
    const qrImg = new Image()
    qrImg.crossOrigin = 'anonymous'
    qrImg.src = qrUrl

    await new Promise((resolve, reject) => {
      qrImg.onload = resolve
      qrImg.onerror = reject
    })

    const qrSize = 310
    const qrX = (canvas.width - qrSize) / 2
    const qrY = 430

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24)
    ctx.strokeStyle = '#E5E7EB'
    ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24)
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#6B7280'
    ctx.font = 'bold 18px monospace'
    ctx.fillText(`FOLIO: #${pass.id.split('-')[0].toUpperCase()}`, canvas.width / 2, 820)
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '14px sans-serif'
    ctx.fillText('Presenta este pase digital en la recepción del evento', canvas.width / 2, 860)

    return canvas
  }

  const handleDownloadFullPass = async (pass: Pass) => {
    try {
      setIsProcessingPass(true)
      const canvas = await createPassCanvas(pass)
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `pase-${pass.guest_name.toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Error al generar imagen del pase:', err)
    } finally {
      setIsProcessingPass(false)
    }
  }

  const handleShareWhatsApp = async (pass: Pass) => {
    try {
      setIsProcessingPass(true)
      const canvas = await createPassCanvas(pass)
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      if (isMobile && navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
        if (blob) {
          const file = new File([blob], `pase-${pass.guest_name.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Pase de acceso - ${eventTitle}`,
              text: `🎟️ *Pase Digital - ${eventTitle}*\nInvitado: *${pass.guest_name}*\nFolio: *#${pass.id.split('-')[0].toUpperCase()}*`
            })
            return
          }
        }
      }

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `pase-${pass.guest_name.toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()

      const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
      const message = `🎟️ *Mi Pase Digital - ${eventTitle}*\n\nHola ${pass.guest_name}, adjunto tu pase digital de acceso.\n\nFolio: *#${pass.id.split('-')[0].toUpperCase()}*\nVerificación: ${currentUrl}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir pase:', err)
      }
    } finally {
      setIsProcessingPass(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full text-white font-semibold py-4 px-6 rounded-2xl shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: primaryColor }}
      >
        {hasConfirmedGuests ? 'Ver Mis Pases Digitales' : 'Confirmar Asistencia'}
      </button>
    )
  }

  return (
    <div className="w-full bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
      
      {/* 1. SECCIÓN DE CONFIRMACIÓN */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Confirmación de Asistencia</h3>
        <p className="text-xs text-gray-500 mt-1">Indica la asistencia para cada persona de tu invitación:</p>

        <div className="mt-4 space-y-3">
          {groupPasses.map(pass => {
            const isPending = pass.rsvp_status === 'pending'
            const isConfirmed = pass.rsvp_status === 'confirmed'
            const isDeclined = pass.rsvp_status === 'declined'

            return (
              <div key={pass.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="font-medium text-gray-800 text-sm">{pass.guest_name}</span>

                {isPending ? (
                  <div className="flex gap-1.5">
                    <button
                      disabled={updatingId === pass.id}
                      onClick={() => handleUpdateStatus(pass.id, 'confirmed')}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 text-green-700 hover:bg-green-50 text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      ✓ Sí
                    </button>
                    <button
                      disabled={updatingId === pass.id}
                      onClick={() => handleUpdateStatus(pass.id, 'declined')}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      ✕ No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {isConfirmed && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-100 text-green-800 border border-green-200">
                        <span>✓</span> Asistirá
                      </span>
                    )}
                    {isDeclined && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 border border-gray-200">
                        <span>✕</span> Declinado
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* AVISOS DE CAMBIOS / CORREO */}
      {hasAnsweredAny && (
        <div className="mb-6 p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950">
            <span>🔒</span><span>Respuestas registradas</span>
          </div>
          <p className="text-amber-800/90 leading-relaxed">
            Para garantizar la logística del evento, las respuestas no pueden modificarse desde esta página.
            {hasAnyContact && ' Si necesitas realizar un cambio o imprevisto, comunícate con el organizador:'}
          </p>
          {hasAnyContact && (
            <div className="flex flex-wrap items-center gap-2 pt-1 font-medium">
              {hasPhone && (
                <a href={organizerWhatsAppUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-emerald-700 hover:bg-amber-100/50 transition-colors shadow-2xs">
                  💬 WhatsApp ({organizerPhone})
                </a>
              )}
              {hasEmail && (
                <a href={`mailto:${organizerEmail}?subject=Solicitud de cambio en RSVP`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-amber-900 hover:bg-amber-100/50 transition-colors shadow-2xs">
                  ✉️ {organizerEmail}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* AVISO DE CORREO PERMANENTE SI YA REGISTRÓ UNO */}
      {hasConfirmedGuests && emailStatus === 'hidden' && contactEmail && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-blue-800 animate-in fade-in duration-300">
          <span>✉️</span><span>Pases respaldados al correo registrado: {contactEmail}</span>
        </div>
      )}

      {/* 2. SLIDER DE PASES DIGITALES */}
      {hasConfirmedGuests && (
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Pase {activeSlide + 1} de {confirmedPasses.length}
            </span>
            {confirmedPasses.length > 1 && (
              <div className="flex gap-1">
                <button onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))} disabled={activeSlide === 0} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">←</button>
                <button onClick={() => setActiveSlide(prev => Math.min(confirmedPasses.length - 1, prev + 1))} disabled={activeSlide === confirmedPasses.length - 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">→</button>
              </div>
            )}
          </div>

          {confirmedPasses[activeSlide] && (() => {
            const currentPass = confirmedPasses[activeSlide]
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${currentPass.id}`

            return (
              <div className="p-6 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-200 shadow-sm text-center animate-in fade-in duration-200">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                  Acceso Válido
                </span>
                <h4 className="text-xl font-bold text-gray-900 mt-3">{currentPass.guest_name}</h4>
                <div className="my-3 inline-block p-3 bg-white rounded-2xl border border-gray-100 shadow-xs">
                  <img src={qrUrl} alt={`QR de ${currentPass.guest_name}`} className="w-36 h-36 mx-auto object-contain" />
                </div>
                <p className="text-[11px] font-mono tracking-widest text-gray-400">
                  FOLIO: #{currentPass.id.split('-')[0].toUpperCase()}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-5">
                  <button disabled={isProcessingPass} onClick={() => handleShareWhatsApp(currentPass)} className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs">
                    <span>💬</span> {isProcessingPass ? 'Generando...' : 'WhatsApp'}
                  </button>
                  <button disabled={isProcessingPass} onClick={() => handleDownloadFullPass(currentPass)} className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-xs">
                    <span>📥</span> {isProcessingPass ? 'Generando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )
          })()}

          {confirmedPasses.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {confirmedPasses.map((_, index) => (
                <button key={index} onClick={() => setActiveSlide(index)} className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-6 bg-gray-900' : 'w-2 bg-gray-300'}`} />
              ))}
            </div>
          )}

          {/* 3. MÓDULO SECUNDARIO: CAPTURA DE CORREO - Renderizado Condicional */}
          {emailStatus !== 'hidden' && (
            <div className="mt-8 bg-blue-50/60 p-5 rounded-2xl border border-blue-100 text-left animate-in fade-in duration-300 transition-all">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">¿Deseas un respaldo en tu correo?</h3>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Recibe tus pases y obtén un <strong>cupón del 10% de cortesía</strong> para crear tu próxima invitación digital.
              </p>
              
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailStatus !== 'idle'}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 text-sm"
                />
                <button 
                  type="submit" 
                  disabled={emailStatus !== 'idle'}
                  style={{ backgroundColor: emailStatus === 'sent' ? '#10B981' : (primaryColor || '#2563EB') }}
                  className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-70 shadow-sm"
                >
                  {emailStatus === 'idle' && 'Enviarme mis pases'}
                  {emailStatus === 'loading' && 'Enviando...'}
                  {emailStatus === 'sent' && '✓ Pases enviados'}
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      <button 
        onClick={() => setIsOpen(false)}
        className="w-full mt-6 text-gray-400 font-medium py-2 hover:text-gray-600 text-xs text-center transition-colors block"
      >
        Cerrar ventana
      </button>
    </div>
  )
}