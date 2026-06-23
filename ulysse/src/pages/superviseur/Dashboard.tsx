import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Building2, FileWarning, Wallet } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, StatCard } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { listAlerts } from '@/services/alertApi'
import { listCaisses } from '@/services/caisseApi'
import { listTransactions } from '@/services/transactionApi'
import { listVisits } from '@/services/visitApi'
import { getTheoreticalVersement } from '@/services/versementApi'
import type { AlertRecord } from '@/types/alert'
import type { CaisseItem } from '@/types/caisse'
import type { TransactionSummary } from '@/types/transaction'
import type { VisitRecord } from '@/types/visit'


const today = new Date().toISOString().slice(0, 10)

const visitVariant = (status: VisitRecord['statut']) => {
  if (status === 'SOLDE') return 'solde'
  if (status === 'PARTIELLEMENT_SOLDE') return 'partiel'
  if (status === 'EN_CAISSE') return 'encaisse'
  return 'attente'
}

export default function Dashboard() {
  const [summary, setSummary] = useState<TransactionSummary>({
    encaisseFcfa: 0,
    especesFcfa: 0,
    chequesFcfa: 0,
    momoFcfa: 0,
  })
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [caisses, setCaisses] = useState<CaisseItem[]>([])
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [montantTheorique, setMontantTheorique] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [transactionsResponse, alertsResponse, caissesResponse, visitsResponse] = await Promise.all([
          listTransactions({ dateFrom: today, dateTo: today, pageSize: 200 }),
          listAlerts({ active: true }),
          listCaisses(),
          listVisits({ todayOnly: true, pageSize: 50 }),
        ])
        const activeCaisses = caissesResponse.items.filter((item) => item.actif)
        const theoreticalResponse = activeCaisses.length
          ? await getTheoreticalVersement({ date: today, caisseIds: activeCaisses.map((item) => item.id) })
          : null
        if (cancelled) return
        setSummary(transactionsResponse.summary)
        setAlerts(alertsResponse.items)
        setCaisses(activeCaisses)
        setVisits(visitsResponse.items)
        setMontantTheorique(theoreticalResponse?.montantTheoriqueFcfa || 0)
      } catch (nextError) {
        if (!cancelled) setError(getApiErrorMessage(nextError, 'Impossible de charger le tableau de bord.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const critiqueAlert = alerts.find((item) => item.gravite === 'critique')
  const counts = useMemo(
    () => ({
      critique: alerts.filter((item) => item.gravite === 'critique').length,
      haute: alerts.filter((item) => item.gravite === 'haute').length,
    }),
    [alerts]
  )

  return (
    <Layout>
      <PageHeader
        title="Tableau de bord"
        subtitle={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        badge={<span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">En direct</span>}
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      {critiqueAlert && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 text-red-600" />
            <div>
              <p className="text-[13px] font-semibold text-red-700">Alerte critique active</p>
              <p className="text-[13px] text-red-700">{critiqueAlert.ruleName} · {critiqueAlert.message}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total encaisse" value={formatCFA(summary.encaisseFcfa)} sub="Synthese des transactions du jour" icon={Wallet} accent />
        <StatCard label="Mobile Money" value={formatCFA(summary.momoFcfa)} sub="Paiements confirmes" icon={Wallet} />
        <StatCard label="Especes" value={formatCFA(summary.especesFcfa)} sub="Encaissement reel" icon={Wallet} />
        <StatCard label="Cheques" value={formatCFA(summary.chequesFcfa)} sub="Recus ou encaisses" icon={Building2} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Etat des caisses</h2>
              <p className="text-[12px] text-zinc-400">{caisses.length} caisse(s) active(s)</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-500">
              Theorique {formatCFA(montantTheorique)}
            </span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="py-10 text-center text-[13px] text-zinc-400">Chargement des caisses...</p>
            ) : caisses.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-zinc-400">Aucune caisse active.</p>
            ) : (
              caisses.map((caisse) => (
                <div key={caisse.id} className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-[14px] font-semibold text-zinc-900">{caisse.nom}</p>
                  <p className="mt-1 text-[12px] text-zinc-400">ID #{caisse.id}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Patients du jour</h2>
              <p className="text-[12px] text-zinc-400">{visits.length} dossier(s) trouves</p>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="py-10 text-center text-[13px] text-zinc-400">Chargement des dossiers...</p>
            ) : visits.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-zinc-400">Aucun dossier du jour.</p>
            ) : (
              visits.slice(0, 8).map((visit) => (
                <div key={visit.idVisite} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900">{visit.patientNomComplet}</p>
                    <p className="text-[12px] text-zinc-400">{visit.motifVisite} · {visit.serviceOriente}</p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-400">{visit.idVisite} · {formatDate(visit.createdAt)}</p>
                  </div>
                  <StatusBadge variant={visitVariant(visit.statut)} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Alertes bancaires</h2>
              <p className="text-[12px] text-zinc-400">Anomalies nommees branchees sur les donnees reelles</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-500">
              {counts.critique} critique(s) · {counts.haute} haute(s)
            </span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="py-10 text-center text-[13px] text-zinc-400">Chargement des alertes...</p>
            ) : alerts.length === 0 ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="text-[13px] font-semibold text-green-700">Aucune alerte active</p>
                <p className="mt-1 text-[12px] text-green-700">Aucune anomalie active ne remonte sur le perimetre charge.</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((item) => (
                <div key={item.code} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-black ${
                      item.gravite === 'critique'
                        ? 'bg-red-50 text-red-700'
                        : item.gravite === 'haute'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                    }`}>
                      {item.code}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">{item.ruleName}</span>
                  </div>
                  <p className="text-[13px] text-zinc-800">{item.message}</p>
                  <p className="mt-2 text-[12px] text-zinc-400">{formatDate(item.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-start gap-3">
              <FileWarning size={18} className="mt-0.5 text-zinc-500" />
              <div>
                <p className="text-[13px] font-semibold text-zinc-800">Versement theorique du jour</p>
                <p className="mt-1 font-mono text-[20px] font-black text-zinc-900">{formatCFA(montantTheorique)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
