export type AlertSeverity = 'critique' | 'haute' | 'moyenne'
export type AlertStatus = 'ACTIVE' | 'RESOLUE'

export interface AlertRecord {
  code: string
  ruleCode: string
  ruleName: string
  gravite: AlertSeverity
  message: string
  caisseId: number | null
  sourceType: string
  sourceId: string
  details: Record<string, unknown> | null
  impactAmountFcfa: number | null
  status: AlertStatus
  firstDetectedAt: string
  lastDetectedAt: string
  resolvedAt: string | null
  notificationEmailStatus: string | null
  notificationEmailSentAt: string | null
  createdAt: string
  active: boolean
}
