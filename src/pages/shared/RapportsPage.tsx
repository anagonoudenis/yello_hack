import { useEffect, useState } from 'react'
import { BarChart3, Download, FileText, Wallet } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { formatCFA } from '@/lib/formatCFA'
import { getApiErrorMessage } from '@/lib/apiError'
import { listCaisses } from '@/services/caisseApi'
import { exportReport, getPaymentBreakdown, getReportSummary } from '@/services/reportApi'
import type { CaisseItem } from '@/types/caisse'
import type { PaymentBreakdownLine, ReportSummary } from '@/types/report'


export function RapportsPage({ role }: { role: 'superviseur' | 'admin' }) {
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [breakdown, setBreakdown] = useState<PaymentBreakdownLine[]>([])
  const [caisses, setCaisses] = useState<CaisseItem[]>([])
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [caisseId, setCaisseId] = useState<number | ''>('')
  const [consolidated, setConsolidated] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, breakdownData, caissesResponse] = await Promise.all([
        getReportSummary({ period, caisseId: caisseId || undefined, consolidated }),
        getPaymentBreakdown({ period, caisseId: caisseId || undefined, consolidated }),
        listCaisses(),
      ])
      setSummary(summaryData)
      setBreakdown(breakdownData)
      setCaisses(caissesResponse.items)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Impossible de charger les rapports consolides.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [period, caisseId, consolidated])

  const handleExport = async (reportType: Parameters<typeof exportReport>[1]['reportType'], format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const blob = await exportReport(format, { reportType, period, caisseId: caisseId || undefined, consolidated })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}.${format}`
      link.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'exporter le rapport demande."))
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Rapports d'audit"
        subtitle={role === 'admin' ? "Exports et syntheses d'administration." : 'Syntheses comptables, vues consolidees et exports de controle.'}
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        <select value={period} onChange={(event) => setPeriod(event.target.value as 'day' | 'week' | 'month' | 'year')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]">
          <option value="day">Journalier</option>
          <option value="week">Hebdomadaire</option>
          <option value="month">Mensuel</option>
          <option value="year">Annuel</option>
        </select>
        <select value={caisseId} onChange={(event) => setCaisseId(event.target.value ? Number(event.target.value) : '')} disabled={consolidated} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] disabled:opacity-50">
          <option value="">Toutes les caisses</option>
          {caisses.map((caisse) => <option key={caisse.id} value={caisse.id}>{caisse.nom}</option>)}
        </select>
        <button onClick={() => setConsolidated((value) => !value)} className={`rounded-xl px-3 py-2 text-[13px] font-semibold ${consolidated ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-700'}`}>
          {consolidated ? 'Vue consolidee' : 'Vue par caisse'}
        </button>
        <button onClick={() => void handleExport('summary', 'pdf')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"><Download size={14} /> Synthese PDF</button>
        <button onClick={() => void handleExport('payment-breakdown', 'xlsx')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"><Download size={14} /> Ventilation XLSX</button>
        <button onClick={() => void handleExport('alerts-detailed', 'pdf')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"><Download size={14} /> Anomalies PDF</button>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Encaisse</p>
          <p className="mt-2 text-[26px] font-black text-zinc-900">{formatCFA(summary?.totals.encaisseFcfa || 0)}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Especes</p>
          <p className="mt-2 text-[26px] font-black text-green-700">{formatCFA(summary?.totals.especesFcfa || 0)}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Cheques</p>
          <p className="mt-2 text-[26px] font-black text-amber-700">{formatCFA(summary?.totals.chequesFcfa || 0)}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Mobile Money</p>
          <p className="mt-2 text-[26px] font-black text-blue-700">{formatCFA(summary?.totals.mobileMoneyFcfa || 0)}</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50"><BarChart3 size={18} className="text-zinc-600" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Ventilation des paiements</h2>
              <p className="text-[12px] text-zinc-400">Lecture par mode et statut sur la periode selectionnee.</p>
            </div>
          </div>
          {loading ? (
            <p className="py-12 text-center text-[13px] text-zinc-400">Chargement des agrégats...</p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((line) => (
                <div key={`${line.moyenPaiement}-${line.statut}`} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-zinc-900">{line.moyenPaiement}</p>
                      <p className="text-[12px] text-zinc-400">{line.statut} · {line.count} operation(s)</p>
                    </div>
                    <p className="font-mono text-[16px] font-black text-zinc-900">{formatCFA(line.totalFcfa)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50"><FileText size={18} className="text-zinc-600" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Conclusion de synthese</h2>
              <p className="text-[12px] text-zinc-400">Formulation courte de controle et comptabilite.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-[14px] leading-relaxed text-zinc-700">{summary?.conclusion || "Aucune conclusion disponible."}</p>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Dossiers suivis</p>
              <p className="mt-2 text-[22px] font-black text-zinc-900">{summary?.totals.visitsTotal || 0}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Anomalies relevees</p>
              <p className="mt-2 text-[22px] font-black text-zinc-900">{summary?.totals.alertsTotal || 0}</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
