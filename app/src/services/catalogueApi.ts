import api from '@/services/api'
import type {
  CatalogueItem,
  CatalogueListParams,
  CataloguePayload,
  CatalogueTariffHistory,
} from '@/types/catalogue'

interface ApiCatalogueItem {
  id: number
  code_element: string
  code_labo: string | null
  type: string
  nom: string
  service: string
  montant_fcfa: number
  hopital_id: string
  specialites: string | null
  forme_galenique: string | null
  classe_pharmacologique: string | null
  categorie_produit: string | null
  date_expiration: string | null
  quantite_stock: number
  actif: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface ApiCatalogueList {
  items: ApiCatalogueItem[]
  total: number
  page: number
  page_size: number
}

interface ApiTariffHistory {
  id: number
  catalogue_item_id: number
  ancien_montant_fcfa: number
  nouveau_montant_fcfa: number
  auteur_id: number | null
  auteur_nom: string | null
  created_at: string
}

const toItem = (item: ApiCatalogueItem): CatalogueItem => ({
  id: item.id,
  codeElement: item.code_element,
  codeLabo: item.code_labo,
  type: item.type,
  nom: item.nom,
  service: item.service,
  montantFcfa: item.montant_fcfa,
  hopitalId: item.hopital_id,
  specialites: item.specialites,
  formeGalenique: item.forme_galenique,
  classePharmacologique: item.classe_pharmacologique,
  categorieProduit: item.categorie_produit as CatalogueItem['categorieProduit'],
  dateExpiration: item.date_expiration,
  quantiteStock: item.quantite_stock,
  stockManaged: Boolean(item.categorie_produit),
  actif: item.actif,
  metadata: item.metadata,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const toApiPayload = (payload: CataloguePayload) => ({
  code_element: payload.codeElement,
  code_labo: payload.codeLabo || null,
  type: payload.type,
  nom: payload.nom,
  service: payload.service,
  montant_fcfa: payload.montantFcfa,
  hopital_id: payload.hopitalId,
  specialites: payload.specialites || null,
  forme_galenique: payload.formeGalenique || null,
  classe_pharmacologique: payload.classePharmacologique || null,
  categorie_produit: payload.categorieProduit || null,
  date_expiration: payload.dateExpiration || null,
  quantite_stock: payload.quantiteStock ?? 0,
  actif: payload.actif,
  metadata: payload.metadata ?? {},
})

const toHistory = (history: ApiTariffHistory): CatalogueTariffHistory => ({
  id: history.id,
  catalogueItemId: history.catalogue_item_id,
  ancienMontantFcfa: history.ancien_montant_fcfa,
  nouveauMontantFcfa: history.nouveau_montant_fcfa,
  auteurId: history.auteur_id,
  auteurNom: history.auteur_nom,
  createdAt: history.created_at,
})

export async function listCatalogue(params: CatalogueListParams = {}) {
  const res = await api.get<ApiCatalogueList>('/catalogue', {
    params: {
      search: params.search || undefined,
      type: params.type || undefined,
      service: params.service || undefined,
      actif: params.actif,
      categorie_produit: params.categorieProduit || undefined,
      stock_managed: params.stockManaged,
      expired: params.expired,
      out_of_stock: params.outOfStock,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 100,
    },
  })
  return {
    items: res.data.items.map(toItem),
    total: res.data.total,
    page: res.data.page,
    pageSize: res.data.page_size,
  }
}

export async function createCatalogueItem(payload: CataloguePayload) {
  const res = await api.post<ApiCatalogueItem>('/catalogue', toApiPayload(payload))
  return toItem(res.data)
}

export async function updateCatalogueItem(id: number, payload: Partial<CataloguePayload>) {
  const body: Record<string, unknown> = {}
  if ('codeLabo' in payload) body.code_labo = payload.codeLabo || null
  if ('type' in payload) body.type = payload.type
  if ('nom' in payload) body.nom = payload.nom
  if ('service' in payload) body.service = payload.service
  if ('montantFcfa' in payload) body.montant_fcfa = payload.montantFcfa
  if ('hopitalId' in payload) body.hopital_id = payload.hopitalId
  if ('specialites' in payload) body.specialites = payload.specialites || null
  if ('formeGalenique' in payload) body.forme_galenique = payload.formeGalenique || null
  if ('classePharmacologique' in payload) body.classe_pharmacologique = payload.classePharmacologique || null
  if ('categorieProduit' in payload) body.categorie_produit = payload.categorieProduit || null
  if ('dateExpiration' in payload) body.date_expiration = payload.dateExpiration || null
  if ('quantiteStock' in payload) body.quantite_stock = payload.quantiteStock
  if ('actif' in payload) body.actif = payload.actif
  if ('metadata' in payload) body.metadata = payload.metadata ?? {}
  const res = await api.patch<ApiCatalogueItem>(`/catalogue/${id}`, body)
  return toItem(res.data)
}

export async function deactivateCatalogueItem(id: number) {
  const res = await api.patch<ApiCatalogueItem>(`/catalogue/${id}/deactivate`)
  return toItem(res.data)
}

export async function deleteCatalogueItem(id: number) {
  await api.delete(`/catalogue/${id}`)
}

export async function getCatalogueTariffHistory(id: number) {
  const res = await api.get<ApiTariffHistory[]>(`/catalogue/${id}/tariff-history`)
  return res.data.map(toHistory)
}
