import api from '@/services/api'
import type { BackupRunRecord, BackupSettings } from '@/types/backup'


export async function getBackupSettings(): Promise<BackupSettings> {
  const res = await api.get('/admin/backups/settings')
  const data = res.data as {
    enabled: boolean
    frequency_minutes: number
    target_directory: string
    retention_count: number
    updated_by_id: number | null
    updated_at: string | null
    supported: boolean
    support_message: string | null
  }
  return {
    enabled: data.enabled,
    frequencyMinutes: data.frequency_minutes,
    targetDirectory: data.target_directory,
    retentionCount: data.retention_count,
    updatedById: data.updated_by_id,
    updatedAt: data.updated_at,
    supported: data.supported,
    supportMessage: data.support_message,
  }
}

export async function updateBackupSettings(payload: Partial<BackupSettings>) {
  const res = await api.patch('/admin/backups/settings', {
    enabled: payload.enabled,
    frequency_minutes: payload.frequencyMinutes,
    target_directory: payload.targetDirectory,
    retention_count: payload.retentionCount,
  })
  return res.data
}

export async function runBackupNow(): Promise<BackupRunRecord> {
  const res = await api.post('/admin/backups/run-now')
  const data = res.data as {
    id: number
    status: string
    file_path: string | null
    file_size_bytes: number | null
    error_message: string | null
    started_at: string
    finished_at: string | null
  }
  return {
    id: data.id,
    status: data.status,
    filePath: data.file_path,
    fileSizeBytes: data.file_size_bytes,
    errorMessage: data.error_message,
    startedAt: data.started_at,
    finishedAt: data.finished_at,
  }
}

export async function listBackupRuns(): Promise<BackupRunRecord[]> {
  const res = await api.get('/admin/backups/runs')
  const data = res.data as {
    items: Array<{
      id: number
      status: string
      file_path: string | null
      file_size_bytes: number | null
      error_message: string | null
      started_at: string
      finished_at: string | null
    }>
  }
  return data.items.map((item) => ({
    id: item.id,
    status: item.status,
    filePath: item.file_path,
    fileSizeBytes: item.file_size_bytes,
    errorMessage: item.error_message,
    startedAt: item.started_at,
    finishedAt: item.finished_at,
  }))
}
