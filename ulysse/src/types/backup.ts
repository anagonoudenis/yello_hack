export interface BackupSettings {
  enabled: boolean
  frequencyMinutes: number
  targetDirectory: string
  retentionCount: number
  updatedById: number | null
  updatedAt: string | null
  supported: boolean
  supportMessage: string | null
}

export interface BackupRunRecord {
  id: number
  status: string
  filePath: string | null
  fileSizeBytes: number | null
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
}
