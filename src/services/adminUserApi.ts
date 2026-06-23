import api from '@/services/api'
import type { AdminUser, AdminUserCreatePayload, AdminUserListParams, AdminUserUpdatePayload } from '@/types/adminUser'


interface ApiAdminUser {
  id: number
  nom: string
  identifiant: string
  role: AdminUser['role']
  actif: boolean
  caisse_id: number | null
  caisse_nom: string | null
  created_at: string
}

interface ApiAdminUserList {
  items: ApiAdminUser[]
  total: number
}

const getInitiales = (nom: string) =>
  nom
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

const toAdminUser = (item: ApiAdminUser): AdminUser => ({
  id: item.id,
  nom: item.nom,
  identifiant: item.identifiant,
  role: item.role,
  actif: item.actif,
  caisseId: item.caisse_id,
  caisseNom: item.caisse_nom,
  createdAt: item.created_at,
  initiales: getInitiales(item.nom),
})

export async function listAdminUsers(params: AdminUserListParams = {}) {
  const res = await api.get<ApiAdminUserList>('/users', {
    params: {
      search: params.search || undefined,
      role: params.role || undefined,
      actif: params.actif,
      caisse_id: params.caisseId,
    },
  })
  return {
    items: res.data.items.map(toAdminUser),
    total: res.data.total,
  }
}

export async function createAdminUser(payload: AdminUserCreatePayload) {
  const res = await api.post<ApiAdminUser>('/users', {
    nom: payload.nom,
    identifiant: payload.identifiant,
    mot_de_passe: payload.motDePasse,
    role: payload.role,
    caisse_id: payload.caisseId,
    actif: payload.actif,
  })
  return toAdminUser(res.data)
}

export async function updateAdminUser(id: number, payload: AdminUserUpdatePayload) {
  const body: Record<string, unknown> = {}
  if ('nom' in payload) body.nom = payload.nom
  if ('identifiant' in payload) body.identifiant = payload.identifiant
  if ('role' in payload) body.role = payload.role
  if ('caisseId' in payload) body.caisse_id = payload.caisseId
  if ('actif' in payload) body.actif = payload.actif
  const res = await api.patch<ApiAdminUser>(`/users/${id}`, body)
  return toAdminUser(res.data)
}

export async function deactivateAdminUser(id: number) {
  const res = await api.patch<ApiAdminUser>(`/users/${id}/deactivate`)
  return toAdminUser(res.data)
}
