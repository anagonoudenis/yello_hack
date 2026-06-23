import type { MobileMoneyOperator } from '@/lib/paymentOperators'


export type TransactionStatus = 'EN_ATTENTE' | 'ECHOUE' | 'SOLDE' | 'PARTIELLEMENT_SOLDE'
export type PaymentMethod = 'ESPECES' | 'CHEQUE' | 'MOBILE_MONEY'
export type PaymentStatus = 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'RECU' | 'ENCAISSE' | 'REJETE'

export interface TransactionLineRecord {
  id: number
  catalogueItemId: number
  codeElement: string
  nom: string
  type: string
  service: string
  quantite: number
  prixUnitaireFcfa: number
  montantLigneFcfa: number
  payable: boolean
  motifNonHonore: string | null
  createdAt: string
}

export interface TransactionPaymentRecord {
  id: number
  attemptNo: number
  moyenPaiement: PaymentMethod
  statut: PaymentStatus
  montantFcfa: number
  provider: string | null
  providerAttemptId: string | null
  providerStatus: string | null
  operatorCode: MobileMoneyOperator | null
  referencePaiement: string | null
  providerErrorCode: string | null
  providerMode: string | null
  providerAmountDebitedFcfa: number | null
  providerFeesFcfa: number | null
  montantRecuFcfa: number | null
  monnaieRendueFcfa: number | null
  telephonePaiement: string | null
  chequeNumero: string | null
  chequeBanque: string | null
  chequeTitulaire: string | null
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
  failedAt: string | null
}

export interface TransactionRecord {
  id: number
  visitId: string
  patientNom: string
  patientTel: string
  caisseId: number | null
  caissierId: number
  statut: TransactionStatus
  montantTotalFcfa: number
  montantEncaisseFcfa: number
  invoiceNumber: string | null
  invoiceStatus: string | null
  canReopenInCashier: boolean
  blockingReason: string | null
  createdAt: string
  updatedAt: string
  lines: TransactionLineRecord[]
  latestPayment: TransactionPaymentRecord
}

export interface TransactionSummary {
  encaisseFcfa: number
  especesFcfa: number
  chequesFcfa: number
  momoFcfa: number
}

export interface TransactionListParams {
  search?: string
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface TransactionListResponse {
  items: TransactionRecord[]
  total: number
  summary: TransactionSummary
}

export interface TransactionDraftLine {
  catalogueItemId: number
  codeElement: string
  nom: string
  type: string
  service: string
  quantite: number
  prixUnitaireFcfa: number
  montantLigneFcfa: number
  payable: boolean
  motifNonHonore: string
}

export interface CreateTransactionPayload {
  idVisite: string
  lines: Array<{
    catalogueItemId: number
    quantite: number
    payable: boolean
    motifNonHonore?: string
  }>
  payment:
    | {
        moyenPaiement: 'ESPECES'
        montantRecuFcfa: number
      }
    | {
        moyenPaiement: 'MOBILE_MONEY'
        telephonePaiement: string
      }
    | {
        moyenPaiement: 'CHEQUE'
        chequeNumero: string
        chequeBanque: string
        chequeTitulaire: string
      }
}
