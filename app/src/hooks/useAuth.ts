import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import api from '@/services/api'
import { ROLE_HOME_ROUTES } from '@/lib/roleRoutes'
import type { Role } from '@/lib/constants'

interface SignInResult {
  ok: boolean
  error?: string
}

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore()
  const navigate = useNavigate()

  const signIn = async (identifiant: string, motDePasse: string): Promise<SignInResult> => {
    try {
      const res = await api.post('/auth/login', {
        identifiant,
        mot_de_passe: motDePasse,
      })
      const { access_token, user: apiUser } = res.data as {
        access_token: string
        user: {
          id: number
          nom: string
          identifiant: string
          role: Role
          caisse_id: number | null
          caisse_nom: string | null
        }
      }

      localStorage.setItem('access_token', access_token)
      const initiales = apiUser.nom
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

      login({
        id: apiUser.id,
        nom: apiUser.nom,
        identifiant: apiUser.identifiant,
        initiales,
        role: apiUser.role,
        caisseId: apiUser.caisse_id,
        caisse: apiUser.caisse_nom,
      })
      navigate(ROLE_HOME_ROUTES[apiUser.role] ?? '/login')
      return { ok: true }
    } catch (error) {
      localStorage.removeItem('access_token')
      logout()

      // Messages d'erreur précis selon le contexte
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const detail = error.response?.data?.detail
        if (status === 401 || status === 403) {
          return { ok: false, error: 'Identifiant ou mot de passe incorrect.' }
        }
        if (status === 422) {
          return { ok: false, error: 'Données de connexion invalides. Vérifiez les champs.' }
        }
        if (status && status >= 500) {
          return { ok: false, error: 'Erreur serveur. Réessayez dans quelques instants.' }
        }
        if (!error.response) {
          return { ok: false, error: 'Impossible de joindre le serveur. Vérifiez votre connexion.' }
        }
        if (typeof detail === 'string' && detail.trim()) {
          return { ok: false, error: detail }
        }
      }

      return { ok: false, error: 'Une erreur inattendue est survenue. Réessayez.' }
    }
  }

  const signOut = () => {
    void api.post('/auth/logout').catch(() => undefined)
    localStorage.removeItem('access_token')
    logout()
    navigate('/login')
  }

  return { user, isAuthenticated, signIn, signOut }
}
