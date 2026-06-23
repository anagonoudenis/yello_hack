export interface AuditLogRecord {
  id: number
  actionCode: string
  actionLabel: string
  actorId: number | null
  actorNom: string | null
  actorRole: string | null
  entityType: string
  entityId: string
  caisseId: number | null
  detail: Record<string, unknown> | null
  createdAt: string
}

export interface AuditLogListResponse {
  items: AuditLogRecord[]
  total: number
  page: number
  pageSize: number
}
