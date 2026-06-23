import api from '@/services/api'
import type { AlertRecord } from '@/types/alert'


interface ApiAlertRecord {
  code: string
  rule_code: string
  rule_name: string
  gravite: AlertRecord['gravite']
  message: string
  caisse_id: number | null
  source_type: string
  source_id: string
  details: Record<string, unknown> | null
  impact_amount_fcfa: number | null
  status: AlertRecord['status']
  first_detected_at: string
  last_detected_at: string
  resolved_at: string | null
  notification_email_status: string | null
  notification_email_sent_at: string | null
  created_at: string
  active: boolean
}

interface ApiAlertListResponse {
  items: ApiAlertRecord[]
  total: number
}

const toAlert = (item: ApiAlertRecord): AlertRecord => ({
  code: item.code,
  ruleCode: item.rule_code,
  ruleName: item.rule_name,
  gravite: item.gravite,
  message: item.message,
  caisseId: item.caisse_id,
  sourceType: item.source_type,
  sourceId: item.source_id,
  details: item.details,
  impactAmountFcfa: item.impact_amount_fcfa,
  status: item.status,
  firstDetectedAt: item.first_detected_at,
  lastDetectedAt: item.last_detected_at,
  resolvedAt: item.resolved_at,
  notificationEmailStatus: item.notification_email_status,
  notificationEmailSentAt: item.notification_email_sent_at,
  createdAt: item.created_at,
  active: item.active,
})

export async function listAlerts(params: { ruleCode?: string; active?: boolean; status?: string; gravite?: string; caisseId?: number } = {}) {
  const res = await api.get<ApiAlertListResponse>('/alerts', {
    params: {
      rule_code: params.ruleCode || undefined,
      active: params.active,
      status: params.status || undefined,
      gravite: params.gravite || undefined,
      caisse_id: params.caisseId,
    },
  })
  return {
    items: res.data.items.map(toAlert),
    total: res.data.total,
  }
}

export async function getAlert(alertCode: string) {
  const res = await api.get<ApiAlertRecord>(`/alerts/${encodeURIComponent(alertCode)}`)
  return toAlert(res.data)
}

export async function resolveAlert(alertCode: string, resolutionNote?: string) {
  const res = await api.patch<ApiAlertRecord>(`/alerts/${encodeURIComponent(alertCode)}/resolve`, {
    resolution_note: resolutionNote || undefined,
  })
  return toAlert(res.data)
}

export async function sendAlertEmail(alertCode: string) {
  const res = await api.post<ApiAlertRecord>(`/alerts/${encodeURIComponent(alertCode)}/send-email`)
  return toAlert(res.data)
}

export async function exportAlertReport(format: 'pdf' | 'csv' | 'xlsx') {
  const res = await api.get(`/alerts/report/export`, {
    params: { format },
    responseType: 'blob',
  })
  return res.data as Blob
}
