import api from '@/services/api'
import type { AuditLogListResponse, AuditLogRecord } from '@/types/audit'


interface ApiAuditLogRecord {
  id: number
  action_code: string
  action_label: string
  actor_id: number | null
  actor_nom_snapshot: string | null
  actor_role_snapshot: string | null
  entity_type: string
  entity_id: string
  caisse_id: number | null
  detail: Record<string, unknown> | null
  created_at: string
}

interface ApiAuditLogListResponse {
  items: ApiAuditLogRecord[]
  total: number
  page: number
  page_size: number
}

const toAuditLog = (item: ApiAuditLogRecord): AuditLogRecord => ({
  id: item.id,
  actionCode: item.action_code,
  actionLabel: item.action_label,
  actorId: item.actor_id,
  actorNom: item.actor_nom_snapshot,
  actorRole: item.actor_role_snapshot,
  entityType: item.entity_type,
  entityId: item.entity_id,
  caisseId: item.caisse_id,
  detail: item.detail,
  createdAt: item.created_at,
})

export async function listAuditLogs(params: {
  actionCode?: string
  actorRole?: string
  caisseId?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
} = {}): Promise<AuditLogListResponse> {
  const res = await api.get<ApiAuditLogListResponse>('/audit-logs', {
    params: {
      action_code: params.actionCode || undefined,
      actor_role: params.actorRole || undefined,
      caisse_id: params.caisseId,
      search: params.search || undefined,
      date_from: params.dateFrom || undefined,
      date_to: params.dateTo || undefined,
      page: params.page,
      page_size: params.pageSize,
    },
  })
  return {
    items: res.data.items.map(toAuditLog),
    total: res.data.total,
    page: res.data.page,
    pageSize: res.data.page_size,
  }
}

export async function exportAuditLogs(format: 'csv' | 'xlsx', params: Record<string, unknown> = {}) {
  const res = await api.get('/audit-logs/export', {
    params: { format, ...params },
    responseType: 'blob',
  })
  return res.data as Blob
}
