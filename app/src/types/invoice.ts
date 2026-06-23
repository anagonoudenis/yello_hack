import type { PaymentMethod } from '@/types/transaction'


export type InvoiceStatus = 'EMISE' | 'EN_ATTENTE_CONFIRMATION_BANCAIRE' | 'CHEQUE_REJETE'
export type InvoiceSmsStatus = 'A_ENVOYER' | 'ENVOYE' | 'ECHEC' | 'LOCAL_LOG'

export interface InvoiceRecord {
  numeroFacture: string
  visitId: string
  patientNom: string
  patientTel: string
  moyenPaiement: PaymentMethod
  reference: string | null
  statutDocument: InvoiceStatus
  mentionPaiement: string | null
  downloadUrl: string
  publicDownloadUrl: string
  smsStatus: InvoiceSmsStatus
  smsSentAt: string | null
  smsError: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceListParams {
  search?: string
  paymentMethod?: PaymentMethod
  status?: InvoiceStatus
  page?: number
  pageSize?: number
}
