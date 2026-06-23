import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { listTransactions } from '@/services/transactionApi'
import type { PaymentMethod, PaymentStatus, TransactionRecord, TransactionSummary } from '@/types/transaction'


const today = new Date().toISOString().slice(0, 10)

const paymentMethodLabel: Record<PaymentMethod, string> = {
  MOBILE_MONEY: 'Mobile Money',
  ESPECES: 'Especes',
  CHEQUE: 'Cheque',
}

const paymentStatusLabel: Record<PaymentStatus, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirme',
  ECHOUE: 'Echoue',
  RECU: 'Recu',
  ENCAISSE: 'Encaisse',
  REJETE: 'Rejete',
}

const transactionVariant = (transaction: TransactionRecord) => {
  if (transaction.statut === 'SOLDE') return 'solde'
  if (transaction.statut === 'PARTIELLEMENT_SOLDE') return 'partiel'
  if (transaction.statut === 'EN_ATTENTE') return 'attente'
  return 'verrouille'
}

const paymentChip = (payment: TransactionRecord['latestPayment']) => {
  if (payment.moyenPaiement === 'MOBILE_MONEY') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (payment.moyenPaiement === 'ESPECES') return 'bg-green-50 text-green-700 border border-green-200'
  return 'bg-blue-50 text-blue-700 border border-blue-200'
}

export default function Historique() {
  const [items, setItems] = useState<TransactionRecord[]>([])
  const [summary, setSummary] = useState<TransactionSummary>({
    encaisseFcfa: 0,
    especesFcfa: 0,
    chequesFcfa: 0,
    momoFcfa: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await listTransactions({
          search: search.trim() || undefined,
          paymentMethod: paymentMethod || undefined,
          paymentStatus: paymentStatus || undefined,
          dateFrom,
          dateTo,
          pageSize: 200,
        })
        if (cancelled) return
        setItems(response.items)
        setSummary(response.summary)
      } catch (nextError) {
        if (cancelled) return
        setError(getApiErrorMessage(nextError, "Impossible de charger l'historique des transactions."))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [dateFrom, dateTo, paymentMethod, paymentStatus, search])

  return (
    <Layout>
      <PageHeader
        title="Historique des transactions"
        subtitle="Journal reel des encaissements de votre caisse"
        actions={(
          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total encaisse</p>
              <p className="font-mono text-[20px] font-black text-zinc-900">{formatCFA(summary.encaisseFcfa)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Especes / Cheques</p>
              <p className="font-mono text-[16px] font-black text-zinc-900">
                {formatCFA(summary.especesFcfa)} / {formatCFA(summary.chequesFcfa)}
              </p>
            </div>
          </div>
        )}
      />

      <Card className="mb-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="VIS, patient, telephone..."
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
          />
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod | '')}
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
          >
            <option value="">Tous les modes</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="ESPECES">Especes</option>
            <option value="CHEQUE">Cheque</option>
          </select>
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus | '')}
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="CONFIRME">Confirme</option>
            <option value="RECU">Cheque recu</option>
            <option value="ENCAISSE">Cheque encaisse</option>
            <option value="REJETE">Cheque rejete</option>
            <option value="EN_ATTENTE">Mobile Money en attente</option>
            <option value="ECHOUE">Paiement echoue</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white"
          />
        </div>
      </Card>

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Dossier</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Patient</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Mode</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Statut paiement</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Statut dossier</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Montant</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Reference</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-zinc-400">
                    Chargement des transactions...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-zinc-400">
                    Aucune transaction ne correspond a ces filtres.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono text-[12px] font-black text-amber-700">{item.visitId}</p>
                        <p className="text-[11px] text-zinc-400">TX-{item.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-800">{item.patientNom}</p>
                        <p className="text-[11px] text-zinc-400">{item.patientTel}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentChip(item.latestPayment)}`}>
                        {paymentMethodLabel[item.latestPayment.moyenPaiement]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold text-zinc-700">
                        {paymentStatusLabel[item.latestPayment.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={transactionVariant(item)} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-zinc-900">
                      {formatCFA(item.montantEncaisseFcfa)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-zinc-500">
                        {item.latestPayment.referencePaiement || item.latestPayment.chequeNumero || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-zinc-500">{formatDate(item.createdAt)}</td>
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
