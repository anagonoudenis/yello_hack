import type { CaisseItem } from '@/types/caisse'


export type ChequePaymentStatus = 'RECU' | 'ENCAISSE' | 'REJETE'
export type VersementScope = 'UNIQUE' | 'CONSOLIDE'
export type VersementStatus = 'EFFECTUE'

export interface ChequePaymentRecord {
  paymentId: number
  transactionId: number
  idVisite: string
  caisseId: number | null
  caisseNom: string | null
  patientNom: string
  patientTel: string
  montantFcfa: number
  statut: ChequePaymentStatus
  chequeNumero: string
  chequeBanque: string
  chequeTitulaire: string
  invoiceNumber: string | null
  createdAt: string
  updatedAt: string
}

export interface ChequePaymentListParams {
  status?: ChequePaymentStatus
  search?: string
  caisseId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface VersementRecord {
  versementId: string
  dateVersement: string
  scope: VersementScope
  caisseIds: number[]
  montantTheoriqueFcfa: number
  montantTheoriqueEspecesFcfa: number
  montantTheoriqueChequesFcfa: number
  montantCompteEspecesFcfa: number
  montantRemisChequesFcfa: number
  montantVerseFcfa: number
  ecartFcfa: number
  note: string | null
  statut: VersementStatus
  declaredById: number
  justificatifFilename: string
  createdAt: string
}

export interface VersementTheoretical {
  date: string
  caisseIds: number[]
  montantTheoriqueFcfa: number
  montantTheoriqueEspecesFcfa: number
  montantTheoriqueChequesFcfa: number
  perCaisse: Array<{
    caisseId: number
    montantTheoriqueFcfa: number
    montantTheoriqueEspecesFcfa: number
    montantTheoriqueChequesFcfa: number
  }>
}

export interface CreateVersementPayload {
  dateVersement: string
  scope: VersementScope
  caisseIds: number[]
  montantCompteEspecesFcfa: number
  montantRemisChequesFcfa: number
  note?: string
  justificatif: File
}

export interface VersementListParams {
  dateFrom?: string
  dateTo?: string
  caisseId?: number
  scope?: VersementScope
  page?: number
  pageSize?: number
}

export interface BankingViewData {
  caisses: CaisseItem[]
  cheques: ChequePaymentRecord[]
  versements: VersementRecord[]
  theoretical: VersementTheoretical | null
}
