'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function GuestManager() {
  const supabase = createClient()
  const router = useRouter()
  
  const [eventId, setEventId] = useState<string | null>(null)
  const [eventSlug, setEventSlug] = useState<string | null>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para formularios
  const [newGroupName, setNewGroupName] = useState('')
  const [newIndividualName, setNewIndividualName] = useState('')
  const [newGuestName, setNewGuestName] = useState('')
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchEventAndGuests()
  }, [])

  const fetchEventAndGuests = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    // 1. Obtener el evento y su slug para generar los enlaces
    const { data: eventData } = await supabase
      .from('events')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single()

    if (eventData) {
      setEventId(eventData.id)
      setEventSlug(eventData.slug)
      
      // 2. Obtener invitados
      const { data: groupsData } = await supabase
        .from('guest_groups')
        .select(`*, individual_passes (*)`)
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false })
        
      if (groupsData) setGroups(groupsData)
    }
    setLoading(false)
  }

  // Crear un Grupo Familiar
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim() || !eventId) return

    const { data, error } = await supabase
      .from('guest_groups')
      .insert({ event_id: eventId, group_name: newGroupName })
      .select()
      .single()

    if (!error && data) {
      setGroups([{ ...data, individual_passes: [] }, ...groups])
      setNewGroupName('')
    }
  }

  // Crear un Invitado Individual (Crea grupo y pase en un solo paso)
  const handleCreateIndividual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIndividualName.trim() || !eventId) return

    // 1. Creamos el contenedor (grupo de 1)
    const { data: groupData, error: groupError } = await supabase
      .from('guest_groups')
      .insert({ event_id: eventId, group_name: newIndividualName })
      .select()
      .single()

    if (!groupError && groupData) {
      // 2. Le asignamos inmediatamente su pase
      const { data: passData } = await supabase
        .from('individual_passes')
        .insert({
          event_id: eventId,
          group_id: groupData.id,
          guest_name: newIndividualName,
          rsvp_status: 'pending'
        })
        .select()
        .single()

      if (passData) {
        setGroups([{ ...groupData, individual_passes: [passData] }, ...groups])
        setNewIndividualName('')
      }
    }
  }

  // Añadir un pase a un grupo existente
  const handleAddPass = async (groupId: string) => {
    if (!newGuestName.trim() || !eventId) return

    const { data, error } = await supabase
      .from('individual_passes')
      .insert({
        event_id: eventId,
        group_id: groupId,
        guest_name: newGuestName,
        rsvp_status: 'pending'
      })
      .select()
      .single()

    if (!error && data) {
      setGroups(groups.map(g => g.id === groupId ? { ...g, individual_passes: [...g.individual_passes, data] } : g))
      setNewGuestName('')
      setActiveGroupId(null)
    }
  }

  // Función para copiar el enlace al portapapeles
  const handleCopyLink = (groupId: string) => {
    const url = `${window.location.origin}/invitacion/${eventSlug}/${groupId}`
    navigator.clipboard.writeText(url)
    setCopiedId(groupId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando invitados...</div>

  return (
    <div className="h-[calc(100vh-4rem)] md:h-full bg-gray-50 overflow-y-auto p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lista de Invitados</h1>
          <p className="text-gray-500 mt-2">Gestiona tus invitados y obtén sus enlaces personalizados.</p>
        </header>

        {/* Paneles de Creación */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Formulario Individual */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Añadir Invitado Individual</h2>
            <form onSubmit={handleCreateIndividual} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Ej. Carlos Slim"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newIndividualName}
                onChange={(e) => setNewIndividualName(e.target.value)}
              />
              <button 
                type="submit" disabled={!newIndividualName.trim()}
                className="py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Añadir Invitado
              </button>
            </form>
          </div>

          {/* Formulario Grupo */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Añadir Familia / Grupo</h2>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Ej. Familia Pérez"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button 
                type="submit" disabled={!newGroupName.trim()}
                className="py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Crear Grupo
              </button>
            </form>
          </div>
        </div>

        {/* Listado */}
        <div className="space-y-6">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              Aún no has agregado a ningún invitado.
            </div>
          ) : (
            groups.map((group) => {
              const isIndividual = group.individual_passes.length === 1 && group.individual_passes[0].guest_name === group.group_name;
              
              return (
                <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Cabecera del Grupo/Invitado */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {group.group_name} {isIndividual ? '(Individual)' : ''}
                      </h3>
                      {!isIndividual && (
                        <span className="text-xs font-medium text-gray-500">{group.individual_passes.length} Pases asignados</span>
                      )}
                    </div>
                    
                    {/* BOTÓN COPIAR ENLACE */}
                    <button
                      onClick={() => handleCopyLink(group.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
                        copiedId === group.id 
                          ? 'bg-green-50 border-green-200 text-green-700' 
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {copiedId === group.id ? '✓ Enlace Copiado' : '🔗 Copiar Enlace'}
                    </button>
                  </div>

                  {/* Lista de Pases */}
                  <ul className="divide-y divide-gray-100">
                    {group.individual_passes.map((pass: any) => (
                      <li key={pass.id} className="px-6 py-4 flex justify-between items-center">
                        <p className="font-medium text-gray-900">{pass.guest_name}</p>
                        <div>
                          {pass.rsvp_status === 'pending' && <span className="text-yellow-600 text-sm font-medium bg-yellow-50 px-3 py-1 rounded-full">Pendiente</span>}
                          {pass.rsvp_status === 'confirmed' && <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">Confirmado</span>}
                          {pass.rsvp_status === 'declined' && <span className="text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">Declinado</span>}
                        </div>
                      </li>
                    ))}

                    {/* Opción de agregar más pases (solo visible para grupos, no para individuales puros) */}
                    {!isIndividual && (
                      <li className="px-6 py-3 bg-gray-50/50">
                        {activeGroupId === group.id ? (
                          <div className="flex gap-3">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Nombre del invitado..."
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                              value={newGuestName}
                              onChange={(e) => setNewGuestName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddPass(group.id)}
                            />
                            <button onClick={() => handleAddPass(group.id)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Guardar</button>
                            <button onClick={() => setActiveGroupId(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setActiveGroupId(group.id); setNewGuestName(''); }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            + Agregar persona a este grupo
                          </button>
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}