import { create } from 'zustand'
import type { Dossier } from '@/lib/constants'
import { MOCK_DOSSIERS } from '@/lib/constants'

interface VisitState {
  dossiers: Dossier[]
  dossierActif: Dossier | null
  setDossierActif: (dossier: Dossier | null) => void
  addDossier: (dossier: Dossier) => void
  updateStatut: (id: string, statut: Dossier['statut']) => void
}

const useVisitStore = create<VisitState>((set, get) => ({
  dossiers: MOCK_DOSSIERS,
  dossierActif: null,
  setDossierActif: (dossier) => set({ dossierActif: dossier }),
  addDossier: (dossier) => set({ dossiers: [dossier, ...get().dossiers] }),
  updateStatut: (id, statut) =>
    set({ dossiers: get().dossiers.map((d) => d.id === id ? { ...d, statut } : d) }),
}))

export default useVisitStore
