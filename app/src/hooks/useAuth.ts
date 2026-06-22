import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { MOCK_USERS } from '@/lib/constants'

const ROLE_ROUTES: Record<string, string> = {
  caissier:    '/caissier/encaissement',
  superviseur: '/superviseur/dashboard',
  accueil:     '/accueil/enregistrement',
  admin:       '/admin/catalogue',
  auditeur:    '/auditeur/releve',
}

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore()
  const navigate = useNavigate()

  const signIn = (identifiant: string, motDePasse: string): boolean => {
    const found = MOCK_USERS.find(
      (u) => u.identifiant === identifiant && u.motDePasse === motDePasse
    )
    if (!found) return false
    login({ id: found.id, nom: found.nom, initiales: found.initiales, role: found.role, caisse: found.caisse })
    navigate(ROLE_ROUTES[found.role] ?? '/')
    return true
  }

  const signOut = () => {
    logout()
    navigate('/login')
  }

  return { user, isAuthenticated, signIn, signOut }
}
