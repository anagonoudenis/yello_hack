import type { Role } from '@/lib/constants'


export interface AdminUser {
  id: number
  nom: string
  identifiant: string
  role: Role
  actif: boolean
  caisseId: number | null
  caisseNom: string | null
  createdAt: string
  initiales: string
}

export interface AdminUserListParams {
  search?: string
  role?: Role
  actif?: boolean
  caisseId?: number
}

export interface AdminUserCreatePayload {
  nom: string
  identifiant: string
  motDePasse: string
  role: Role
  caisseId: number | null
  actif: boolean
}

export interface AdminUserUpdatePayload {
  nom?: string
  identifiant?: string
  role?: Role
  caisseId?: number | null
  actif?: boolean
}
