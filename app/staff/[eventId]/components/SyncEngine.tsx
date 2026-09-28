'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { localDb } from '@/utils/localDb'

export default function SyncEngine({ eventId }: { eventId: string }) {
  const [syncing, setSyncing] = useState(false)
  const supabase = createClient()

  const handleSync = async () => {
    setSyncing(true)
    
    // 1. Subir a Supabase lo que escaneamos offline (Last Write Wins)
    const pendingScans = await localDb.passes.where('sync_pending').equals('true').toArray()
    
    if (pendingScans.length > 0) {
      for (const scan of pendingScans) {
        await supabase
          .from('individual_passes')
          .update({ 
            pass_status: 'used', 
            scanned_at: scan.scanned_at 
          })
          .eq('qr_hash', scan.qr_hash)
          
        // Marcamos como sincronizado localmente
        await localDb.passes.update(scan.id, { sync_pending: false })
      }
    }

    // 2. Descargar la lista actualizada de Supabase a IndexedDB
    const { data, error } = await supabase
      .from('individual_passes')
      .select('id, qr_hash, guest_name, pass_status')
      .eq('event_id', eventId)
      .eq('rsvp_status', 'confirmed') // Solo descargamos los que confirmaron

    if (data) {
      // Limpiamos la base local e insertamos la nueva
      await localDb.passes.clear()
      const localData = data.map(pass => ({
        ...pass,
        sync_pending: false
      }))
      await localDb.passes.bulkAdd(localData)
    }

    setSyncing(false)
    alert('Sincronización completa. Puedes desconectar el internet.')
  }

  return (
    <button 
      onClick={handleSync} 
      disabled={syncing}
      className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md"
    >
      {syncing ? 'Sincronizando...' : 'Sincronizar Dispositivo (Requiere Internet)'}
    </button>
  )
}