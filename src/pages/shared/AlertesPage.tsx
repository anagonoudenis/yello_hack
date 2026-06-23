import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Download, Mail, ShieldCheck } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { useNotification } from '@/context/NotificationContext'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { exportAlertReport, listAlerts, resolveAlert, sendAlertEmail } from '@/services/alertApi'
import type { AlertRecord, AlertSeverity, AlertStatus } from '@/types/alert'


const severityLabel: Record<AlertSeverity, string> = {
  critique: 'Critique',
  haute: 'Haute',
  moyenne: 'Moyenne',
}

const statusLabel: Record<AlertStatus, string> = {
  ACTIVE: 'Active',
  RESOLUE: 'Resolue',
}

export function AlertesPage({ role }: { role: 'superviseur' | 'admin' }) {
  const { toast } = useNotification()
  const [items, setItems] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<AlertRecord | null>(null)
  const [severity, setSeverity] = useState<AlertSeverity | ''>('')
  const [statusFilter, setStatusFilter] = useState<AlertStatus | ''>('ACTIVE')
  const [busyCode, setBusyCode] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listAlerts({
        gravite: severity || undefined,
        status: statusFilter || undefined,
      })
      setItems(response.items)
      setSelected((current) => response.items.find((item) => item.code === current?.code) || response.items[0] || null)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger les alertes d'anomalie."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [severity, statusFilter])

  const counts = useMemo(
    () => ({
      active: items.filter((item) => item.status === 'ACTIVE').length,
      critique: items.filter((item) => item.gravite === 'critique').length,
      resolue: items.filter((item) => item.status === 'RESOLUE').length,
    }),
    [items]
  )

  const download = async (format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const blob = await exportAlertReport(format)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `alertes-detail.${format}`
      link.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'exporter le rapport d'alertes."))
    }
  }

  const handleResolve = async (alertCode: string) => {
    setBusyCode(alertCode)
    try {
      await resolveAlert(alertCode)
      toast('success', 'Alerte resolue', "L'occurrence a ete basculee en statut resolu.")
      await load()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de resoudre cette alerte."))
    } finally {
      setBusyCode('')
    }
  }

  const handleSendEmail = async (alertCode: string) => {
    setBusyCode(alertCode)
    try {
      await sendAlertEmail(alertCode)
      toast('info', 'Notification traitee', 'Le statut de notification email a ete mis a jour.')
      await load()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'envoyer l'email de supervision."))
    } finally {
      setBusyCode('')
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Alertes nommees"
        subtitle={role === 'admin' ? "Vue d'administration des anomalies et notifications." : 'Suivi des anomalies, preuves et recommandations de traitement.'}
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Anomalies actives</p>
          <p className="mt-2 text-[28px] font-black text-zinc-900">{counts.active}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Critiques</p>
          <p className="mt-2 text-[28px] font-black text-red-700">{counts.critique}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Resolues chargees</p>
          <p className="mt-2 text-[28px] font-black text-green-700">{counts.resolue}</p>
        </Card>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <select value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity | '')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]">
          <option value="">Toutes les gravites</option>
          <option value="critique">Critique</option>
          <option value="haute">Haute</option>
          <option value="moyenne">Moyenne</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AlertStatus | '')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actives</option>
          <option value="RESOLUE">Resolues</option>
        </select>
        <button onClick={() => void download('pdf')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700">
          <Download size={14} /> PDF
        </button>
        <button onClick={() => void download('csv')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700">
          <Download size={14} /> CSV
        </button>
        <button onClick={() => void download('xlsx')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700">
          <Download size={14} /> XLSX
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card padding="none">
          <div className="max-h-[640px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-10 text-center text-[13px] text-zinc-400">Chargement des alertes...</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-zinc-400">Aucune alerte pour ces filtres.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setSelected(item)}
                  className={`w-full border-b border-zinc-100 px-4 py-3 text-left last:border-0 ${selected?.code === item.code ? 'bg-[#FFFAE6]' : 'hover:bg-zinc-50'}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-zinc-900">{item.ruleName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.gravite === 'critique' ? 'bg-red-50 text-red-700' : item.gravite === 'haute' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                      {severityLabel[item.gravite]}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[12px] text-zinc-500">{item.message}</p>
                  <p className="mt-2 text-[11px] text-zinc-400">{formatDate(item.lastDetectedAt)}</p>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card>
          {!selected ? (
            <div className="py-14 text-center text-[13px] text-zinc-400">Selectionnez une alerte pour afficher son detail.</div>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">{statusLabel[selected.status]}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${selected.gravite === 'critique' ? 'bg-red-50 text-red-700' : selected.gravite === 'haute' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{severityLabel[selected.gravite]}</span>
                  </div>
                  <h2 className="text-[18px] font-bold text-zinc-900">{selected.ruleName}</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{selected.message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void handleSendEmail(selected.code)}
                    disabled={busyCode === selected.code}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"
                  >
                    <Mail size={14} /> Notifier
                  </button>
                  {selected.status === 'ACTIVE' && (
                    <button
                      onClick={() => void handleResolve(selected.code)}
                      disabled={busyCode === selected.code}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FFCB00] px-3 py-2 text-[13px] font-semibold text-zinc-900"
                    >
                      <ShieldCheck size={14} /> Resoudre
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Impact financier</p>
                  <p className="text-[16px] font-black text-zinc-900">{selected.impactAmountFcfa !== null ? formatCFA(selected.impactAmountFcfa) : 'Non chiffre'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Notification email</p>
                  <p className="text-[14px] font-semibold text-zinc-800">{selected.notificationEmailStatus || 'Non envoyee'}</p>
                  <p className="mt-1 text-[12px] text-zinc-400">{selected.notificationEmailSentAt ? formatDate(selected.notificationEmailSentAt) : 'Aucune date de notification'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Constat</p>
                  <p className="text-[13px] leading-relaxed text-zinc-700">{selected.message}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Recommandation</p>
                  <p className="text-[13px] leading-relaxed text-zinc-700">
                    {String(selected.details?.recommandation || "Verifier les pieces justificatives, rapprocher les montants et documenter la resolution.")}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Historique</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-zinc-400">Premiere detection</p>
                    <p className="text-[13px] font-semibold text-zinc-800">{formatDate(selected.firstDetectedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-400">Derniere detection</p>
                    <p className="text-[13px] font-semibold text-zinc-800">{formatDate(selected.lastDetectedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-400">Resolution</p>
                    <p className="text-[13px] font-semibold text-zinc-800">{selected.resolvedAt ? formatDate(selected.resolvedAt) : 'Toujours active'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </Layout>
  )
}
