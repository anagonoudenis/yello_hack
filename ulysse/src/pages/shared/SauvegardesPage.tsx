import { useEffect, useState } from 'react'
import { DatabaseZap, RefreshCcw, Save } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { useNotification } from '@/context/NotificationContext'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/formatDate'
import { getBackupSettings, listBackupRuns, runBackupNow, updateBackupSettings } from '@/services/backupApi'
import type { BackupRunRecord, BackupSettings } from '@/types/backup'


export function SauvegardesPage() {
  const { toast } = useNotification()
  const [settings, setSettings] = useState<BackupSettings | null>(null)
  const [runs, setRuns] = useState<BackupRunRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [settingsData, runsData] = await Promise.all([getBackupSettings(), listBackupRuns()])
      setSettings(settingsData)
      setRuns(runsData)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger la configuration de sauvegarde."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await updateBackupSettings(settings)
      toast('success', 'Configuration enregistree', 'Les parametres de sauvegarde ont ete mis a jour.')
      await load()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'enregistrer ces parametres."))
    } finally {
      setSaving(false)
    }
  }

  const triggerBackup = async () => {
    setSaving(true)
    try {
      await runBackupNow()
      toast('info', 'Sauvegarde lancee', "Une nouvelle execution a ete ajoutee a l'historique.")
      await load()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de lancer la sauvegarde immediate."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <PageHeader title="Sauvegardes locales" subtitle="Configuration de la sauvegarde automatique locale SQLite." />

      {error && <Card className="mb-5 border border-red-200 bg-red-50"><p className="text-[13px] text-red-600">{error}</p></Card>}

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Card>
          {loading || !settings ? (
            <p className="py-10 text-center text-[13px] text-zinc-400">Chargement de la configuration...</p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50"><DatabaseZap size={18} className="text-zinc-600" /></div>
                <div>
                  <h2 className="text-[15px] font-semibold text-zinc-900">Parametres</h2>
                  <p className="text-[12px] text-zinc-400">{settings.supported ? 'Mode supporte sur cette instance locale.' : settings.supportMessage || 'Indisponible.'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-3">
                  <span className="text-[13px] font-semibold text-zinc-700">Activer la sauvegarde automatique</span>
                  <input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} disabled={!settings.supported} />
                </label>
                <input value={settings.frequencyMinutes} onChange={(event) => setSettings({ ...settings, frequencyMinutes: Number(event.target.value) })} type="number" min={5} className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px]" placeholder="Frequence (minutes)" />
                <input value={settings.targetDirectory} onChange={(event) => setSettings({ ...settings, targetDirectory: event.target.value })} className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px]" placeholder="Dossier cible" />
                <input value={settings.retentionCount} onChange={(event) => setSettings({ ...settings, retentionCount: Number(event.target.value) })} type="number" min={1} className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px]" placeholder="Retention" />
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void saveSettings()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#FFCB00] px-4 py-2 text-[13px] font-semibold text-zinc-900"><Save size={14} /> Enregistrer</button>
                  <button onClick={() => void triggerBackup()} disabled={saving || !settings.supported} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-[13px] font-semibold text-zinc-700"><RefreshCcw size={14} /> Sauvegarde immediate</button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-[15px] font-semibold text-zinc-900">Historique des executions</h2>
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[14px] font-semibold text-zinc-900">Execution #{run.id}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${run.status === 'SUCCEEDED' ? 'bg-green-50 text-green-700' : run.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{run.status}</span>
                </div>
                <p className="text-[12px] text-zinc-500">{formatDate(run.startedAt)}</p>
                {run.filePath && <p className="mt-1 break-all text-[12px] text-zinc-600">{run.filePath}</p>}
                {run.errorMessage && <p className="mt-2 text-[12px] text-red-600">{run.errorMessage}</p>}
              </div>
            ))}
            {!runs.length && !loading && <p className="py-10 text-center text-[13px] text-zinc-400">Aucune execution historisee.</p>}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
