import type { MobileMoneyOperator } from '@/lib/paymentOperators'
import type { ProductCategory } from '@/types/catalogue'
import type { HospitalizationChargeOrigin, HospitalizationChargeStatus } from '@/types/hospitalization'


export type TransactionStatus = 'EN_ATTENTE' | 'ECHOUE' | 'SOLDE' | 'PARTIELLEMENT_SOLDE'
export type PaymentMethod = 'ESPECES' | 'CHEQUE' | 'MOBILE_MONEY'
export type PaymentStatus = 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'RECU' | 'ENCAISSE' | 'REJETE'
export type TransactionSourceType = 'OUTPATIENT' | 'HOSPITALIZATION'
export type TransactionKind = 'OUTPATIENT_SALE' | 'HOSPITALIZATION_INTERMEDIATE' | 'HOSPITALIZATION_FINAL'
export type DossierType = 'EXTERNE' | 'HOSPITALISATION'
export type DossierFinancialStatus = 'SOLDE' | 'NON_SOLDE' | 'TENTATIVE_NON_ABOUTIE'

export interface TransactionLineRecord {
  id: number
  catalogueItemId: number
  hospitalizationChargeId?: number | null
  hospitalizationChargeOrigin?: HospitalizationChargeOrigin | null
  hospitalizationChargeStatus?: HospitalizationChargeStatus | null
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
  sourceType: TransactionSourceType
  transactionKind: TransactionKind
  hospitalizationCaseId: string | null
  patientNom: string
  patientTel: string
  caisseId: number | null
  caissierId: number
  statut: TransactionStatus
  montantTotalFcfa: number
  montantEncaisseFcfa: number
  dossierTotalFcfa: number
  dossierPaidFcfa: number
  dossierRemainingFcfa: number
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
  hospitalizationChargeId?: number | null
  hospitalizationChargeOrigin?: HospitalizationChargeOrigin | null
  hospitalizationChargeStatus?: HospitalizationChargeStatus | null
  isCashierDraft?: boolean
  codeElement: string
  nom: string
  type: string
  service: string
  quantite: number
  prixUnitaireFcfa: number
  montantLigneFcfa: number
  payable: boolean
  motifNonHonore: string
  stockManaged?: boolean
  categorieProduit?: ProductCategory | null
  quantiteStock?: number
  dateExpiration?: string | null
}

export interface CreateTransactionPayload {
  idVisite?: string
  hospitalizationCaseNumber?: string
  transactionKind?: TransactionKind
  lines: Array<{
    catalogueItemId: number
    hospitalizationChargeId?: number | null
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

export interface DossierSummaryRecord {
  dossierId: string
  visitId: string
  hospitalizationCaseId: string | null
  patientNom: string
  patientTel: string
  dossierType: DossierType
  statut: string
  financialStatus: DossierFinancialStatus
  montantTotalFcfa: number
  montantTotalPayeFcfa: number
  montantRestantFcfa: number
  dernierEncaissementAt: string | null
}

export interface DossierChargeRecord {
  id: number
  codeReference: string
  label: string
  chargeType: string
  origin: HospitalizationChargeOrigin | string
  service: string | null
  chargeDate: string | null
  quantite: number
  montantFcfa: number
  statusReglement: string
  transactionId: number | null
}

export interface NonDueAttemptLineRecord {
  codeReference: string
  label: string
  quantite: number
  montantFcfa: number
}

export interface NonDueAttemptRecord {
  transactionId: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  createdAt: string
  montantTenteFcfa: number
  providerStatus: string | null
  providerErrorCode: string | null
  lines: NonDueAttemptLineRecord[]
}

export interface DossierDetailRecord extends DossierSummaryRecord {
  prochainJalonAt: string | null
  transactions: TransactionRecord[]
  chargesNonReglees: DossierChargeRecord[]
  nonDueAttempts: NonDueAttemptRecord[]
}
