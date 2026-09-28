import Dexie, { Table } from 'dexie'

// Definimos lo que se guardará en el teléfono
export interface LocalPass {
  id: string
  qr_hash: string
  guest_name: string
  pass_status: 'valid' | 'used' | 'revoked'
  scanned_at?: string
  sync_pending: boolean // Bandera crítica: true si no se ha subido a Supabase
}

class StaffDatabase extends Dexie {
  passes!: Table<LocalPass, string>

  constructor() {
    super('TuInvitaStaffDB')
    // Definimos los índices de búsqueda rápida. El qr_hash debe ser indexado.
    this.version(1).stores({
      passes: 'id, qr_hash, sync_pending' 
    })
  }
}

export const localDb = new StaffDatabase()