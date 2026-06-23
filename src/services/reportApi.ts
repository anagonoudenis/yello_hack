import api from '@/services/api'
import type { MobileMoneyAuditLine, PaymentBreakdownLine, ReportSummary } from '@/types/report'


export async function getReportSummary(params: { period: string; anchorDate?: string; caisseId?: number; consolidated?: boolean }) {
  const res = await api.get('/reports/summary', {
    params: {
      period: params.period,
      anchor_date: params.anchorDate,
      caisse_id: params.caisseId,
      consolidated: params.consolidated,
    },
  })
  const data = res.data as {
    period: string
    anchor_date: string
    caisse_id: number | null
    consolidated: boolean
    start_date: string
    end_date: string
    totals: {
      encaisse_fcfa: number
      especes_fcfa: number
      cheques_fcfa: number
      mobile_money_fcfa: number
      visits_total: number
      alerts_total: number
    }
    conclusion: string
  }
  return {
    period: data.period,
    anchorDate: data.anchor_date,
    caisseId: data.caisse_id,
    consolidated: data.consolidated,
    startDate: data.start_date,
    endDate: data.end_date,
    totals: {
      encaisseFcfa: data.totals.encaisse_fcfa,
      especesFcfa: data.totals.especes_fcfa,
      chequesFcfa: data.totals.cheques_fcfa,
      mobileMoneyFcfa: data.totals.mobile_money_fcfa,
      visitsTotal: data.totals.visits_total,
      alertsTotal: data.totals.alerts_total,
    },
    conclusion: data.conclusion,
  } satisfies ReportSummary
}

export async function getPaymentBreakdown(params: { period: string; anchorDate?: string; caisseId?: number; consolidated?: boolean }) {
  const res = await api.get('/reports/payment-breakdown', {
    params: {
      period: params.period,
      anchor_date: params.anchorDate,
      caisse_id: params.caisseId,
      consolidated: params.consolidated,
    },
  })
  const data = res.data as { items: Array<{ moyen_paiement: string; statut: string; total_fcfa: number; count: number }> }
  return data.items.map((item) => ({
    moyenPaiement: item.moyen_paiement,
    statut: item.statut,
    totalFcfa: item.total_fcfa,
    count: item.count,
  })) satisfies PaymentBreakdownLine[]
}

export async function getMobileMoneyAudit(params: { period: string; anchorDate?: string; caisseId?: number; consolidated?: boolean }) {
  const res = await api.get('/reports/mobile-money-audit', {
    params: {
      period: params.period,
      anchor_date: params.anchorDate,
      caisse_id: params.caisseId,
      consolidated: params.consolidated,
    },
  })
  const data = res.data as {
    items: Array<{
      id_visite: string
      transaction_id: number
      numero_facture: string | null
      provider_attempt_id: string | null
      provider_status: string | null
      reference_paiement: string | null
      montant_attendu_fcfa: number
      montant_provider_fcfa: number | null
      frais_provider_fcfa: number | null
      verdict: string
      observation: string
      created_at: string
    }>
  }
  return data.items.map((item) => ({
    idVisite: item.id_visite,
    transactionId: item.transaction_id,
    numeroFacture: item.numero_facture,
    providerAttemptId: item.provider_attempt_id,
    providerStatus: item.provider_status,
    referencePaiement: item.reference_paiement,
    montantAttenduFcfa: item.montant_attendu_fcfa,
    montantProviderFcfa: item.montant_provider_fcfa,
    fraisProviderFcfa: item.frais_provider_fcfa,
    verdict: item.verdict,
    observation: item.observation,
    createdAt: item.created_at,
  })) satisfies MobileMoneyAuditLine[]
}

export async function exportReport(format: 'pdf' | 'csv' | 'xlsx', params: {
  reportType: 'summary' | 'payment-breakdown' | 'visits-journal' | 'mobile-money-audit' | 'alerts-detailed' | 'audit-log'
  period: string
  anchorDate?: string
  caisseId?: number
  consolidated?: boolean
}) {
  const res = await api.get('/reports/export', {
    params: {
      report_type: params.reportType,
      format,
      period: params.period,
      anchor_date: params.anchorDate,
      caisse_id: params.caisseId,
      consolidated: params.consolidated,
    },
    responseType: 'blob',
  })
  return res.data as Blob
}
