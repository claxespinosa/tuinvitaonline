'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Pass = { id: string, guest_name: string, rsvp_status: string }
type GuestGroup = { 
  id: string, 
  group_name: string, 
  individual_passes: Pass[] 
}

export default function GuestManager() {
  const supabase = createClient()
  const router = useRouter()
  
  const [eventId, setEventId] = useState<string | null>(null)
  const [eventSlug, setEventSlug] = useState<string | null>(null)
  const [groups, setGroups] = useState<GuestGroup[]>([])
  const [loading, setLoading] = useState(true)
  
  const [newGroupName, setNewGroupName] = useState('')
  const [newIndividualName, setNewIndividualName] = useState('')
  const [newGuestName, setNewGuestName] = useState('')
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchEventAndGuests()
  }, [])

  const fetchEventAndGuests = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: eventData } = await supabase
      .from('events')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single()

    if (eventData) {
      setEventId(eventData.id)
      setEventSlug(eventData.slug)
      
      const { data: groupsData } = await supabase
        .from('guest_groups')
        .select(`*, individual_passes (*)`)
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false })
        
      if (groupsData) setGroups(groupsData as GuestGroup[])
    }
    setLoading(false)
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim() || !eventId) return

    const { data } = await supabase
      .from('guest_groups')
      .insert({ event_id: eventId, group_name: newGroupName })
      .select().single()

    if (data) {
      setGroups([{ ...data, individual_passes: [] }, ...groups])
      setNewGroupName('')
    }
  }

  const handleCreateIndividual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIndividualName.trim() || !eventId) return

    const { data: groupData } = await supabase
      .from('guest_groups')
      .insert({ event_id: eventId, group_name: newIndividualName })
      .select().single()

    if (groupData) {
      const { data: passData } = await supabase
        .from('individual_passes')
        .insert({
          event_id: eventId,
          group_id: groupData.id,
          guest_name: newIndividualName,
          rsvp_status: 'pending'
        })
        .select().single()

      if (passData) {
        setGroups([{ ...groupData, individual_passes: [passData] }, ...groups])
        setNewIndividualName('')
      }
    }
  }

  const handleAddPass = async (groupId: string) => {
    if (!newGuestName.trim() || !eventId) return

    const { data } = await supabase
      .from('individual_passes')
      .insert({ event_id: eventId, group_id: groupId, guest_name: newGuestName, rsvp_status: 'pending' })
      .select().single()

    if (data) {
      setGroups(groups.map(g => g.id === groupId ? { ...g, individual_passes: [...g.individual_passes, data] } : g))
      setNewGuestName('')
      setActiveGroupId(null)
    }
  }

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a "${name}" y todos sus pases?`)) return
    await supabase.from('guest_groups').delete().eq('id', groupId)
    setGroups(groups.filter(g => g.id !== groupId))
  }

  const handleDeletePass = async (passId: string, passName: string, groupId: string) => {
    if (!window.confirm(`¿Eliminar el pase de "${passName}"?`)) return
    await supabase.from('individual_passes').delete().eq('id', passId)
    setGroups(groups.map(g => g.id === groupId ? { ...g, individual_passes: g.individual_passes.filter(p => p.id !== passId) } : g))
  }

  const handleCopyLink = (groupId: string) => {
    const url = `${window.location.origin}/invitacion/${eventSlug}/${groupId}`
    navigator.clipboard.writeText(url)
    setCopiedId(groupId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const shareWhatsApp = (groupId: string, groupName: string) => {
    const url = `${window.location.origin}/invitacion/${eventSlug}/${groupId}`
    const cleanName = groupName.replace(' (Individual)', '')
    const message = `¡Hola ${cleanName}! Queremos que nos acompañen en este día tan especial. Aquí pueden ver todos los detalles del evento y descargar sus pases digitales: ${url}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank')
  }

  const stats = useMemo(() => {
    const allPasses = groups.flatMap(g => g.individual_passes)
    return {
      total: allPasses.length,
      confirmed: allPasses.filter(p => p.rsvp_status === 'confirmed').length,
      pending: allPasses.filter(p => p.rsvp_status === 'pending').length,
      declined: allPasses.filter(p => p.rsvp_status === 'declined').length
    }
  }, [groups])

  const filteredGroups = groups.filter(g => 
    g.group_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.individual_passes.some(p => p.guest_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return <div className="p-8 text-gray-500 text-center mt-20">Cargando invitados...</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lista de Invitados</h1>
        <p className="text-gray-600 mb-6">Gestiona tus invitados y obtén sus enlaces personalizados.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Boletos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm text-center">
            <p className="text-sm text-green-600 font-medium mb-1">Confirmados</p>
            <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm text-center">
            <p className="text-sm text-yellow-600 font-medium mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm text-center">
            <p className="text-sm text-red-600 font-medium mb-1">Declinados</p>
            <p className="text-2xl font-bold text-red-700">{stats.declined}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Añadir Invitado Individual</h3>
          <form onSubmit={handleCreateIndividual} className="space-y-4">
            <input type="text" placeholder="Ej. Carlos Slim" value={newIndividualName} onChange={(e) => setNewIndividualName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="submit" disabled={!newIndividualName.trim()} className="w-full bg-gray-500 text-white py-2.5 rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50">Añadir Invitado</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Añadir Familia / Grupo</h3>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <input type="text" placeholder="Ej. Familia Pérez" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="submit" disabled={!newGroupName.trim()} className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">Crear Grupo</button>
          </form>
        </div>
      </div>

      <input type="text" placeholder="Buscar invitado o familia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />

      <div className="space-y-6">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">No se encontraron invitados.</div>
        ) : (
          filteredGroups.map((group) => {
            const isIndividual = group.individual_passes.length === 1 && group.individual_passes[0].guest_name === group.group_name;
            return (
              <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group/header">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-800">{group.group_name} {isIndividual ? '(Individual)' : ''}</h3>
                      <button onClick={() => handleDeleteGroup(group.id, group.group_name)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/header:opacity-100 transition-opacity" title="Eliminar Grupo">✕</button>
                    </div>
                    {!isIndividual && <span className="text-xs font-medium text-gray-500">{group.individual_passes.length} Pases asignados</span>}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleCopyLink(group.id)} className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center">
                      <span className="mr-2">🔗</span> {copiedId === group.id ? '¡Copiado!' : 'Copiar'}
                    </button>
                    <button onClick={() => shareWhatsApp(group.id, group.group_name)} className="flex-1 md:flex-none px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#1ebd5a] flex items-center justify-center">
                      WhatsApp
                    </button>
                  </div>
                </div>

                <ul className="divide-y divide-gray-100">
                  {group.individual_passes.map((pass) => (
                    <li key={pass.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 group/pass">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{pass.guest_name}</p>
                        <button onClick={() => handleDeletePass(pass.id, pass.guest_name, group.id)} className="text-red-300 hover:text-red-600 text-xs opacity-0 group-hover/pass:opacity-100 transition-opacity">✕</button>
                      </div>
                      <div>
                        {pass.rsvp_status === 'pending' && <span className="text-yellow-600 text-sm font-medium bg-yellow-50 px-3 py-1 rounded-full">Pendiente</span>}
                        {pass.rsvp_status === 'confirmed' && <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">Confirmado</span>}
                        {pass.rsvp_status === 'declined' && <span className="text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">Declinado</span>}
                      </div>
                    </li>
                  ))}

                  {!isIndividual && (
                    <li className="px-6 py-3 bg-gray-50/50">
                      {activeGroupId === group.id ? (
                        <div className="flex gap-3">
                          <input autoFocus type="text" placeholder="Nombre del invitado..." className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm outline-none" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPass(group.id)} />
                          <button onClick={() => handleAddPass(group.id)} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700">Guardar</button>
                          <button onClick={() => setActiveGroupId(null)} className="text-sm text-gray-500 hover:text-gray-700 px-2">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => { setActiveGroupId(group.id); setNewGuestName(''); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
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
  )
}