import { useEffect, useMemo, useState } from 'react'
import { Banknote, Building2, CalendarRange, Smartphone, Wallet } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader, StatCard } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { listTransactions } from '@/services/transactionApi'
import type { PaymentMethod, PaymentStatus, TransactionListResponse, TransactionRecord } from '@/types/transaction'

type PeriodPreset = 'day' | 'week' | 'month' | 'year' | 'custom'

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
  year: 'Annee',
  custom: 'Personnalisee',
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ESPECES: 'Especes',
  CHEQUE: 'Cheque',
  MOBILE_MONEY: 'Mobile Money',
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirme',
  ECHOUE: 'Echoue',
  RECU: 'Recu',
  ENCAISSE: 'Encaisse',
  REJETE: 'Rejete',
}

const paymentStatusVariant = (status: PaymentStatus) => {
  if (status === 'CONFIRME' || status === 'ENCAISSE') return 'solde'
  if (status === 'ECHOUE' || status === 'REJETE') return 'non_solde'
  return 'attente'
}

const formatInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getPresetRange = (preset: Exclude<PeriodPreset, 'custom'>) => {
  const today = new Date()
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = new Date(end)

  if (preset === 'week') {
    const offset = (end.getDay() + 6) % 7
    start.setDate(end.getDate() - offset)
  } else if (preset === 'month') {
    start.setDate(1)
  } else if (preset === 'year') {
    start.setMonth(0, 1)
  }

  return {
    dateFrom: formatInputDate(start),
    dateTo: formatInputDate(end),
  }
}

const buildReference = (transaction: TransactionRecord) => {
  if (transaction.latestPayment.referencePaiement) return transaction.latestPayment.referencePaiement
  if (transaction.latestPayment.chequeNumero) return transaction.latestPayment.chequeNumero
  if (transaction.latestPayment.providerAttemptId) return transaction.latestPayment.providerAttemptId
  return '-'
}

export default function HistoriquePaiements() {
  const { user } = useAuth()
  const initialRange = useMemo(() => getPresetRange('day'), [])
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('day')
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom)
  const [dateTo, setDateTo] = useState(initialRange.dateTo)
  const [response, setResponse] = useState<TransactionListResponse>({
    items: [],
    total: 0,
    summary: {
      encaisseFcfa: 0,
      especesFcfa: 0,
      chequesFcfa: 0,
      momoFcfa: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const nextResponse = await listTransactions({
        search: search.trim() || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentStatus: paymentStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        pageSize: 200,
      })
      setResponse(nextResponse)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger l'historique des paiements."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistory()
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [search, paymentMethod, paymentStatus, dateFrom, dateTo])

  const applyPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset)
    if (preset === 'custom') return
    const range = getPresetRange(preset)
    setDateFrom(range.dateFrom)
    setDateTo(range.dateTo)
  }

  return (
    <Layout>
      <PageHeader
        title="Historique paiements"
        subtitle="Point de caisse par periode et par moyen de paiement"
        badge={
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
            {user?.caisse || 'Caisse active'}
          </span>
        }
        actions={<Btn variant="secondary" onClick={() => void loadHistory()} disabled={loading}>Actualiser</Btn>}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total encaisse" value={formatCFA(response.summary.encaisseFcfa)} sub="Synthese de la periode" icon={Wallet} accent />
        <StatCard label="Especes" value={formatCFA(response.summary.especesFcfa)} sub="Paiements confirmes" icon={Banknote} />
        <StatCard label="Cheques" value={formatCFA(response.summary.chequesFcfa)} sub="Recus ou encaisses" icon={Building2} />
        <StatCard label="Mobile Money" value={formatCFA(response.summary.momoFcfa)} sub="Paiements confirmes" icon={Smartphone} />
      </div>

      <Card className="mb-5">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-[13px] font-semibold transition-all ${
                  periodPreset === preset
                    ? 'border-[#FFCB00] bg-[#FFF7D1] text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <CalendarRange size={14} />
                {PERIOD_LABELS[preset]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_0.7fr]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Dossier, patient, telephone, reference..."
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
            />
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod | '')}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
            >
              <option value="">Tous moyens</option>
              <option value="ESPECES">Especes</option>
              <option value="CHEQUE">Cheque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus | '')}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
            >
              <option value="">Tous statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="CONFIRME">Confirme</option>
              <option value="ECHOUE">Echoue</option>
              <option value="RECU">Recu</option>
              <option value="ENCAISSE">Encaisse</option>
              <option value="REJETE">Rejete</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setPeriodPreset('custom')
                setDateFrom(event.target.value)
              }}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setPeriodPreset('custom')
                setDateTo(event.target.value)
              }}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Dossier</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Patient</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Moyen</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Statut paiement</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Montant encaisse</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Reference</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-zinc-400">Chargement...</td></tr>
              ) : response.items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-zinc-400">Aucun paiement trouve pour cette periode.</td></tr>
              ) : (
                response.items.map((item) => (
                  <tr key={`${item.id}-${item.latestPayment.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                    <td className="px-4 py-3 text-[12px] text-zinc-500">{formatDate(item.latestPayment.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[12px] font-black text-amber-700">{item.hospitalizationCaseId || item.visitId}</p>
                      <p className="text-[11px] text-zinc-400">{item.transactionKind}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-zinc-800">{item.patientNom}</p>
                      <p className="text-[11px] text-zinc-400">{item.patientTel}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-zinc-700">{PAYMENT_METHOD_LABELS[item.latestPayment.moyenPaiement]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge variant={paymentStatusVariant(item.latestPayment.statut)} />
                        <span className="text-[11px] font-medium text-zinc-500">{PAYMENT_STATUS_LABELS[item.latestPayment.statut]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-zinc-900">{formatCFA(item.montantEncaisseFcfa)}</td>
                    <td className="px-4 py-3 text-[12px] text-zinc-500">{buildReference(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}
