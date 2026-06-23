export interface ReportSummary {
  period: string
  anchorDate: string
  caisseId: number | null
  consolidated: boolean
  startDate: string
  endDate: string
  totals: {
    encaisseFcfa: number
    especesFcfa: number
    chequesFcfa: number
    mobileMoneyFcfa: number
    visitsTotal: number
    alertsTotal: number
  }
  conclusion: string
}

export interface PaymentBreakdownLine {
  moyenPaiement: string
  statut: string
  totalFcfa: number
  count: number
}

export interface MobileMoneyAuditLine {
  idVisite: string
  transactionId: number
  numeroFacture: string | null
  providerAttemptId: string | null
  providerStatus: string | null
  referencePaiement: string | null
  montantAttenduFcfa: number
  montantProviderFcfa: number | null
  fraisProviderFcfa: number | null
  verdict: string
  observation: string
  createdAt: string
}
