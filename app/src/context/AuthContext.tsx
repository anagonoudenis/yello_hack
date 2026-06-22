import { createContext, useContext, type ReactNode } from 'react'
import useAuthStore from '@/store/authStore'
import type { Role } from '@/lib/constants'

interface AuthContextValue {
  isAuthenticated: boolean
  role: Role | null
  nom: string | null
  initiales: string | null
  caisse: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      role: user?.role ?? null,
      nom: user?.nom ?? null,
      initiales: user?.initiales ?? null,
      caisse: user?.caisse ?? null,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
