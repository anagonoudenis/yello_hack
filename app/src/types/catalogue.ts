export type ProductCategory = 'CONSOMMABLE_MEDICAL' | 'DISPOSITIF_MEDICAL' | 'MEDICAMENT'

export interface CatalogueItem {
  id: number
  codeElement: string
  codeLabo: string | null
  type: string
  nom: string
  service: string
  montantFcfa: number
  hopitalId: string
  specialites: string | null
  formeGalenique: string | null
  classePharmacologique: string | null
  categorieProduit: ProductCategory | null
  dateExpiration: string | null
  quantiteStock: number
  stockManaged: boolean
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
  categorieProduit?: ProductCategory
  stockManaged?: boolean
  expired?: boolean
  outOfStock?: boolean
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
  specialites?: string | null
  formeGalenique?: string | null
  classePharmacologique?: string | null
  categorieProduit?: ProductCategory | null
  dateExpiration?: string | null
  quantiteStock?: number
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
