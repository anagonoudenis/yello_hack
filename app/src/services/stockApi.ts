import api from '@/services/api'
import type {
  StockMovementCreatePayload,
  StockMovementListParams,
  StockMovementListResponse,
  StockMovementRecord,
} from '@/types/stock'


interface ApiStockMovement {
  id: number
  catalogue_item_id: number
  catalogue_item_nom: string
  code_element: string
  movement_type: StockMovementRecord['movementType']
  quantity: number
  quantity_before: number
  quantity_after: number
  motif: string
  source_type: StockMovementRecord['sourceType']
  source_id: string
  auteur_id: number | null
  auteur_nom: string | null
  created_at: string
}

interface ApiStockMovementListResponse {
  items: ApiStockMovement[]
  total: number
  page: number
  page_size: number
}

const toMovement = (item: ApiStockMovement): StockMovementRecord => ({
  id: item.id,
  catalogueItemId: item.catalogue_item_id,
  catalogueItemNom: item.catalogue_item_nom,
  codeElement: item.code_element,
  movementType: item.movement_type,
  quantity: item.quantity,
  quantityBefore: item.quantity_before,
  quantityAfter: item.quantity_after,
  motif: item.motif,
  sourceType: item.source_type,
  sourceId: item.source_id,
  auteurId: item.auteur_id,
  auteurNom: item.auteur_nom,
  createdAt: item.created_at,
})

export async function listStockMovements(params: StockMovementListParams = {}): Promise<StockMovementListResponse> {
  const res = await api.get<ApiStockMovementListResponse>('/stock/movements', {
    params: {
      catalogue_item_id: params.catalogueItemId,
      movement_type: params.movementType,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 100,
    },
  })
  return {
    items: res.data.items.map(toMovement),
    total: res.data.total,
    page: res.data.page,
    pageSize: res.data.page_size,
  }
}

export async function createStockMovement(payload: StockMovementCreatePayload) {
  const res = await api.post<ApiStockMovement>('/stock/movements', {
    catalogue_item_id: payload.catalogueItemId,
    movement_type: payload.movementType,
    quantity: payload.quantity,
    motif: payload.motif,
  })
  return toMovement(res.data)
}
