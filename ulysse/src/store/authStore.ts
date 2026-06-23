import { create } from 'zustand'
import type { Role } from '@/lib/constants'

interface AuthUser {
  id: number
  nom: string
  identifiant: string
  initiales: string
  role: Role
  caisseId: number | null
  caisse: string | null
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

export default useAuthStore
