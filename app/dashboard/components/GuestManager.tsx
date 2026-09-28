'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

// Tipos de datos para TypeScript
type Pass = { id: string, guest_name: string, rsvp_status: string }
type GuestGroup = { 
  id: string, 
  group_name: string, 
  magic_link_token: string, 
  individual_passes: Pass[] 
}

export default function GuestManager({ eventId, eventSlug }: { eventId: string, eventSlug: string }) {
  const [groups, setGroups] = useState<GuestGroup[]>([])
  const [groupName, setGroupName] = useState('')
  const [guestNames, setGuestNames] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // 1. Cargar los invitados actuales al abrir la página
  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('guest_groups')
      .select(`
        id, group_name, magic_link_token,
        individual_passes ( id, guest_name, rsvp_status )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (data) setGroups(data as GuestGroup[])
  }

  // 2. Lógica para crear un nuevo grupo y sus pases
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // A. Insertar el Grupo (Familia)
    const { data: newGroup, error: groupError } = await supabase
      .from('guest_groups')
      .insert({ event_id: eventId, group_name: groupName })
      .select()
      .single()

    if (newGroup) {
      // B. Separar los nombres por coma y crear el arreglo de pases
      const namesArray = guestNames.split(',').map(n => n.trim()).filter(n => n !== '')
      
      const passesToInsert = namesArray.map(name => ({
        group_id: newGroup.id,
        event_id: eventId,
        guest_name: name
      }))

      // C. Insertar todos los pases de un solo golpe (Bulk Insert)
      if (passesToInsert.length > 0) {
        await supabase.from('individual_passes').insert(passesToInsert)
      }

      // Limpiar formulario y recargar lista
      setGroupName('')
      setGuestNames('')
      fetchGroups()
    }
    setLoading(false)
  }

  // 3. Función para copiar el Magic Link al portapapeles
  const copyMagicLink = (token: string) => {
    // Construimos la URL segura. Ejemplo: tuinvita.online/es/boda-ana/token123
    const link = `${window.location.origin}/es/${eventSlug}/${token}`
    navigator.clipboard.writeText(link)
    alert('¡Enlace copiado! Listo para enviarse por WhatsApp.')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      
      {/* SECCIÓN A: Formulario de Carga Rápida */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Añadir Nueva Invitación</h2>
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo o Familia</label>
            <input 
              required
              type="text" 
              placeholder="Ej. Familia Hernández o Amigos de la Universidad"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres de los invitados (separados por coma)</label>
            <input 
              required
              type="text" 
              placeholder="Ej. Carlos, Ana, Sofía"
              value={guestNames}
              onChange={(e) => setGuestNames(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Generaremos un pase individual para cada nombre escrito.</p>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generando Pases...' : 'Crear Invitación'}
          </button>
        </form>
      </div>

      {/* SECCIÓN B: Lista de Invitaciones y Magic Links */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Invitaciones Generadas</h2>
        
        {groups.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aún no has agregado invitados.</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="border border-gray-100 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                
                {/* Resumen del Grupo */}
                <div className="mb-4 md:mb-0">
                  <h3 className="font-bold text-lg text-gray-800">{group.group_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Pases: {group.individual_passes.map(p => p.guest_name).join(', ')}
                  </p>
                  <div className="flex space-x-2 mt-2">
                    {/* Contadores de estado de RSVP */}
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {group.individual_passes.filter(p => p.rsvp_status === 'confirmed').length} Confirmados
                    </span>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      {group.individual_passes.filter(p => p.rsvp_status === 'pending').length} Pendientes
                    </span>
                  </div>
                </div>

                {/* Botón del Magic Link */}
                <button 
                  onClick={() => copyMagicLink(group.magic_link_token)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  Copiar Enlace WhatsApp
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}