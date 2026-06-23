import api from '@/services/api'
import type {
  CreateTransactionPayload,
  TransactionListParams,
  TransactionListResponse,
  TransactionRecord,
} from '@/types/transaction'


interface ApiTransactionLine {
  id: number
  catalogue_item_id: number
  code_element_snapshot: string
  nom_snapshot: string
  type_snapshot: string
  service_snapshot: string
  quantite: number
  prix_unitaire_fcfa: number
  montant_ligne_fcfa: number
  payable: boolean
  motif_non_honore: string | null
  created_at: string
}

interface ApiTransactionPayment {
  id: number
  attempt_no: number
  moyen_paiement: TransactionRecord['latestPayment']['moyenPaiement']
  statut: TransactionRecord['latestPayment']['statut']
  montant_fcfa: number
  provider: string | null
  provider_attempt_id: string | null
  provider_status: string | null
  operator_code: TransactionRecord['latestPayment']['operatorCode']
  reference_paiement: string | null
  provider_error_code: string | null
  provider_mode: string | null
  provider_amount_debited_fcfa: number | null
  provider_fees_fcfa: number | null
  montant_recu_fcfa: number | null
  monnaie_rendue_fcfa: number | null
  telephone_paiement: string | null
  cheque_numero: string | null
  cheque_banque: string | null
  cheque_titulaire: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  failed_at: string | null
}

interface ApiTransactionRecord {
  id: number
  id_visite: string
  patient_nom: string
  patient_tel: string
  caisse_id: number | null
  caissier_id: number
  statut: TransactionRecord['statut']
  montant_total_fcfa: number
  montant_encaisse_fcfa: number
  invoice_number: string | null
  invoice_status: string | null
  can_reopen_in_cashier: boolean
  blocking_reason: string | null
  created_at: string
  updated_at: string
  lines: ApiTransactionLine[]
  payment: ApiTransactionPayment
}

interface ApiTransactionListResponse {
  items: ApiTransactionRecord[]
  total: number
  summary: {
    encaisse_fcfa: number
    especes_fcfa: number
    cheques_fcfa: number
    momo_fcfa: number
  }
}

const toTransaction = (item: ApiTransactionRecord): TransactionRecord => ({
  id: item.id,
  visitId: item.id_visite,
  patientNom: item.patient_nom,
  patientTel: item.patient_tel,
  caisseId: item.caisse_id,
  caissierId: item.caissier_id,
  statut: item.statut,
  montantTotalFcfa: item.montant_total_fcfa,
  montantEncaisseFcfa: item.montant_encaisse_fcfa,
  invoiceNumber: item.invoice_number,
  invoiceStatus: item.invoice_status,
  canReopenInCashier: item.can_reopen_in_cashier,
  blockingReason: item.blocking_reason,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  lines: item.lines.map((line) => ({
    id: line.id,
    catalogueItemId: line.catalogue_item_id,
    codeElement: line.code_element_snapshot,
    nom: line.nom_snapshot,
    type: line.type_snapshot,
    service: line.service_snapshot,
    quantite: line.quantite,
    prixUnitaireFcfa: line.prix_unitaire_fcfa,
    montantLigneFcfa: line.montant_ligne_fcfa,
    payable: line.payable,
    motifNonHonore: line.motif_non_honore,
    createdAt: line.created_at,
  })),
  latestPayment: {
    id: item.payment.id,
    attemptNo: item.payment.attempt_no,
    moyenPaiement: item.payment.moyen_paiement,
    statut: item.payment.statut,
    montantFcfa: item.payment.montant_fcfa,
    provider: item.payment.provider,
    providerAttemptId: item.payment.provider_attempt_id,
    providerStatus: item.payment.provider_status,
    operatorCode: item.payment.operator_code,
    referencePaiement: item.payment.reference_paiement,
    providerErrorCode: item.payment.provider_error_code,
    providerMode: item.payment.provider_mode,
    providerAmountDebitedFcfa: item.payment.provider_amount_debited_fcfa,
    providerFeesFcfa: item.payment.provider_fees_fcfa,
    montantRecuFcfa: item.payment.montant_recu_fcfa,
    monnaieRendueFcfa: item.payment.monnaie_rendue_fcfa,
    telephonePaiement: item.payment.telephone_paiement,
    chequeNumero: item.payment.cheque_numero,
    chequeBanque: item.payment.cheque_banque,
    chequeTitulaire: item.payment.cheque_titulaire,
    createdAt: item.payment.created_at,
    updatedAt: item.payment.updated_at,
    confirmedAt: item.payment.confirmed_at,
    failedAt: item.payment.failed_at,
  },
})

export async function listTransactions(params: TransactionListParams = {}): Promise<TransactionListResponse> {
  const res = await api.get<ApiTransactionListResponse>('/transactions', {
    params: {
      search: params.search || undefined,
      payment_method: params.paymentMethod || undefined,
      payment_status: params.paymentStatus || undefined,
      date_from: params.dateFrom || undefined,
      date_to: params.dateTo || undefined,
      page: params.page,
      page_size: params.pageSize,
    },
  })
  return {
    items: res.data.items.map(toTransaction),
    total: res.data.total,
    summary: {
      encaisseFcfa: res.data.summary.encaisse_fcfa,
      especesFcfa: res.data.summary.especes_fcfa,
      chequesFcfa: res.data.summary.cheques_fcfa,
      momoFcfa: res.data.summary.momo_fcfa,
    },
  }
}

export async function getTransactionByVisit(idVisite: string) {
  const res = await api.get<ApiTransactionRecord>(`/transactions/by-visit/${encodeURIComponent(idVisite)}`)
  return toTransaction(res.data)
}

export async function refreshTransactionProviderStatus(transactionId: number) {
  const res = await api.post<ApiTransactionRecord>(`/transactions/${transactionId}/refresh-provider-status`)
  return toTransaction(res.data)
}

export async function retryMobileMoneyTransaction(transactionId: number, telephonePaiement?: string) {
  const res = await api.post<ApiTransactionRecord>(`/transactions/${transactionId}/payments/mobile-money/retry`, {
    telephone_paiement: telephonePaiement || undefined,
  })
  return toTransaction(res.data)
}

export async function createTransaction(payload: CreateTransactionPayload) {
  const paymentBody: Record<string, unknown> = {
    moyen_paiement: payload.payment.moyenPaiement,
  }

  if (payload.payment.moyenPaiement === 'ESPECES') {
    paymentBody.montant_recu_fcfa = payload.payment.montantRecuFcfa
  } else if (payload.payment.moyenPaiement === 'MOBILE_MONEY') {
    paymentBody.telephone_paiement = payload.payment.telephonePaiement
  } else if (payload.payment.moyenPaiement === 'CHEQUE') {
    paymentBody.cheque_numero = payload.payment.chequeNumero
    paymentBody.cheque_banque = payload.payment.chequeBanque
    paymentBody.cheque_titulaire = payload.payment.chequeTitulaire
  }

  const res = await api.post<ApiTransactionRecord>('/transactions', {
    id_visite: payload.idVisite,
    lignes: payload.lines.map((line) => ({
      catalogue_item_id: line.catalogueItemId,
      quantite: line.quantite,
      payable: line.payable,
      motif_non_honore: line.motifNonHonore || undefined,
    })),
    paiement: paymentBody,
  })
  return toTransaction(res.data)
}
