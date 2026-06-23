export interface CatalogueItem {
  id: number
  codeElement: string
  codeLabo: string | null
  type: string
  nom: string
  service: string
  montantFcfa: number
  hopitalId: string
  actif: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CatalogueListParams {
  search?: string
  type?: string
  service?: string
  actif?: boolean
  page?: number
  pageSize?: number
}

export interface CataloguePayload {
  codeElement: string
  codeLabo?: string | null
  type: string
  nom: string
  service: string
  montantFcfa: number
  hopitalId: string
  actif: boolean
  metadata?: Record<string, unknown>
}

export interface CatalogueTariffHistory {
  id: number
  catalogueItemId: number
  ancienMontantFcfa: number
  nouveauMontantFcfa: number
  auteurId: number | null
  auteurNom: string | null
  createdAt: string
}
