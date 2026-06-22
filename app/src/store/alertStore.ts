import { create } from 'zustand'
import type { Alerte } from '@/lib/constants'
import { MOCK_ALERTES } from '@/lib/constants'

interface AlertState {
  alertes: Alerte[]
  addAlerte: (alerte: Alerte) => void
  removeAlerte: (code: string) => void
  hasCritique: boolean
}

const useAlertStore = create<AlertState>((set, get) => ({
  alertes: MOCK_ALERTES,
  hasCritique: MOCK_ALERTES.some((a) => a.gravite === 'critique'),
  addAlerte: (alerte) => {
    const alertes = [alerte, ...get().alertes]
    set({ alertes, hasCritique: alertes.some((a) => a.gravite === 'critique') })
  },
  removeAlerte: (code) => {
    const alertes = get().alertes.filter((a) => a.code !== code)
    set({ alertes, hasCritique: alertes.some((a) => a.gravite === 'critique') })
  },
}))

export default useAlertStore
