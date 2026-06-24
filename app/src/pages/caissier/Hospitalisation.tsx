import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { PaymentTabs, type PaymentSubmission } from '@/components/shared/PaymentTabs'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { openInvoicePdf } from '@/services/invoiceApi'
import {
  getHospitalization,
  listHospitalizations,
  prepareFinalPayment,
  prepareIntermediatePayment,
} from '@/services/hospitalizationApi'
import { createTransaction } from '@/services/transactionApi'
import type { HospitalizationCase, HospitalizationPreparedPayment } from '@/types/hospitalization'
import type { TransactionRecord } from '@/types/transaction'


export default function HospitalisationCaissier() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HospitalizationCase[]>([])
  const [selectedCase, setSelectedCase] = useState<HospitalizationCase | null>(null)
  const [preparedPayment, setPreparedPayment] = useState<HospitalizationPreparedPayment | null>(null)
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCase = async (caseNumber: string) => {
    setLoading(true)
    setError('')
    try {
      const detailed = await getHospitalization(caseNumber)
      setSelectedCase(detailed)
      setTransaction(null)
      try {
        const prepared = detailed.dischargeMedicalAt
          ? await prepareFinalPayment(caseNumber)
          : await prepareIntermediatePayment(caseNumber)
        setPreparedPayment(prepared)
      } catch (prepareError) {
        setPreparedPayment(null)
        setError(getApiErrorMessage(prepareError, "Aucun montant exigible n'est pret pour la caisse."))
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger ce sejour d'hospitalisation."))
    } finally {
      setLoading(false)
    }
  }

  const search = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    try {
      const response = await listHospitalizations(query.trim())
      if (response.items.length === 0) {
        setError('Aucun sejour hospitalisation ne correspond a cette recherche.')
      } else if (response.items.length === 1) {
        await loadCase(response.items[0].caseNumber)
      } else {
        setResults(response.items)
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Recherche hospitalisation indisponible.'))
    } finally {
      setLoading(false)
    }
  }

  const submitPayment = async (submission: PaymentSubmission) => {
    if (!selectedCase || !preparedPayment) return
    setLoading(true)
    setError('')
    try {
      const created = await createTransaction({
        hospitalizationCaseNumber: selectedCase.caseNumber,
        transactionKind: preparedPayment.transactionKind,
        lines: preparedPayment.charges.map((charge) => ({
          catalogueItemId: -charge.id,
          hospitalizationChargeId: charge.id,
          quantite: 1,
          payable: true,
        })),
        payment:
          submission.method === 'especes'
            ? { moyenPaiement: 'ESPECES', montantRecuFcfa: submission.montantRecuFcfa }
            : submission.method === 'momo'
              ? { moyenPaiement: 'MOBILE_MONEY', telephonePaiement: submission.telephonePaiement }
              : {
                  moyenPaiement: 'CHEQUE',
                  chequeNumero: submission.chequeNumero,
                  chequeBanque: submission.chequeBanque,
                  chequeTitulaire: submission.chequeTitulaire,
                },
      })
      setTransaction(created)
      await loadCase(selectedCase.caseNumber)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'enregistrer ce paiement d'hospitalisation."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Hospitalisation caisse"
        subtitle="Reglement intermediaire et final des sejours patients"
        actions={(
          <form onSubmit={search} className="flex gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="HOSP, VIS, patient..."
              className="h-9 w-64 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none focus:border-[#FFCB00]"
            />
            <Btn variant="secondary" type="submit" disabled={loading}>Charger</Btn>
          </form>
        )}
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      {results.length > 1 && (
        <Card className="mb-5">
          <p className="mb-3 text-[14px] font-bold text-zinc-900">Plusieurs sejours trouves</p>
          <div className="space-y-2">
            {results.map((item) => (
              <button key={item.caseNumber} type="button" onClick={() => void loadCase(item.caseNumber)} className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-900">{item.patientNom}</p>
                  <p className="text-[11px] text-zinc-500">{item.caseNumber} · {item.patientTel}</p>
                </div>
                <span className="font-mono text-[11px] font-bold text-amber-700">{formatCFA(item.clearance.resteAPayerFcfa)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          {!selectedCase ? (
            <p className="text-[13px] text-zinc-400">Recherchez un sejour hospitalisation pour commencer.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[12px] font-bold text-amber-700">{selectedCase.caseNumber} · {selectedCase.visitId}</p>
                  <h2 className="mt-1 text-[22px] font-bold text-zinc-900">{selectedCase.patientNom}</h2>
                  <p className="mt-1 text-[13px] text-zinc-500">{selectedCase.patientTel} · {selectedCase.serviceOriente}</p>
                  <p className="mt-1 text-[12px] text-zinc-400">Admission {formatDate(selectedCase.admissionAt)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total</p>
                    <p className="font-mono text-[18px] font-black text-zinc-900">{formatCFA(selectedCase.clearance.totalCumuleFcfa)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Paye</p>
                    <p className="font-mono text-[18px] font-black text-emerald-700">{formatCFA(selectedCase.clearance.totalPayeFcfa)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Reste</p>
                    <p className="font-mono text-[18px] font-black text-red-600">{formatCFA(selectedCase.clearance.resteAPayerFcfa)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-zinc-400">Demande preparee</p>
                    <p className="mt-1 text-[13px] text-zinc-600">
                      {preparedPayment
                        ? preparedPayment.transactionKind === 'HOSPITALIZATION_FINAL'
                          ? 'Reglement final'
                          : 'Reglement intermediaire'
                        : 'Aucun montant prepare pour le moment'}
                    </p>
                  </div>
                  {preparedPayment && (
                    <p className="font-mono text-[22px] font-black text-zinc-900">{formatCFA(preparedPayment.montantTotalFcfa)}</p>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {(preparedPayment?.charges ?? []).length === 0 ? (
                    <p className="text-[12px] text-zinc-400">Aucun frais exigible a date.</p>
                  ) : (
                    preparedPayment!.charges.map((charge) => (
                      <div key={charge.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-900">{charge.label}</p>
                          <p className="text-[11px] text-zinc-500">{charge.codeReference}</p>
                        </div>
                        <span className="font-mono text-[12px] font-bold text-zinc-900">{formatCFA(charge.montantFcfa)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {transaction && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[12px] font-semibold text-emerald-700">Dernier encaissement enregistre</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="font-mono text-[18px] font-black text-zinc-900">{formatCFA(transaction.montantEncaisseFcfa)}</p>
                    {transaction.invoiceNumber && (
                      <Btn variant="secondary" onClick={() => void openInvoicePdf(transaction.invoiceNumber!)}>
                        Voir la facture
                      </Btn>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          {!selectedCase || !preparedPayment ? (
            <p className="text-[13px] text-zinc-400">La caisse attend une demande de reglement preparee.</p>
          ) : (
            <PaymentTabs
              montant={preparedPayment.montantTotalFcfa}
              telephone={selectedCase.patientTel}
              submitting={loading}
              onSubmit={submitPayment}
            />
          )}
        </Card>
      </div>
    </Layout>
  )
}
