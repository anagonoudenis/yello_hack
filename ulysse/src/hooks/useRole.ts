import useAuthStore from '@/store/authStore'
import type { Role } from '@/lib/constants'

export function useRole() {
  const user = useAuthStore((s) => s.user)

  const can = (roles: Role[]): boolean =>
    user !== null && roles.includes(user.role)

  return { role: user?.role ?? null, can }
}
