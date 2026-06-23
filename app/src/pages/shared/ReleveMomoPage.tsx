import { useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { exportReport, getMobileMoneyAudit } from '@/services/reportApi'
import type { MobileMoneyAuditLine } from '@/types/report'


export function ReleveMomoPage() {
  const [items, setItems] = useState<MobileMoneyAuditLine[]>([])
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        setItems(await getMobileMoneyAudit({ period, consolidated: true }))
      } catch (nextError) {
        setError(getApiErrorMessage(nextError, "Impossible de charger le releve d'audit Mobile Money."))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [period])

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const blob = await exportReport(format, { reportType: 'mobile-money-audit', period, consolidated: true })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `releve-mobile-money.${format}`
      link.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'exporter le releve Mobile Money."))
    }
  }

  return (
    <Layout>
      <PageHeader title="Releve Mobile Money" subtitle="Controle de coherence entre les transactions locales et les etats FedaPay." />

      {error && <Card className="mb-5 border border-red-200 bg-red-50"><p className="text-[13px] text-red-600">{error}</p></Card>}

      <div className="mb-5 flex flex-wrap gap-2">
        <select value={period} onChange={(event) => setPeriod(event.target.value as 'day' | 'week' | 'month')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]">
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
        </select>
        <button onClick={() => void handleExport('pdf')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"><Download size={14} /> PDF</button>
        <button onClick={() => void handleExport('csv')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[13px] font-semibold text-zinc-700"><Download size={14} /> CSV</button>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50"><Smartphone size={18} className="text-zinc-600" /></div>
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900">{items.length} ligne(s) auditees</h2>
            <p className="text-[12px] text-zinc-400">Verdict de coherence et observations de controle.</p>
          </div>
        </div>
        <div className="space-y-3">
          {loading ? (
            <p className="py-10 text-center text-[13px] text-zinc-400">Chargement du releve...</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-zinc-400">Aucune tentative Mobile Money pour cette periode.</p>
          ) : (
            items.map((item) => (
              <div key={`${item.transactionId}-${item.providerAttemptId || 'none'}`} className="rounded-2xl border border-zinc-200 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-900">{item.idVisite}</p>
                    <p className="text-[12px] text-zinc-400">{item.providerAttemptId || 'Non transmis'} · {item.providerStatus || '-'}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.verdict === 'coherent' ? 'bg-green-50 text-green-700' : item.verdict === 'en_attente_reseau' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {item.verdict}
                  </span>
                </div>
                <p className="text-[13px] text-zinc-700">{item.observation}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">Attendu: <span className="font-mono font-semibold text-zinc-900">{formatCFA(item.montantAttenduFcfa)}</span></div>
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">Provider: <span className="font-mono font-semibold text-zinc-900">{item.montantProviderFcfa !== null ? formatCFA(item.montantProviderFcfa) : '-'}</span></div>
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">Date: <span className="font-semibold text-zinc-900">{formatDate(item.createdAt)}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </Layout>
  )
}
