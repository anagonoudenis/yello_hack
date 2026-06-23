import api from '@/services/api'
import type { InvoiceListParams, InvoiceRecord } from '@/types/invoice'


interface ApiInvoiceRecord {
  numero_facture: string
  visit_id: string
  patient_nom: string
  patient_tel: string
  moyen_paiement: InvoiceRecord['moyenPaiement']
  reference: string | null
  statut_document: InvoiceRecord['statutDocument']
  mention_paiement: string | null
  download_url: string
  public_download_url: string
  sms_status: InvoiceRecord['smsStatus']
  sms_sent_at: string | null
  sms_error: string | null
  created_at: string
  updated_at: string
}

interface ApiInvoiceListResponse {
  items: ApiInvoiceRecord[]
  total: number
}

const toInvoice = (item: ApiInvoiceRecord): InvoiceRecord => ({
  numeroFacture: item.numero_facture,
  visitId: item.visit_id,
  patientNom: item.patient_nom,
  patientTel: item.patient_tel,
  moyenPaiement: item.moyen_paiement,
  reference: item.reference,
  statutDocument: item.statut_document,
  mentionPaiement: item.mention_paiement,
  downloadUrl: item.download_url,
  publicDownloadUrl: item.public_download_url,
  smsStatus: item.sms_status,
  smsSentAt: item.sms_sent_at,
  smsError: item.sms_error,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

export async function listInvoices(params: InvoiceListParams = {}) {
  const res = await api.get<ApiInvoiceListResponse>('/factures', {
    params: {
      search: params.search || undefined,
      payment_method: params.paymentMethod || undefined,
      status: params.status || undefined,
      page: params.page,
      page_size: params.pageSize,
    },
  })
  return {
    items: res.data.items.map(toInvoice),
    total: res.data.total,
  }
}

export async function getInvoice(numeroFacture: string) {
  const res = await api.get<ApiInvoiceRecord>(`/factures/${encodeURIComponent(numeroFacture)}`)
  return toInvoice(res.data)
}

export async function resendInvoiceSms(numeroFacture: string) {
  const res = await api.post<ApiInvoiceRecord>(`/factures/${encodeURIComponent(numeroFacture)}/send-sms`)
  return toInvoice(res.data)
}

export async function openInvoicePdf(numeroFacture: string) {
  const popup = window.open('', '_blank', 'noopener,noreferrer')
  const res = await api.get<Blob>(`/factures/${encodeURIComponent(numeroFacture)}/pdf`, {
    responseType: 'blob',
  })

  const blob = new Blob([res.data], { type: 'application/pdf' })
  const blobUrl = window.URL.createObjectURL(blob)
  if (popup) {
    popup.location.href = blobUrl
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
  }
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000)
}
