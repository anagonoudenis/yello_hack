import api from '@/services/api'
import type {
  ChequePaymentListParams,
  ChequePaymentRecord,
  CreateVersementPayload,
  VersementListParams,
  VersementRecord,
  VersementTheoretical,
} from '@/types/versement'


interface ApiChequePaymentRecord {
  payment_id: number
  transaction_id: number
  id_visite: string
  caisse_id: number | null
  caisse_nom: string | null
  patient_nom: string
  patient_tel: string
  montant_fcfa: number
  statut: ChequePaymentRecord['statut']
  cheque_numero: string
  cheque_banque: string
  cheque_titulaire: string
  invoice_number: string | null
  created_at: string
  updated_at: string
}

interface ApiChequePaymentListResponse {
  items: ApiChequePaymentRecord[]
  total: number
}

interface ApiVersementRecord {
  versement_id: string
  date_versement: string
  scope: VersementRecord['scope']
  caisse_ids: number[]
  montant_theorique_fcfa: number
  montant_theorique_especes_fcfa: number
  montant_theorique_cheques_fcfa: number
  montant_compte_especes_fcfa: number
  montant_remis_cheques_fcfa: number
  montant_verse_fcfa: number
  ecart_fcfa: number
  note: string | null
  statut: VersementRecord['statut']
  declared_by_id: number
  justificatif_filename: string
  created_at: string
}

interface ApiVersementListResponse {
  items: ApiVersementRecord[]
  total: number
}

interface ApiVersementTheoretical {
  date: string
  caisse_ids: number[]
  montant_theorique_fcfa: number
  montant_theorique_especes_fcfa: number
  montant_theorique_cheques_fcfa: number
  per_caisse: Array<{
    caisse_id: number
    montant_theorique_fcfa: number
    montant_theorique_especes_fcfa: number
    montant_theorique_cheques_fcfa: number
  }>
}

const toChequePayment = (item: ApiChequePaymentRecord): ChequePaymentRecord => ({
  paymentId: item.payment_id,
  transactionId: item.transaction_id,
  idVisite: item.id_visite,
  caisseId: item.caisse_id,
  caisseNom: item.caisse_nom,
  patientNom: item.patient_nom,
  patientTel: item.patient_tel,
  montantFcfa: item.montant_fcfa,
  statut: item.statut,
  chequeNumero: item.cheque_numero,
  chequeBanque: item.cheque_banque,
  chequeTitulaire: item.cheque_titulaire,
  invoiceNumber: item.invoice_number,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const toVersement = (item: ApiVersementRecord): VersementRecord => ({
  versementId: item.versement_id,
  dateVersement: item.date_versement,
  scope: item.scope,
  caisseIds: item.caisse_ids,
  montantTheoriqueFcfa: item.montant_theorique_fcfa,
  montantTheoriqueEspecesFcfa: item.montant_theorique_especes_fcfa,
  montantTheoriqueChequesFcfa: item.montant_theorique_cheques_fcfa,
  montantCompteEspecesFcfa: item.montant_compte_especes_fcfa,
  montantRemisChequesFcfa: item.montant_remis_cheques_fcfa,
  montantVerseFcfa: item.montant_verse_fcfa,
  ecartFcfa: item.ecart_fcfa,
  note: item.note,
  statut: item.statut,
  declaredById: item.declared_by_id,
  justificatifFilename: item.justificatif_filename,
  createdAt: item.created_at,
})

const toVersementTheoretical = (item: ApiVersementTheoretical): VersementTheoretical => ({
  date: item.date,
  caisseIds: item.caisse_ids,
  montantTheoriqueFcfa: item.montant_theorique_fcfa,
  montantTheoriqueEspecesFcfa: item.montant_theorique_especes_fcfa,
  montantTheoriqueChequesFcfa: item.montant_theorique_cheques_fcfa,
  perCaisse: item.per_caisse.map((line) => ({
    caisseId: line.caisse_id,
    montantTheoriqueFcfa: line.montant_theorique_fcfa,
    montantTheoriqueEspecesFcfa: line.montant_theorique_especes_fcfa,
    montantTheoriqueChequesFcfa: line.montant_theorique_cheques_fcfa,
  })),
})

export async function listChequePayments(params: ChequePaymentListParams = {}) {
  const res = await api.get<ApiChequePaymentListResponse>('/payments/cheques', {
    params: {
      status: params.status || undefined,
      search: params.search || undefined,
      caisse_id: params.caisseId,
      date_from: params.dateFrom || undefined,
      date_to: params.dateTo || undefined,
      page: params.page,
      page_size: params.pageSize,
    },
  })
  return {
    items: res.data.items.map(toChequePayment),
    total: res.data.total,
  }
}

export async function updateChequePaymentStatus(paymentId: number, statut: 'ENCAISSE' | 'REJETE') {
  const res = await api.patch<ApiChequePaymentRecord>(`/payments/cheques/${paymentId}/status`, { statut })
  return toChequePayment(res.data)
}

export async function getTheoreticalVersement(params: { date?: string; caisseIds?: number[] } = {}) {
  const res = await api.get<ApiVersementTheoretical>('/versements/theoretical', {
    params: {
      date: params.date || undefined,
      caisse_ids: params.caisseIds?.length ? params.caisseIds.join(',') : undefined,
    },
  })
  return toVersementTheoretical(res.data)
}

export async function createVersement(payload: CreateVersementPayload) {
  const formData = new FormData()
  formData.append('date_versement', payload.dateVersement)
  formData.append('scope', payload.scope)
  payload.caisseIds.forEach((caisseId) => formData.append('caisse_ids', String(caisseId)))
  formData.append('montant_compte_especes_fcfa', String(payload.montantCompteEspecesFcfa))
  formData.append('montant_remis_cheques_fcfa', String(payload.montantRemisChequesFcfa))
  if (payload.note?.trim()) formData.append('note', payload.note.trim())
  formData.append('justificatif', payload.justificatif)

  const res = await api.post<ApiVersementRecord>('/versements', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return toVersement(res.data)
}

export async function listVersements(params: VersementListParams = {}) {
  const res = await api.get<ApiVersementListResponse>('/versements', {
    params: {
      date_from: params.dateFrom || undefined,
      date_to: params.dateTo || undefined,
      caisse_id: params.caisseId,
      scope: params.scope || undefined,
      page: params.page,
      page_size: params.pageSize,
    },
  })
  return {
    items: res.data.items.map(toVersement),
    total: res.data.total,
  }
}

export async function downloadVersementReceipt(versementId: string) {
  const res = await api.get(`/versements/${encodeURIComponent(versementId)}/justificatif`, {
    responseType: 'blob',
  })
  const filename =
    (res.headers['content-disposition'] as string | undefined)
      ?.split('filename=')
      .at(1)
      ?.replaceAll('"', '') || `${versementId}.bin`
  return {
    blob: res.data as Blob,
    filename,
  }
}
