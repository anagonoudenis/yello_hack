export type StockMovementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT'
export type StockMovementSourceType = 'MANUAL' | 'TRANSACTION_PAYMENT_FINALIZATION' | 'PRODUCT_CREATION' | 'BENIN_SEED'

export interface StockMovementRecord {
  id: number
  catalogueItemId: number
  catalogueItemNom: string
  codeElement: string
  movementType: StockMovementType
  quantity: number
  quantityBefore: number
  quantityAfter: number
  motif: string
  sourceType: StockMovementSourceType
  sourceId: string
  auteurId: number | null
  auteurNom: string | null
  createdAt: string
}

export interface StockMovementListParams {
  catalogueItemId?: number
  movementType?: StockMovementType
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface StockMovementCreatePayload {
  catalogueItemId: number
  movementType: StockMovementType
  quantity: number
  motif: string
}

export interface StockMovementListResponse {
  items: StockMovementRecord[]
  total: number
  page: number
  pageSize: number
}
