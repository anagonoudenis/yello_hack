import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { getDossierDetail } from '@/services/transactionApi'
import type { DossierDetailRecord } from '@/types/transaction'

const workflowStatusVariant = (status: string) => {
  if (status === 'SOLDE' || status === 'CLOSED') return 'solde'
  if (status === 'PARTIELLEMENT_SOLDE' || status === 'PENDING_EXIT') return 'partiel'
  if (status === 'EN_CAISSE' || status === 'OPEN') return 'encaisse'
  return 'attente'
}

const financialStatusVariant = (status: DossierDetailRecord['financialStatus']) => {
  if (status === 'SOLDE') return 'solde'
  if (status === 'TENTATIVE_NON_ABOUTIE') return 'tentative'
  return 'non_solde'
}

const hospitalizationOriginLabel = (origin?: string | null) => {
  if (origin === 'SYSTEM_BED_DAY') return 'Frais sejour'
  if (origin === 'RECOUVREMENT') return 'Ajout recouvrement'
  if (origin === 'CASHIER') return 'Ajout caisse'
  return null
}

export default function HistoriqueDetail() {
  const navigate = useNavigate()
  const { dossierId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const querySearch = searchParams.get('q') ?? ''
  const [detail, setDetail] = useState<DossierDetailRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backHref = querySearch ? `/caissier/historique/dossiers?q=${encodeURIComponent(querySearch)}` : '/caissier/historique/dossiers'

  const loadDetail = async () => {
    if (!dossierId) {
      setError('Dossier introuvable.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const nextDetail = await getDossierDetail(dossierId)
      setDetail(nextDetail)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Detail dossier indisponible.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDetail()
  }, [dossierId])

  return (
    <Layout>
      <PageHeader
        title="Detail dossier"
        subtitle="Lecture complete du dossier, des paiements et du reste reel a regler"
        actions={
          <>
            <Btn variant="ghost" onClick={() => navigate(backHref)}>
              Retour a la liste
            </Btn>
            <Btn variant="secondary" onClick={() => void loadDetail()} disabled={loading}>
              Actualiser
            </Btn>
          </>
        }
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card>
          <p className="text-[13px] text-zinc-400">Chargement du detail...</p>
        </Card>
      ) : !detail ? (
        <Card>
          <p className="text-[13px] text-zinc-400">Aucun detail disponible pour ce dossier.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="font-mono text-[12px] font-black text-amber-700">{detail.dossierId}</p>
                  <h2 className="mt-1 text-[24px] font-bold text-zinc-900">{detail.patientNom}</h2>
                  <p className="mt-1 text-[13px] text-zinc-500">{detail.patientTel} - {detail.dossierType}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant={workflowStatusVariant(detail.statut)} />
                  <StatusBadge variant={financialStatusVariant(detail.financialStatus)} />
                  <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    {detail.visitId}
                  </span>
                </div>
                {detail.prochainJalonAt && (
                  <p className="text-[12px] font-medium text-amber-700">Prochain jalon {formatDate(detail.prochainJalonAt)}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total du dossier</p>
                  <p className="mt-2 font-mono text-[18px] font-black text-zinc-900">{formatCFA(detail.montantTotalFcfa)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total paye</p>
                  <p className="mt-2 font-mono text-[18px] font-black text-emerald-700">{formatCFA(detail.montantTotalPayeFcfa)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Reste reel</p>
                  <p className="mt-2 font-mono text-[18px] font-black text-red-600">{formatCFA(detail.montantRestantFcfa)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Statut dossier</p>
                <div className="mt-3">
                  <StatusBadge variant={workflowStatusVariant(detail.statut)} />
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Statut financier</p>
                <div className="mt-3">
                  <StatusBadge variant={financialStatusVariant(detail.financialStatus)} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-[16px] font-bold text-zinc-900">Historique des transactions</h3>
              <p className="text-[12px] text-zinc-400">Toutes les tentatives et encaissements lies a ce dossier.</p>
            </div>

            <div className="space-y-3">
              {detail.transactions.length === 0 ? (
                <p className="text-[12px] text-zinc-400">Aucune transaction.</p>
              ) : (
                detail.transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-mono text-[12px] font-bold text-zinc-700">TX-{transaction.id}</p>
                        <p className="mt-1 text-[12px] font-semibold text-zinc-800">{transaction.transactionKind}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">{formatDate(transaction.createdAt)}</p>
                      </div>

                      <div className="grid gap-2 text-[12px] text-zinc-600 sm:min-w-[260px]">
                        <div className="flex items-center justify-between gap-3">
                          <span>Montant encaisse</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCFA(transaction.montantEncaisseFcfa)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Moyen</span>
                          <span className="font-semibold text-zinc-800">{transaction.latestPayment.moyenPaiement}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Statut paiement</span>
                          <span className="font-semibold text-zinc-800">{transaction.latestPayment.statut}</span>
                        </div>
                        {transaction.latestPayment.referencePaiement && (
                          <div className="flex items-center justify-between gap-3">
                            <span>Reference</span>
                            <span className="font-mono font-semibold text-zinc-800">{transaction.latestPayment.referencePaiement}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {transaction.lines.map((line) => {
                        const originLabel =
                          hospitalizationOriginLabel(line.hospitalizationChargeOrigin) ??
                          (transaction.sourceType === 'HOSPITALIZATION' && !line.hospitalizationChargeId ? 'Ajout caisse' : null)

                        return (
                          <div key={`${transaction.id}-${line.id}`} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-semibold text-zinc-900">{line.nom}</p>
                                {originLabel && (
                                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                                    {originLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500">
                                {line.codeElement} - Qte {line.quantite} - {line.type} - {line.service}
                              </p>
                            </div>
                            <span className="font-mono text-[12px] font-bold text-zinc-900">{formatCFA(line.montantLigneFcfa)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-[16px] font-bold text-zinc-900">Tentatives non dues</h3>
              <p className="text-[12px] text-zinc-400">Tentatives non finalisees qui ne creent pas de dette client tant que rien n'a ete delivre.</p>
            </div>

            <div className="space-y-3">
              {detail.nonDueAttempts.length === 0 ? (
                <p className="text-[12px] text-zinc-400">Aucune tentative non due.</p>
              ) : (
                detail.nonDueAttempts.map((attempt) => (
                  <div key={`${attempt.transactionId}-${attempt.createdAt}`} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-mono text-[12px] font-bold text-zinc-700">TX-{attempt.transactionId}</p>
                        <p className="mt-1 text-[12px] text-zinc-500">{formatDate(attempt.createdAt)}</p>
                      </div>

                      <div className="grid gap-2 text-[12px] text-zinc-600 sm:min-w-[280px]">
                        <div className="flex items-center justify-between gap-3">
                          <span>Mode</span>
                          <span className="font-semibold text-zinc-800">{attempt.paymentMethod}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Statut</span>
                          <span className="font-semibold text-zinc-800">{attempt.paymentStatus}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Montant tente</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCFA(attempt.montantTenteFcfa)}</span>
                        </div>
                        {attempt.providerStatus && (
                          <div className="flex items-center justify-between gap-3">
                            <span>Statut provider</span>
                            <span className="font-semibold text-zinc-800">{attempt.providerStatus}</span>
                          </div>
                        )}
                        {attempt.providerErrorCode && (
                          <div className="flex items-center justify-between gap-3">
                            <span>Code erreur</span>
                            <span className="font-mono font-semibold text-red-600">{attempt.providerErrorCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {attempt.lines.map((line) => (
                        <div key={`${attempt.transactionId}-${line.codeReference}-${line.label}`} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[13px] font-semibold text-zinc-900">{line.label}</p>
                            <p className="text-[11px] text-zinc-500">{line.codeReference} - Qte {line.quantite}</p>
                          </div>
                          <span className="font-mono text-[12px] font-bold text-zinc-900">{formatCFA(line.montantFcfa)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-[16px] font-bold text-zinc-900">Frais non encore regles</h3>
              <p className="text-[12px] text-zinc-400">Vue directe sur les frais restant a couvrir pour ce dossier.</p>
            </div>

            <div className="space-y-2">
              {detail.chargesNonReglees.length === 0 ? (
                <p className="text-[12px] text-zinc-400">Aucun frais restant.</p>
              ) : (
                detail.chargesNonReglees.map((charge) => (
                  <div key={`${charge.id}-${charge.codeReference}`} className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-zinc-900">{charge.label}</p>
                        {hospitalizationOriginLabel(charge.origin) && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                            {hospitalizationOriginLabel(charge.origin)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {charge.codeReference}
                        {charge.chargeDate ? ` - ${charge.chargeDate}` : ''}
                        {charge.quantite > 1 ? ` - Qte ${charge.quantite}` : ''}
                      </p>
                    </div>
                    <span className="font-mono text-[12px] font-bold text-red-600">{formatCFA(charge.montantFcfa)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
