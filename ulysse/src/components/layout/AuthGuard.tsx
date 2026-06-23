import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Role } from '@/lib/constants'
import { ROLE_HOME_ROUTES } from '@/lib/roleRoutes'
import useAuthStore from '@/store/authStore'

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: Role[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME_ROUTES[user.role]} replace />
  }
  return <>{children}</>
}
