import api from '@/services/api'
import type { CaisseItem, CaissePayload } from '@/types/caisse'


interface ApiCaisseItem {
  id: number
  nom: string
  actif: boolean
  created_at: string
  updated_at: string
}

interface ApiCaisseList {
  items: ApiCaisseItem[]
  total: number
}

const toCaisse = (item: ApiCaisseItem): CaisseItem => ({
  id: item.id,
  nom: item.nom,
  actif: item.actif,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

export async function listCaisses() {
  const res = await api.get<ApiCaisseList>('/caisses')
  return {
    items: res.data.items.map(toCaisse),
    total: res.data.total,
  }
}

export async function createCaisse(payload: CaissePayload) {
  const res = await api.post<ApiCaisseItem>('/caisses', {
    nom: payload.nom,
    actif: payload.actif,
  })
  return toCaisse(res.data)
}

export async function updateCaisse(id: number, payload: Partial<CaissePayload>) {
  const body: Record<string, unknown> = {}
  if ('nom' in payload) body.nom = payload.nom
  if ('actif' in payload) body.actif = payload.actif
  const res = await api.patch<ApiCaisseItem>(`/caisses/${id}`, body)
  return toCaisse(res.data)
}

export async function deactivateCaisse(id: number) {
  const res = await api.patch<ApiCaisseItem>(`/caisses/${id}/deactivate`)
  return toCaisse(res.data)
}
