export interface CaisseItem {
  id: number
  nom: string
  actif: boolean
  createdAt: string
  updatedAt: string
}

export interface CaissePayload {
  nom: string
  actif: boolean
}
