import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Loader2, Minus, Plus, Search, ShoppingCart, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { PaymentTabs, type PaymentSubmission } from '@/components/shared/PaymentTabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useNotification } from '@/context/NotificationContext'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { deduceOperatorFromPhone } from '@/lib/paymentOperators'
import { cn } from '@/lib/utils'
import { listCatalogue } from '@/services/catalogueApi'
import { openInvoicePdf } from '@/services/invoiceApi'
import {
  createTransaction,
  getTransactionByVisit,
  refreshTransactionProviderStatus,
} from '@/services/transactionApi'
import { listVisits, openCashierVisit } from '@/services/visitApi'
import type { CatalogueItem } from '@/types/catalogue'
import type { TransactionDraftLine, TransactionRecord } from '@/types/transaction'
import type { VisitRecord } from '@/types/visit'


const statusToVariant = (status: VisitRecord['statut']) => {
  if (status === 'SOLDE') return 'solde'
  if (status === 'PARTIELLEMENT_SOLDE') return 'partiel'
  if (status === 'EN_CAISSE') return 'encaisse'
  return 'attente'
}

const isFinalVisitStatus = (status: VisitRecord['statut']) =>
  status === 'SOLDE' || status === 'PARTIELLEMENT_SOLDE'

const isFinalTransactionStatus = (status: TransactionRecord['statut']) =>
  status === 'SOLDE' || status === 'PARTIELLEMENT_SOLDE'

const MOBILE_MONEY_REFRESH_INTERVAL_MS = 20_000

const toVisitStatus = (
  transactionStatus: TransactionRecord['statut'],
  fallbackStatus: VisitRecord['statut']
): VisitRecord['statut'] => {
  if (transactionStatus === 'SOLDE' || transactionStatus === 'PARTIELLEMENT_SOLDE') return transactionStatus
  if (transactionStatus === 'EN_ATTENTE' || transactionStatus === 'ECHOUE') return 'EN_CAISSE'
  return fallbackStatus
}

const toDraftLine = (item: CatalogueItem): TransactionDraftLine => ({
  catalogueItemId: item.id,
  codeElement: item.codeElement,
  nom: item.nom,
  type: item.type,
  service: item.service,
  quantite: 1,
  prixUnitaireFcfa: item.montantFcfa,
  montantLigneFcfa: item.montantFcfa,
  payable: true,
  motifNonHonore: '',
})

const transactionLineToDraft = (line: TransactionRecord['lines'][number]): TransactionDraftLine => ({
  catalogueItemId: line.catalogueItemId,
  codeElement: line.codeElement,
  nom: line.nom,
  type: line.type,
  service: line.service,
  quantite: line.quantite,
  prixUnitaireFcfa: line.prixUnitaireFcfa,
  montantLigneFcfa: line.montantLigneFcfa,
  payable: line.payable,
  motifNonHonore: line.motifNonHonore ?? '',
})

const describeProviderFailure = (payment: TransactionRecord['latestPayment']) => {
  switch (payment.providerErrorCode) {
    case 'INSUFFICIENT_FUND_ERROR':
      return 'Fonds insuffisants sur le wallet du patient.'
    case 'API_ERROR':
      return "Refus ou erreur technique remontee par l'operateur Mobile Money."
    default:
      return 'Le provider a refuse ou annule cette tentative de paiement.'
  }
}

export default function Encaissement() {
  const { toast } = useNotification()
  const [query, setQuery] = useState('')
  const [dossier, setDossier] = useState<VisitRecord | null>(null)
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)
  const [lignes, setLignes] = useState<TransactionDraftLine[]>([])
  const [showCat, setShowCat] = useState(false)
  const [catQuery, setCatQuery] = useState('')
  const [catItems, setCatItems] = useState<CatalogueItem[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState<VisitRecord[]>([])
  const [openingIdVisite, setOpeningIdVisite] = useState<string | null>(null)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [refreshingTransaction, setRefreshingTransaction] = useState(false)
  const [openingInvoicePdf, setOpeningInvoicePdf] = useState(false)

  const latestPayment = transaction?.latestPayment ?? null
  const editableFailedTransaction = transaction?.canReopenInCashier ?? false
  const readOnlyMode = transaction !== null && !editableFailedTransaction
  const lockedWithoutTransaction = dossier !== null && transaction === null && isFinalVisitStatus(dossier.statut)
  const payableLines = lignes.filter((line) => line.payable)
  const nonPayableLines = lignes.filter((line) => !line.payable)
  const montantTotal = lignes.reduce((sum, line) => sum + line.montantLigneFcfa, 0)
  const montantEncaisse = payableLines.reduce((sum, line) => sum + line.montantLigneFcfa, 0)
  const montantNonHonore = nonPayableLines.reduce((sum, line) => sum + line.montantLigneFcfa, 0)
  const canSubmit = lignes.length > 0 && payableLines.length > 0 && nonPayableLines.every((line) => line.motifNonHonore.trim().length > 0)
  const dossierOperatorCode = dossier ? deduceOperatorFromPhone(dossier.patientTel) : null
  const isPendingMobileMoney = latestPayment?.moyenPaiement === 'MOBILE_MONEY' && latestPayment.statut === 'EN_ATTENTE'
  const isQueuedOffline =
    latestPayment?.moyenPaiement === 'MOBILE_MONEY' &&
    latestPayment.statut === 'EN_ATTENTE' &&
    latestPayment.providerStatus === 'queued_offline'
  const isFailedMobileMoney = editableFailedTransaction && latestPayment?.moyenPaiement === 'MOBILE_MONEY' && latestPayment.statut === 'ECHOUE'
  const paymentPhoneDefault =
    latestPayment?.moyenPaiement === 'MOBILE_MONEY' && editableFailedTransaction
      ? latestPayment.telephonePaiement ?? dossier?.patientTel ?? ''
      : dossier?.patientTel ?? ''

  const applyTransactionState = (next: TransactionRecord, visitFallback?: VisitRecord | null) => {
    setTransaction(next)
    setLignes(next.lines.map(transactionLineToDraft))
    setDossier((current) => {
      const baseVisit = visitFallback ?? current
      if (!baseVisit) return current
      return {
        ...baseVisit,
        statut: toVisitStatus(next.statut, baseVisit.statut),
      }
    })
  }

  useEffect(() => {
    if (!showCat || readOnlyMode) return
    const timeoutId = window.setTimeout(async () => {
      setCatLoading(true)
      setCatError('')
      try {
        const res = await listCatalogue({ search: catQuery, actif: true, pageSize: 25 })
        setCatItems(res.items)
      } catch (error) {
        setCatError(getApiErrorMessage(error, 'Catalogue indisponible. Verifiez le backend.'))
      } finally {
        setCatLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [showCat, catQuery, readOnlyMode])

  useEffect(() => {
    if (!transaction || !isPendingMobileMoney || refreshingTransaction) return
    const timeoutId = window.setTimeout(() => {
      void refreshProviderState(true)
    }, MOBILE_MONEY_REFRESH_INTERVAL_MS)
    return () => window.clearTimeout(timeoutId)
  }, [transaction, isPendingMobileMoney, refreshingTransaction])

  const resetCurrentDossier = () => {
    setDossier(null)
    setTransaction(null)
    setLignes([])
    setQuery('')
    setSearchResults([])
    setSearchError('')
    setShowCat(false)
    setCatQuery('')
  }

  const toggleLine = (catalogueItemId: number) => {
    if (readOnlyMode) return
    setLignes((current) => current.map((line) => (
      line.catalogueItemId === catalogueItemId
        ? { ...line, payable: !line.payable, motifNonHonore: '' }
        : line
    )))
  }

  const setMotif = (catalogueItemId: number, motifNonHonore: string) => {
    if (readOnlyMode) return
    setLignes((current) => current.map((line) => (
      line.catalogueItemId === catalogueItemId ? { ...line, motifNonHonore } : line
    )))
  }

  const updateQuantity = (catalogueItemId: number, nextQuantity: number) => {
    if (readOnlyMode) return
    const quantite = Math.max(1, nextQuantity)
    setLignes((current) => current.map((line) => (
      line.catalogueItemId === catalogueItemId
        ? { ...line, quantite, montantLigneFcfa: quantite * line.prixUnitaireFcfa }
        : line
    )))
  }

  const removeLine = (catalogueItemId: number) => {
    if (readOnlyMode) return
    setLignes((current) => current.filter((line) => line.catalogueItemId !== catalogueItemId))
  }

  const addItem = (item: CatalogueItem) => {
    if (readOnlyMode) return
    setLignes((current) => {
      const existing = current.find((line) => line.catalogueItemId === item.id)
      if (existing) {
        return current.map((line) => (
          line.catalogueItemId === item.id
            ? {
                ...line,
                quantite: line.quantite + 1,
                montantLigneFcfa: (line.quantite + 1) * line.prixUnitaireFcfa,
              }
            : line
        ))
      }
      return [...current, toDraftLine(item)]
    })
    setShowCat(false)
  }

  const loadExistingTransaction = async (visit: VisitRecord) => {
    try {
      const existing = await getTransactionByVisit(visit.idVisite)
      applyTransactionState(existing, visit)
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setTransaction(null)
        setLignes([])
        setDossier(visit)
        if (isFinalVisitStatus(visit.statut)) {
          setSearchError("Ce dossier est deja finalise, mais le detail d'encaissement est introuvable.")
        }
        return false
      }
      throw error
    }
  }

  const loadVisit = async (visit: VisitRecord) => {
    setOpeningIdVisite(visit.idVisite)
    setSearchError('')
    try {
      const opened = await openCashierVisit(visit.idVisite)
      const hasExistingTransaction = await loadExistingTransaction(opened)
      if (!hasExistingTransaction) {
        setDossier(opened)
      }
      setSearchResults([])
      setQuery('')
      setCatQuery('')
      toast('info', 'Dossier charge', `${opened.idVisite} · ${opened.patientNomComplet}`)
    } catch (error) {
      setSearchError(getApiErrorMessage(error, "Impossible d'ouvrir ce dossier en caisse."))
    } finally {
      setOpeningIdVisite(null)
    }
  }

  const search = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    setSearchLoading(true)
    setSearchError('')
    setSearchResults([])
    try {
      const res = await listVisits({ search: query.trim(), pageSize: 10 })
      if (res.items.length === 0) {
        setSearchError('Aucun dossier trouve pour cette recherche.')
      } else if (res.items.length === 1) {
        await loadVisit(res.items[0])
      } else {
        setSearchResults(res.items)
      }
    } catch (error) {
      setSearchError(getApiErrorMessage(error, 'Recherche indisponible. Verifiez le backend.'))
    } finally {
      setSearchLoading(false)
    }
  }

  const refreshProviderState = async (silent = false) => {
    if (!transaction) return
    setRefreshingTransaction(true)
    if (!silent) setSearchError('')
    try {
      const refreshed = await refreshTransactionProviderStatus(transaction.id)
      const previousPayment = transaction.latestPayment
      applyTransactionState(refreshed)

      if (previousPayment?.statut !== refreshed.latestPayment.statut) {
        if (refreshed.latestPayment.statut === 'CONFIRME') {
          toast('success', 'Paiement confirme', `${refreshed.visitId} · ${formatCFA(refreshed.montantEncaisseFcfa)}`)
        } else if (refreshed.latestPayment.statut === 'ECHOUE') {
          toast('warning', 'Paiement echoue', describeProviderFailure(refreshed.latestPayment))
        }
      }
    } catch (error) {
      if (!silent) {
        setSearchError(getApiErrorMessage(error, "Impossible de verifier l'etat du paiement Mobile Money."))
      }
    } finally {
      setRefreshingTransaction(false)
    }
  }

  const submitTransaction = async (submission: PaymentSubmission) => {
    if (!dossier) return
    setSavingTransaction(true)
    setSearchError('')
    try {
      const created = await createTransaction({
        idVisite: dossier.idVisite,
        lines: lignes.map((line) => ({
          catalogueItemId: line.catalogueItemId,
          quantite: line.quantite,
          payable: line.payable,
          motifNonHonore: line.payable ? undefined : line.motifNonHonore.trim(),
        })),
        payment:
          submission.method === 'especes'
            ? {
                moyenPaiement: 'ESPECES',
                montantRecuFcfa: submission.montantRecuFcfa,
              }
            : submission.method === 'momo'
              ? {
                  moyenPaiement: 'MOBILE_MONEY',
                  telephonePaiement: submission.telephonePaiement,
                }
              : {
                  moyenPaiement: 'CHEQUE',
                  chequeNumero: submission.chequeNumero,
                  chequeBanque: submission.chequeBanque,
                  chequeTitulaire: submission.chequeTitulaire,
                },
      })

      applyTransactionState(created, dossier)

      if (created.latestPayment.moyenPaiement === 'MOBILE_MONEY' && created.latestPayment.statut === 'EN_ATTENTE') {
        toast('info', 'Demande Mobile Money envoyee', 'Le patient doit confirmer le paiement sur son telephone.')
      } else {
        toast('success', 'Encaissement enregistre', `${created.visitId} · ${formatCFA(created.montantEncaisseFcfa)}`)
      }
    } catch (error) {
      setSearchError(getApiErrorMessage(error, "Impossible d'enregistrer cet encaissement."))
    } finally {
      setSavingTransaction(false)
    }
  }

  const handleOpenInvoicePdf = async () => {
    if (!transaction?.invoiceNumber) return
    setOpeningInvoicePdf(true)
    try {
      await openInvoicePdf(transaction.invoiceNumber)
    } catch (error) {
      setSearchError(getApiErrorMessage(error, "Impossible d'ouvrir la facture PDF."))
    } finally {
      setOpeningInvoicePdf(false)
    }
  }

  const paiementResume = useMemo(() => {
    if (!transaction) return null
    const payment = transaction.latestPayment
    const methodLabel = payment.moyenPaiement === 'MOBILE_MONEY'
      ? 'Mobile Money'
      : payment.moyenPaiement === 'ESPECES'
        ? 'Especes'
        : 'Cheque'
    return {
      methodLabel,
      reference:
        payment.moyenPaiement === 'MOBILE_MONEY'
          ? payment.referencePaiement
          : payment.chequeNumero,
    }
  }, [transaction])

  return (
    <Layout>
      <PageHeader
        title="Encaissement"
        subtitle="Rappel dossier et paiement des actes medicaux"
        badge={dossier ? <StatusBadge variant={statusToVariant(dossier.statut)} /> : undefined}
        actions={(
          <form onSubmit={search} className="flex gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="N° dossier, nom ou telephone..."
                className="h-9 w-60 rounded-xl border border-zinc-200 bg-white pl-8 pr-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]"
              />
            </div>
            <Btn variant="secondary" type="submit" disabled={searchLoading || openingIdVisite !== null || savingTransaction || refreshingTransaction}>
              {searchLoading ? 'Recherche...' : 'Charger'}
            </Btn>
          </form>
        )}
      />

      {searchError && (
        <Card padding="sm" className="mb-5 border border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-600">{searchError}</p>
        </Card>
      )}

      {searchResults.length > 1 && (
        <Card padding="sm" className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold text-zinc-900">Plusieurs dossiers trouves</p>
              <p className="text-[12px] text-zinc-400">Choisissez le dossier a ouvrir en caisse.</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-500">
              {searchResults.length} resultats
            </span>
          </div>
          <div className="space-y-2">
            {searchResults.map((item) => (
              <button
                key={item.idVisite}
                type="button"
                onClick={() => void loadVisit(item)}
                disabled={openingIdVisite !== null}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50 disabled:opacity-60"
              >
                <div>
                  <p className="text-[13px] font-semibold text-zinc-800">{item.patientNomComplet}</p>
                  <p className="text-[11px] text-zinc-400">
                    {item.patientTel} · {item.serviceOriente} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold text-amber-700">{item.idVisite}</span>
                  {openingIdVisite === item.idVisite ? (
                    <Loader2 size={14} className="animate-spin text-zinc-400" />
                  ) : (
                    <span className="text-[12px] font-semibold text-zinc-500">Ouvrir</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          {dossier ? (
            <>
              <div className="mb-5 flex items-center gap-4 border-b border-zinc-100 pb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#FDE68A] bg-[#FFFAE6]">
                  <span className="font-mono text-[12px] font-black text-[#92400E]">
                    {dossier.patientNomComplet
                      .split(' ')
                      .map((chunk) => chunk[0] ?? '')
                      .join('')
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-zinc-900">{dossier.patientNomComplet}</p>
                  <p className="text-[12px] text-zinc-400">
                    {dossier.patientTel} · {dossier.serviceOriente}
                  </p>
                </div>
                <span className="rounded-lg border border-[#FDE68A] bg-[#FFFAE6] px-2.5 py-1 font-mono text-[11px] font-bold text-[#92400E]">
                  {dossier.idVisite}
                </span>
              </div>

              {readOnlyMode && isQueuedOffline && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                  En attente reseau - paiement Mobile Money non encore transmis. Le dossier reste en caisse jusqu'au retour de la connexion.
                </div>
              )}

              {readOnlyMode && isPendingMobileMoney && !isQueuedOffline && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700">
                  Paiement Mobile Money initie. Les lignes sont figees en attendant la confirmation FedaPay.
                </div>
              )}

              {isFailedMobileMoney && latestPayment && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                  {describeProviderFailure(latestPayment)} Vous pouvez modifier l&apos;ordonnance ou changer le mode de paiement.
                </div>
              )}

              {readOnlyMode && !isPendingMobileMoney && !isFailedMobileMoney && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700">
                  {transaction?.blockingReason || 'Cet encaissement est deja enregistre. Les lignes sont affichees en lecture seule.'}
                </div>
              )}

              {lockedWithoutTransaction && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                  Ce dossier est deja finalise et ne peut plus etre encaisse dans ce sprint.
                </div>
              )}

              <div className="mb-5 space-y-2">
                {lignes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center">
                    <ShoppingCart size={24} className="mx-auto mb-3 text-zinc-300" />
                    <p className="text-[14px] font-semibold text-zinc-600">Aucune ligne d&apos;encaissement</p>
                    <p className="text-[12px] text-zinc-400">Ajoutez des elements actifs depuis le catalogue.</p>
                  </div>
                ) : (
                  lignes.map((line) => (
                    <div key={line.catalogueItemId} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={line.payable}
                          onChange={() => toggleLine(line.catalogueItemId)}
                          disabled={readOnlyMode}
                          className="mt-1 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-md accent-[#FFCB00] disabled:cursor-default"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className={cn('text-[14px] font-semibold text-zinc-800', !line.payable && !readOnlyMode && 'line-through text-zinc-400')}>
                              {line.nom}
                            </p>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                              {line.codeElement}
                            </span>
                            {readOnlyMode && (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${line.payable ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                {line.payable ? 'Paye' : 'Non honore'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400">{line.type} · {line.service}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {readOnlyMode ? (
                            <div className="rounded-xl bg-zinc-100 px-3 py-2 text-center">
                              <p className="text-[10px] uppercase tracking-wide text-zinc-400">Qte</p>
                              <p className="font-mono text-[13px] font-bold text-zinc-700">{line.quantite}</p>
                            </div>
                          ) : (
                            <div className="flex h-10 items-center rounded-xl border border-zinc-200">
                              <button
                                type="button"
                                onClick={() => updateQuantity(line.catalogueItemId, line.quantite - 1)}
                                className="flex h-full w-9 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800"
                                aria-label="Diminuer la quantite"
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={line.quantite}
                                onChange={(event) => updateQuantity(line.catalogueItemId, Number(event.target.value) || 1)}
                                className="h-full w-12 border-x border-zinc-200 text-center font-mono text-[13px] font-semibold text-zinc-800 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(line.catalogueItemId, line.quantite + 1)}
                                className="flex h-full w-9 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800"
                                aria-label="Augmenter la quantite"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}

                          <div className="min-w-[96px] text-right">
                            <p className="font-mono text-[11px] text-zinc-400">{formatCFA(line.prixUnitaireFcfa)} / u</p>
                            <p className={cn('font-mono text-[14px] font-bold text-zinc-900', !line.payable && !readOnlyMode && 'line-through text-zinc-300')}>
                              {formatCFA(line.montantLigneFcfa)}
                            </p>
                          </div>

                          {!readOnlyMode && (
                            <button
                              type="button"
                              onClick={() => removeLine(line.catalogueItemId)}
                              className="shrink-0 rounded-lg p-1 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                              aria-label="Retirer cette ligne"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {!line.payable && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-[30px] pt-3"
                          >
                            {readOnlyMode ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
                                Non honore - en attente de reglement : {line.motifNonHonore}
                              </div>
                            ) : (
                              <input
                                value={line.motifNonHonore}
                                onChange={(event) => setMotif(line.catalogueItemId, event.target.value)}
                                placeholder="Motif obligatoire..."
                                className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[12px] outline-none transition-all focus:border-[#FFCB00]"
                              />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>

              {!readOnlyMode && !lockedWithoutTransaction && (
                <div className="relative mb-5">
                  <button
                    type="button"
                    onClick={() => setShowCat((value) => !value)}
                    className="flex h-10 w-full items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-3 text-[13px] text-zinc-400 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-600"
                  >
                    <Plus size={13} />
                    Ajouter depuis le catalogue
                  </button>

                  <AnimatePresence>
                    {showCat && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
                      >
                        <div className="border-b border-zinc-100 p-3">
                          <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              value={catQuery}
                              onChange={(event) => setCatQuery(event.target.value)}
                              placeholder="Nom, type ou service..."
                              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-[13px] outline-none transition-all focus:border-[#FFCB00]"
                            />
                          </div>
                        </div>

                        {catLoading ? (
                          <div className="flex items-center justify-center gap-2 px-4 py-6 text-[13px] text-zinc-400">
                            <Loader2 size={14} className="animate-spin" />
                            Chargement...
                          </div>
                        ) : catError ? (
                          <p className="px-4 py-5 text-[13px] text-red-600">{catError}</p>
                        ) : catItems.length === 0 ? (
                          <p className="px-4 py-5 text-[13px] text-zinc-400">Aucun element actif trouve.</p>
                        ) : (
                          catItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => addItem(item)}
                              className="flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-zinc-50"
                            >
                              <div>
                                <p className="text-[13px] font-medium text-zinc-800">{item.nom}</p>
                                <p className="text-[11px] text-zinc-400">
                                  {item.codeElement} · {item.type} · {item.service}
                                </p>
                              </div>
                              <span className="font-mono text-[12px] font-semibold text-zinc-600">
                                {formatCFA(item.montantFcfa)}
                              </span>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="space-y-2 border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-[13px] text-zinc-500">
                  <span>Sous-total ({lignes.length} lignes)</span>
                  <span className="font-mono font-medium">{formatCFA(montantTotal)}</span>
                </div>
                {montantNonHonore > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-zinc-500">Non honore</span>
                    <span className="font-mono font-semibold text-red-500">-{formatCFA(montantNonHonore)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-zinc-900">
                    Total a encaisser
                  </span>
                  <span className="font-mono text-[24px] font-black text-zinc-900">{formatCFA(montantEncaisse)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={36} className="mb-4 text-zinc-200" />
              <p className="mb-1 text-[14px] font-semibold text-zinc-600">Aucun dossier charge</p>
              <p className="text-[13px] text-zinc-400">
                Recherchez un patient par numero de dossier, nom ou telephone.
              </p>
            </div>
          )}
        </Card>

        <div>
          <Card variant="elevated" className="sticky top-6">
            <p className="mb-4 border-b border-zinc-100 pb-3 text-[15px] font-bold text-zinc-900">Paiement</p>

            {transaction && latestPayment && paiementResume && !editableFailedTransaction ? (
              isPendingMobileMoney ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-[12px] font-semibold text-blue-700">Confirmation en attente</p>
                    <p className="mt-1 font-mono text-[22px] font-black text-zinc-900">{formatCFA(transaction.montantEncaisseFcfa)}</p>
                    <p className="mt-1 text-[12px] text-zinc-500">{transaction.visitId} · tentative {latestPayment.attemptNo}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Moyen</span>
                      <span className="font-semibold text-zinc-800">Mobile Money</span>
                    </div>
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Operateur</span>
                      <span className="font-semibold text-zinc-800">{latestPayment.operatorCode ?? dossierOperatorCode ?? 'Inconnu'}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Numero</span>
                      <span className="font-mono font-semibold text-zinc-800">{latestPayment.telephonePaiement ?? dossier?.patientTel}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Statut provider</span>
                      <span className="font-semibold text-zinc-800">{latestPayment.providerStatus ?? 'pending'}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Tentative provider</span>
                      <span className="font-mono font-semibold text-zinc-800">{latestPayment.providerAttemptId ?? '-'}</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Btn variant="secondary" onClick={() => void refreshProviderState(false)} disabled={refreshingTransaction}>
                      {refreshingTransaction ? 'Verification...' : 'Verifier maintenant'}
                    </Btn>
                    <Btn variant="ghost" onClick={resetCurrentDossier} className="w-full justify-center">
                      Nouveau dossier
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-2xl border p-4 ${
                    latestPayment.statut === 'RECU'
                      ? 'border-amber-200 bg-amber-50'
                      : latestPayment.statut === 'REJETE'
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                  }`}>
                    <p className={`text-[12px] font-semibold ${
                      latestPayment.statut === 'RECU'
                        ? 'text-amber-700'
                        : latestPayment.statut === 'REJETE'
                          ? 'text-red-700'
                          : 'text-green-700'
                    }`}>
                      {latestPayment.statut === 'RECU'
                        ? 'Cheque en attente bancaire'
                        : latestPayment.statut === 'REJETE'
                          ? 'Paiement bloque'
                          : 'Encaissement enregistre'}
                    </p>
                    <p className="mt-1 font-mono text-[22px] font-black text-zinc-900">{formatCFA(transaction.montantEncaisseFcfa)}</p>
                    <p className="mt-1 text-[12px] text-zinc-500">{transaction.visitId} · {formatDate(transaction.createdAt)}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Moyen</span>
                      <span className="font-semibold text-zinc-800">{paiementResume.methodLabel}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Statut final</span>
                      <span className="font-semibold text-zinc-800">
                        {latestPayment.statut === 'RECU'
                          ? 'En attente de confirmation bancaire'
                          : latestPayment.statut === 'REJETE'
                            ? 'Bloque'
                            : isFinalTransactionStatus(transaction.statut)
                              ? transaction.statut === 'SOLDE'
                                ? 'Solde'
                                : 'Partiellement solde'
                              : 'En cours'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-[13px]">
                      <span className="text-zinc-500">Montant dossier</span>
                      <span className="font-mono font-semibold text-zinc-800">{formatCFA(transaction.montantTotalFcfa)}</span>
                    </div>
                    {transaction.blockingReason && latestPayment.statut !== 'CONFIRME' && latestPayment.statut !== 'ENCAISSE' && (
                      <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-600">
                        {transaction.blockingReason}
                      </div>
                    )}
                    {latestPayment.moyenPaiement === 'ESPECES' && latestPayment.montantRecuFcfa !== null && (
                      <>
                        <div className="flex justify-between gap-3 text-[13px]">
                          <span className="text-zinc-500">Montant recu</span>
                          <span className="font-mono font-semibold text-zinc-800">{formatCFA(latestPayment.montantRecuFcfa)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-[13px]">
                          <span className="text-zinc-500">Monnaie rendue</span>
                          <span className="font-mono font-semibold text-zinc-800">{formatCFA(latestPayment.monnaieRendueFcfa ?? 0)}</span>
                        </div>
                      </>
                    )}
                    {paiementResume.reference && (
                      <div className="flex justify-between gap-3 text-[13px]">
                        <span className="text-zinc-500">Reference</span>
                        <span className="font-mono font-semibold text-zinc-800">{paiementResume.reference}</span>
                      </div>
                    )}
                    {transaction.invoiceNumber && (
                      <div className="flex justify-between gap-3 text-[13px]">
                        <span className="text-zinc-500">Facture</span>
                        <span className="font-mono font-semibold text-zinc-800">{transaction.invoiceNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    {transaction.invoiceNumber && (
                      <Btn
                        variant="secondary"
                        onClick={() => void handleOpenInvoicePdf()}
                        disabled={openingInvoicePdf}
                        className="w-full justify-center"
                      >
                        {openingInvoicePdf ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                        Voir la facture
                      </Btn>
                    )}
                    <Btn variant="ghost" onClick={resetCurrentDossier} className="w-full justify-center">
                      Nouveau dossier
                    </Btn>
                  </div>
                </div>
              )
            ) : !dossier ? (
              <div className="py-8 text-center">
                <p className="text-[13px] text-zinc-400">Chargez un dossier pour commencer</p>
              </div>
            ) : lockedWithoutTransaction ? (
              <div className="py-6 text-center">
                <p className="text-[13px] leading-relaxed text-zinc-400">
                  Le dossier est deja finalise et ne peut plus etre modifie dans ce sprint.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {!canSubmit ? (
                  <div className="py-2 text-center">
                    <p className="text-[13px] leading-relaxed text-zinc-400">
                      Ajoutez au moins une ligne payable et renseignez les motifs des lignes non honorees.
                    </p>
                  </div>
                ) : (
                  <PaymentTabs
                    montant={montantEncaisse}
                    telephone={paymentPhoneDefault}
                    submitting={savingTransaction}
                    onSubmit={submitTransaction}
                  />
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}
