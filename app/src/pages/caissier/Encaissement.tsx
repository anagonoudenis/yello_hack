import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Loader2, Minus, Plus, Search, ShoppingCart, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentTabs, type PaymentSubmission } from '@/components/shared/PaymentTabs'
import { Card } from '@/components/ui/Card'
import { useNotification } from '@/context/NotificationContext'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { deduceOperatorFromPhone } from '@/lib/paymentOperators'
import { cn } from '@/lib/utils'
import { listCatalogue } from '@/services/catalogueApi'
import {
  getHospitalizationByVisit,
  listHospitalizations,
  prepareFinalPayment,
  prepareIntermediatePayment,
} from '@/services/hospitalizationApi'
import { openInvoicePdf } from '@/services/invoiceApi'
import {
  createTransaction,
  getTransactionByVisit,
  refreshTransactionProviderStatus,
} from '@/services/transactionApi'
import { listVisits, openCashierVisit } from '@/services/visitApi'
import type { CatalogueItem } from '@/types/catalogue'
import type {
  HospitalizationCase,
  HospitalizationCharge,
  HospitalizationPreparedPayment,
} from '@/types/hospitalization'
import type { TransactionDraftLine, TransactionRecord } from '@/types/transaction'
import type { VisitRecord } from '@/types/visit'

const MOBILE_MONEY_REFRESH_INTERVAL_MS = 20_000

type CashierSearchResult =
  | { kind: 'visit'; key: string; visit: VisitRecord }
  | { kind: 'hospitalization'; key: string; hospitalization: HospitalizationCase }

interface NoCurrentDueState {
  dossierId: string
  title: string
  message: string
}

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

const shouldUseTransactionAsCurrentContext = (next: TransactionRecord) => {
  const paymentStatus = next.latestPayment.statut
  return paymentStatus === 'EN_ATTENTE' || paymentStatus === 'RECU' || paymentStatus === 'REJETE' || next.canReopenInCashier
}

const toVisitStatus = (
  transactionStatus: TransactionRecord['statut'],
  fallbackStatus: VisitRecord['statut']
): VisitRecord['statut'] => {
  if (transactionStatus === 'SOLDE' || transactionStatus === 'PARTIELLEMENT_SOLDE') return transactionStatus
  if (transactionStatus === 'EN_ATTENTE' || transactionStatus === 'ECHOUE') return 'EN_CAISSE'
  return fallbackStatus
}

const resolveDossierStatusFromTransaction = (
  transaction: TransactionRecord,
  fallbackStatus: VisitRecord['statut']
): VisitRecord['statut'] => {
  if (transaction.sourceType === 'HOSPITALIZATION') {
    if (transaction.statut === 'EN_ATTENTE' || transaction.statut === 'ECHOUE') return 'EN_CAISSE'
    return transaction.dossierRemainingFcfa > 0 ? 'EN_CAISSE' : 'SOLDE'
  }
  return toVisitStatus(transaction.statut, fallbackStatus)
}

const hospitalizationChargeTypeLabel = (charge: HospitalizationCharge) => {
  if (charge.chargeType === 'BED_DAY') return 'Hospitalisation'
  if (charge.chargeType === 'CATALOGUE') return 'Catalogue'
  return 'Manuel'
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
  stockManaged: item.stockManaged,
  categorieProduit: item.categorieProduit,
  quantiteStock: item.stockManaged ? item.quantiteStock : undefined,
  dateExpiration: item.dateExpiration,
  isCashierDraft: false,
})

const toHospitalizationCatalogueDraftLine = (item: CatalogueItem): TransactionDraftLine => ({
  ...toDraftLine(item),
  hospitalizationChargeOrigin: 'CASHIER',
  hospitalizationChargeStatus: null,
  isCashierDraft: true,
})

const hospitalizationChargeToDraft = (charge: HospitalizationCharge): TransactionDraftLine => ({
  catalogueItemId: -(charge.id),
  hospitalizationChargeId: charge.id,
  hospitalizationChargeOrigin: charge.origin,
  hospitalizationChargeStatus: charge.statusReglement,
  codeElement: charge.codeReference,
  nom: charge.label,
  type: hospitalizationChargeTypeLabel(charge),
  service: charge.serviceSnapshot ?? 'Hospitalisation',
  quantite: charge.quantite,
  prixUnitaireFcfa: Math.max(Math.round(charge.montantFcfa / Math.max(charge.quantite, 1)), 0),
  montantLigneFcfa: charge.montantFcfa,
  payable: true,
  motifNonHonore: '',
  isCashierDraft: false,
})

const transactionLineToDraft = (line: TransactionRecord['lines'][number]): TransactionDraftLine => ({
  catalogueItemId: line.catalogueItemId,
  hospitalizationChargeId: line.hospitalizationChargeId ?? null,
  hospitalizationChargeOrigin: line.hospitalizationChargeOrigin ?? null,
  hospitalizationChargeStatus: line.hospitalizationChargeStatus ?? null,
  codeElement: line.codeElement,
  nom: line.nom,
  type: line.type,
  service: line.service,
  quantite: line.quantite,
  prixUnitaireFcfa: line.prixUnitaireFcfa,
  montantLigneFcfa: line.montantLigneFcfa,
  payable: line.payable,
  motifNonHonore: line.motifNonHonore ?? '',
  stockManaged: undefined,
  categorieProduit: null,
  quantiteStock: undefined,
  dateExpiration: null,
  isCashierDraft: false,
})

const hospitalizationOriginLabel = (origin?: TransactionDraftLine['hospitalizationChargeOrigin']) => {
  if (origin === 'CASHIER') return 'Ajout caisse'
  if (origin === 'SYSTEM_BED_DAY') return 'Frais sejour'
  if (origin === 'RECOUVREMENT') return 'Ajout recouvrement'
  return null
}

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

const buildSearchResults = (items: VisitRecord[] | HospitalizationCase[], kind: CashierSearchResult['kind']): CashierSearchResult[] => {
  if (kind === 'visit') {
    return (items as VisitRecord[]).map((visit) => ({
      kind: 'visit',
      key: visit.idVisite,
      visit,
    }))
  }

  return (items as HospitalizationCase[]).map((hospitalization) => ({
    kind: 'hospitalization',
    key: hospitalization.caseNumber,
    hospitalization,
  }))
}

export default function Encaissement() {
  const navigate = useNavigate()
  const { toast } = useNotification()

  const [query, setQuery] = useState('')
  const [dossier, setDossier] = useState<VisitRecord | null>(null)
  const [hospitalizationCase, setHospitalizationCase] = useState<HospitalizationCase | null>(null)
  const [preparedHospitalizationPayment, setPreparedHospitalizationPayment] = useState<HospitalizationPreparedPayment | null>(null)
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)
  const [lignes, setLignes] = useState<TransactionDraftLine[]>([])
  const [showCat, setShowCat] = useState(false)
  const [catQuery, setCatQuery] = useState('')
  const [catItems, setCatItems] = useState<CatalogueItem[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState<CashierSearchResult[]>([])
  const [openingResultKey, setOpeningResultKey] = useState<string | null>(null)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [refreshingTransaction, setRefreshingTransaction] = useState(false)
  const [openingInvoicePdf, setOpeningInvoicePdf] = useState(false)
  const [noCurrentDue, setNoCurrentDue] = useState<NoCurrentDueState | null>(null)

  const latestPayment = transaction?.latestPayment ?? null
  const editableFailedTransaction = transaction?.canReopenInCashier ?? false
  const readOnlyMode = transaction !== null && !editableFailedTransaction
  const isHospitalizationFlow = hospitalizationCase !== null || dossier?.parcoursType === 'HOSPITALISATION'
  const linesLocked = readOnlyMode || (dossier !== null && transaction === null && isFinalVisitStatus(dossier.statut))
  const lockedWithoutTransaction = dossier !== null && transaction === null && isFinalVisitStatus(dossier.statut)
  const payableLines = lignes.filter((line) => line.payable)
  const nonPayableLines = lignes.filter((line) => !line.payable)
  const montantTotal = lignes.reduce((sum, line) => sum + line.montantLigneFcfa, 0)
  const montantEncaisse = payableLines.reduce((sum, line) => sum + line.montantLigneFcfa, 0)
  const montantNonHonore = nonPayableLines.reduce((sum, line) => sum + line.montantLigneFcfa, 0)
  const canSubmit =
    lignes.length > 0 &&
    payableLines.length > 0 &&
    (isHospitalizationFlow || nonPayableLines.every((line) => line.motifNonHonore.trim().length > 0))
  const dossierOperatorCode = dossier ? deduceOperatorFromPhone(dossier.patientTel) : null
  const isPendingMobileMoney = latestPayment?.moyenPaiement === 'MOBILE_MONEY' && latestPayment.statut === 'EN_ATTENTE'
  const isQueuedOffline =
    latestPayment?.moyenPaiement === 'MOBILE_MONEY' &&
    latestPayment.statut === 'EN_ATTENTE' &&
    latestPayment.providerStatus === 'queued_offline'
  const isFailedMobileMoney =
    editableFailedTransaction &&
    latestPayment?.moyenPaiement === 'MOBILE_MONEY' &&
    latestPayment.statut === 'ECHOUE'
  const paymentPhoneDefault =
    latestPayment?.moyenPaiement === 'MOBILE_MONEY' && editableFailedTransaction
      ? latestPayment.telephonePaiement ?? dossier?.patientTel ?? ''
      : dossier?.patientTel ?? ''
  const headerIdentifier = hospitalizationCase ? `${hospitalizationCase.caseNumber} · ${hospitalizationCase.visitId}` : dossier?.idVisite ?? ''

  const clearSearchUi = () => {
    setSearchResults([])
    setQuery('')
    setCatQuery('')
    setShowCat(false)
  }

  const resetCurrentDossier = () => {
    setDossier(null)
    setHospitalizationCase(null)
    setPreparedHospitalizationPayment(null)
    setTransaction(null)
    setLignes([])
    setQuery('')
    setSearchResults([])
    setSearchError('')
    setShowCat(false)
    setCatQuery('')
    setNoCurrentDue(null)
  }

  const setNoCurrentDueState = (next: NoCurrentDueState) => {
    setTransaction(null)
    setPreparedHospitalizationPayment(null)
    setLignes([])
    setNoCurrentDue(next)
  }

  const applyTransactionState = (next: TransactionRecord, visitFallback?: VisitRecord | null) => {
    const currentLineMap = new Map(lignes.map((line) => [line.catalogueItemId, line]))
    setPreparedHospitalizationPayment(null)
    setNoCurrentDue(null)
    setTransaction(next)
    setLignes(
      next.lines.map((line) => {
        const draft = transactionLineToDraft(line)
        const previous = currentLineMap.get(line.catalogueItemId)
        if (!previous) return draft
        return {
          ...draft,
          stockManaged: previous.stockManaged,
          categorieProduit: previous.categorieProduit,
          quantiteStock: previous.quantiteStock,
          dateExpiration: previous.dateExpiration,
        }
      })
    )
    setDossier((current) => {
      const baseVisit = visitFallback ?? current
      if (!baseVisit) return current
      return {
        ...baseVisit,
        statut: resolveDossierStatusFromTransaction(next, baseVisit.statut),
      }
    })
  }

  const applyHospitalizationPreparedState = (
    nextVisit: VisitRecord,
    nextCase: HospitalizationCase,
    prepared: HospitalizationPreparedPayment
  ) => {
    setDossier(nextVisit)
    setHospitalizationCase(nextCase)
    setTransaction(null)
    setPreparedHospitalizationPayment(prepared)
    setNoCurrentDue(null)
    setLignes(prepared.charges.map(hospitalizationChargeToDraft))
  }

  useEffect(() => {
    if (!showCat || linesLocked) return
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
  }, [showCat, catQuery, linesLocked])

  useEffect(() => {
    if (!transaction || !isPendingMobileMoney || refreshingTransaction) return
    const timeoutId = window.setTimeout(() => {
      void refreshProviderState(true)
    }, MOBILE_MONEY_REFRESH_INTERVAL_MS)
    return () => window.clearTimeout(timeoutId)
  }, [transaction, isPendingMobileMoney, refreshingTransaction])

  const toggleLine = (catalogueItemId: number) => {
    if (linesLocked) return
    setLignes((current) =>
      current.map((line) =>
        line.catalogueItemId === catalogueItemId
          ? { ...line, payable: !line.payable, motifNonHonore: '' }
          : line
      )
    )
  }

  const setMotif = (catalogueItemId: number, motifNonHonore: string) => {
    if (linesLocked) return
    setLignes((current) =>
      current.map((line) => (line.catalogueItemId === catalogueItemId ? { ...line, motifNonHonore } : line))
    )
  }

  const updateQuantity = (catalogueItemId: number, nextQuantity: number) => {
    if (linesLocked) return
    setLignes((current) =>
      current.map((line) => {
        if (line.catalogueItemId !== catalogueItemId) return line
        const maxQuantity = line.stockManaged && typeof line.quantiteStock === 'number' ? line.quantiteStock : null
        const quantite = Math.max(1, maxQuantity !== null ? Math.min(nextQuantity, maxQuantity) : nextQuantity)
        if (maxQuantity !== null && nextQuantity > maxQuantity) {
          toast('warning', 'Stock limite atteint', `${line.nom} n'a que ${maxQuantity} unite(s) disponible(s).`)
        }
        return { ...line, quantite, montantLigneFcfa: quantite * line.prixUnitaireFcfa }
      })
    )
  }

  const removeLine = (catalogueItemId: number) => {
    if (linesLocked) return
    setLignes((current) => current.filter((line) => line.catalogueItemId !== catalogueItemId))
  }

  const addItem = (item: CatalogueItem) => {
    if (linesLocked) return
    if (item.stockManaged && item.quantiteStock <= 0) {
      toast('warning', 'Produit en rupture', `${item.nom} n'est plus disponible en stock.`)
      return
    }
    setLignes((current) => {
      const existing = current.find((line) => line.catalogueItemId === item.id)
      if (existing) {
        if (
          existing.stockManaged &&
          typeof existing.quantiteStock === 'number' &&
          existing.quantite >= existing.quantiteStock
        ) {
          toast('warning', 'Stock limite atteint', `${item.nom} n'a plus de stock disponible pour augmenter la quantite.`)
          return current
        }
        return current.map((line) =>
          line.catalogueItemId === item.id
            ? {
                ...line,
                quantite: line.quantite + 1,
                montantLigneFcfa: (line.quantite + 1) * line.prixUnitaireFcfa,
              }
            : line
        )
      }
      return [...current, isHospitalizationFlow ? toHospitalizationCatalogueDraftLine(item) : toDraftLine(item)]
    })
    setShowCat(false)
  }

  const loadTransactionOrNull = async (idVisite: string) => {
    try {
      return await getTransactionByVisit(idVisite)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  const prepareHospitalizationCurrentPayment = async (nextCase: HospitalizationCase) => {
    if (nextCase.dischargeMedicalAt) {
      return prepareFinalPayment(nextCase.caseNumber)
    }
    return prepareIntermediatePayment(nextCase.caseNumber)
  }

  const loadHospitalizationCurrentDue = async (openedVisit: VisitRecord) => {
    const nextCase = await getHospitalizationByVisit(openedVisit.idVisite)
    setHospitalizationCase(nextCase)
    setDossier(openedVisit)
    const existingTransaction = await loadTransactionOrNull(openedVisit.idVisite)

    if (existingTransaction) {
      const paymentStatus = existingTransaction.latestPayment.statut
      if (paymentStatus === 'EN_ATTENTE' || paymentStatus === 'RECU') {
        applyTransactionState(existingTransaction, openedVisit)
        return
      }
    }

    try {
      const prepared = await prepareHospitalizationCurrentPayment(nextCase)
      applyHospitalizationPreparedState(openedVisit, nextCase, prepared)
      return
    } catch (error) {
      const noPreparedDue =
        axios.isAxiosError(error) &&
        error.response?.status === 409

      if (!noPreparedDue) {
        throw error
      }
    }

    setNoCurrentDueState({
      dossierId: nextCase.caseNumber,
      title: 'Aucun montant a encaisser',
      message:
        "Ce sejour ne presente aucun reglement exigible a cet instant. Les paiements deja saisis restent consultables dans l'historique dossiers.",
    })
  }

  const loadOutpatientCurrentDue = async (openedVisit: VisitRecord) => {
    setHospitalizationCase(null)
    setPreparedHospitalizationPayment(null)
    const existingTransaction = await loadTransactionOrNull(openedVisit.idVisite)

    if (!existingTransaction) {
      setDossier(openedVisit)
      setTransaction(null)
      setLignes([])
      setNoCurrentDue(null)
      return
    }

    if (shouldUseTransactionAsCurrentContext(existingTransaction)) {
      applyTransactionState(existingTransaction, openedVisit)
      return
    }

    setDossier({
      ...openedVisit,
      statut: resolveDossierStatusFromTransaction(existingTransaction, openedVisit.statut),
    })
    setNoCurrentDueState({
      dossierId: openedVisit.idVisite,
      title: 'Aucun montant a encaisser',
      message:
        "Ce dossier ne presente plus de montant a encaisser. Le detail des encaissements deja saisis est disponible dans l'historique dossiers.",
    })
  }

  const loadVisit = async (visit: VisitRecord) => {
    setOpeningResultKey(visit.idVisite)
    setSearchError('')
    try {
      const opened = await openCashierVisit(visit.idVisite)
      if (opened.parcoursType === 'HOSPITALISATION') {
        await loadHospitalizationCurrentDue(opened)
        toast('info', 'Dossier charge', `${opened.idVisite} · ${opened.patientNomComplet}`)
      } else {
        await loadOutpatientCurrentDue(opened)
        toast('info', 'Dossier charge', `${opened.idVisite} · ${opened.patientNomComplet}`)
      }
      clearSearchUi()
    } catch (error) {
      setSearchError(getApiErrorMessage(error, "Impossible d'ouvrir ce dossier en caisse."))
    } finally {
      setOpeningResultKey(null)
    }
  }

  const loadHospitalizationSearchResult = async (item: HospitalizationCase) => {
    setOpeningResultKey(item.caseNumber)
    setSearchError('')
    try {
      const opened = await openCashierVisit(item.visitId)
      await loadHospitalizationCurrentDue(opened)
      clearSearchUi()
      toast('info', 'Dossier charge', `${item.caseNumber} · ${item.patientNom}`)
    } catch (error) {
      setSearchError(getApiErrorMessage(error, "Impossible d'ouvrir ce sejour en caisse."))
    } finally {
      setOpeningResultKey(null)
    }
  }

  const loadSearchResult = async (result: CashierSearchResult) => {
    if (result.kind === 'hospitalization') {
      await loadHospitalizationSearchResult(result.hospitalization)
      return
    }
    await loadVisit(result.visit)
  }

  const search = async (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedQuery = query.trim()
    if (!normalizedQuery) return

    setSearchLoading(true)
    setSearchError('')
    setSearchResults([])

    try {
      if (normalizedQuery.toUpperCase().startsWith('HOSP-')) {
        const res = await listHospitalizations(normalizedQuery)
        if (res.items.length === 0) {
          setSearchError('Aucun sejour hospitalisation ne correspond a cette recherche.')
        } else if (res.items.length === 1) {
          await loadHospitalizationSearchResult(res.items[0])
        } else {
          setSearchResults(buildSearchResults(res.items, 'hospitalization'))
        }
      } else {
        const res = await listVisits({ search: normalizedQuery, pageSize: 10 })
        if (res.items.length === 0) {
          setSearchError('Aucun dossier trouve pour cette recherche.')
        } else if (res.items.length === 1) {
          await loadVisit(res.items[0])
        } else {
          setSearchResults(buildSearchResults(res.items, 'visit'))
        }
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
      if (refreshed.sourceType === 'HOSPITALIZATION' && dossier) {
        const nextVisit = {
          ...dossier,
          statut: resolveDossierStatusFromTransaction(refreshed, dossier.statut),
        }
        if (refreshed.latestPayment.statut === 'EN_ATTENTE' || refreshed.latestPayment.statut === 'RECU') {
          applyTransactionState(refreshed, nextVisit)
        } else {
          await loadHospitalizationCurrentDue(nextVisit)
        }
      } else {
        applyTransactionState(refreshed)
      }

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
      const linesPayload = isHospitalizationFlow
        ? lignes
            .filter((line) => line.payable)
            .map((line) => ({
              catalogueItemId: line.catalogueItemId,
              hospitalizationChargeId: line.hospitalizationChargeId ?? undefined,
              quantite: line.quantite,
              payable: true,
              motifNonHonore: undefined,
            }))
        : lignes.map((line) => ({
            catalogueItemId: line.catalogueItemId,
            hospitalizationChargeId: line.hospitalizationChargeId ?? undefined,
            quantite: line.quantite,
            payable: line.payable,
            motifNonHonore: line.payable ? undefined : line.motifNonHonore.trim(),
          }))

      const created = await createTransaction({
        idVisite: isHospitalizationFlow ? undefined : dossier.idVisite,
        hospitalizationCaseNumber: hospitalizationCase?.caseNumber,
        transactionKind:
          hospitalizationCase !== null
            ? preparedHospitalizationPayment?.transactionKind ??
              transaction?.transactionKind ??
              (hospitalizationCase.dischargeMedicalAt ? 'HOSPITALIZATION_FINAL' : 'HOSPITALIZATION_INTERMEDIATE')
            : undefined,
        lines: linesPayload,
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

      if (created.sourceType === 'HOSPITALIZATION') {
        const nextVisit = {
          ...dossier,
          statut: resolveDossierStatusFromTransaction(created, dossier.statut),
        }
        if (created.latestPayment.statut === 'EN_ATTENTE' || created.latestPayment.statut === 'RECU') {
          applyTransactionState(created, nextVisit)
        } else {
          await loadHospitalizationCurrentDue(nextVisit)
        }
      } else {
        applyTransactionState(created, dossier)
      }

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
    const methodLabel =
      payment.moyenPaiement === 'MOBILE_MONEY'
        ? 'Mobile Money'
        : payment.moyenPaiement === 'ESPECES'
          ? 'Especes'
          : 'Cheque'
    return {
      methodLabel,
      reference:
        payment.moyenPaiement === 'MOBILE_MONEY'
          ? payment.referencePaiement
          : payment.moyenPaiement === 'CHEQUE'
            ? payment.chequeNumero
            : null,
    }
  }, [transaction])

  const isPreparedHospitalizationDue = hospitalizationCase !== null && preparedHospitalizationPayment !== null && transaction === null

  return (
    <Layout>
      <PageHeader
        title="Encaissement"
        subtitle="Chargement du dossier et reglement du montant exigible a date"
        badge={dossier ? <StatusBadge variant={statusToVariant(dossier.statut)} /> : undefined}
        actions={(
          <form onSubmit={search} className="flex gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="VIS, HOSP, nom ou telephone..."
                className="h-9 w-64 rounded-xl border border-zinc-200 bg-white pl-8 pr-3 text-[13px] outline-none transition-all focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]"
              />
            </div>
            <Btn
              variant="secondary"
              type="submit"
              disabled={searchLoading || openingResultKey !== null || savingTransaction || refreshingTransaction}
            >
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
            {searchResults.map((item) => {
              const isHospitalizationResult = item.kind === 'hospitalization'
              const displayName = isHospitalizationResult ? item.hospitalization.patientNom : item.visit.patientNomComplet
              const displayTel = isHospitalizationResult ? item.hospitalization.patientTel : item.visit.patientTel
              const displayService = isHospitalizationResult ? item.hospitalization.serviceOriente : item.visit.serviceOriente
              const displayDate = isHospitalizationResult ? item.hospitalization.admissionAt : item.visit.createdAt
              const displayIdentifier = isHospitalizationResult ? item.hospitalization.caseNumber : item.visit.idVisite

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => void loadSearchResult(item)}
                  disabled={openingResultKey !== null}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50 disabled:opacity-60"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-800">{displayName}</p>
                    <p className="text-[11px] text-zinc-400">
                      {displayTel} · {displayService} · {formatDate(displayDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-bold text-amber-700">{displayIdentifier}</span>
                    {openingResultKey === item.key ? (
                      <Loader2 size={14} className="animate-spin text-zinc-400" />
                    ) : (
                      <span className="text-[12px] font-semibold text-zinc-500">Ouvrir</span>
                    )}
                  </div>
                </button>
              )
            })}
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
                  {headerIdentifier}
                </span>
              </div>

              {isPreparedHospitalizationDue && preparedHospitalizationPayment && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700">
                  {preparedHospitalizationPayment.transactionKind === 'HOSPITALIZATION_FINAL'
                    ? 'Reglement final prepare. Seules les charges encore dues sont affichees.'
                    : 'Reglement intermediaire prepare. Seules les charges exigibles a date sont affichees.'}
                </div>
              )}

              {readOnlyMode && isQueuedOffline && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                  En attente reseau - paiement Mobile Money non encore transmis. Le dossier reste en caisse jusqu'au retour de la connexion.
                </div>
              )}

              {readOnlyMode && isPendingMobileMoney && !isQueuedOffline && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700">
                  Paiement Mobile Money initie. Le dossier reste fige en attendant la confirmation FedaPay.
                </div>
              )}

              {isFailedMobileMoney && latestPayment && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
                  {describeProviderFailure(latestPayment)} Vous pouvez relancer ce paiement ou changer de mode de reglement.
                </div>
              )}

              {readOnlyMode && !isPendingMobileMoney && !isFailedMobileMoney && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700">
                  {transaction?.blockingReason || 'Cet encaissement est deja enregistre. Les lignes sont affichees en lecture seule.'}
                </div>
              )}

              {noCurrentDue && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-emerald-700">{noCurrentDue.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-emerald-800">{noCurrentDue.message}</p>
                </div>
              )}

              <div className="mb-5 space-y-2">
                {noCurrentDue ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center">
                    <ShoppingCart size={24} className="mx-auto mb-3 text-zinc-300" />
                    <p className="text-[14px] font-semibold text-zinc-600">Aucun montant a encaisser</p>
                    <p className="mt-1 text-[12px] text-zinc-400">
                      Ce dossier n'affiche plus de demande de paiement active dans la caisse.
                    </p>
                  </div>
                ) : lignes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center">
                    <ShoppingCart size={24} className="mx-auto mb-3 text-zinc-300" />
                    <p className="text-[14px] font-semibold text-zinc-600">Aucune ligne d'encaissement</p>
                    <p className="text-[12px] text-zinc-400">
                      {isHospitalizationFlow
                        ? "Aucun frais exigible n'est prepare pour ce sejour. Vous pouvez ajouter une ordonnance ou un acte depuis le catalogue."
                        : 'Ajoutez des elements actifs depuis le catalogue.'}
                    </p>
                  </div>
                ) : (
                  lignes.map((line) => {
                    const isExistingHospitalizationCharge = isHospitalizationFlow && !line.isCashierDraft && line.hospitalizationChargeId !== null && line.hospitalizationChargeId !== undefined
                    const canEditLineQuantity = !linesLocked && (!isHospitalizationFlow || !!line.isCashierDraft)
                    const canRemoveLine = !linesLocked && (!isHospitalizationFlow || !!line.isCashierDraft)
                    const originLabel = isHospitalizationFlow ? hospitalizationOriginLabel(line.hospitalizationChargeOrigin) : null
                    const lineReadOnlyLabel =
                      latestPayment?.statut === 'EN_ATTENTE' || latestPayment?.statut === 'RECU'
                        ? 'En attente'
                        : line.payable
                          ? 'Paye'
                          : 'Reste du'

                    return (
                    <div key={`${line.catalogueItemId}-${line.hospitalizationChargeId ?? 'catalogue'}`} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={line.payable}
                          onChange={() => toggleLine(line.catalogueItemId)}
                          disabled={linesLocked}
                          className="mt-1 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-md accent-[#FFCB00] disabled:cursor-default"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className={cn('text-[14px] font-semibold text-zinc-800', !line.payable && !linesLocked && 'line-through text-zinc-400')}>
                              {line.nom}
                            </p>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                              {line.codeElement}
                            </span>
                            {originLabel && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                line.hospitalizationChargeOrigin === 'CASHIER'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                {originLabel}
                              </span>
                            )}
                            {readOnlyMode && (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${line.payable ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                {lineReadOnlyLabel}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] text-zinc-400">{line.type} · {line.service}</p>
                            {line.stockManaged && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  (line.quantiteStock ?? 0) < 0
                                    ? 'bg-red-50 text-red-700'
                                    : (line.quantiteStock ?? 0) === 0
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                Stock {line.quantiteStock ?? 0}
                              </span>
                            )}
                            {line.stockManaged && line.dateExpiration && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                                Exp. {formatDate(line.dateExpiration)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {!canEditLineQuantity ? (
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
                            <p className={cn('font-mono text-[14px] font-bold text-zinc-900', !line.payable && !linesLocked && 'line-through text-zinc-300')}>
                              {formatCFA(line.montantLigneFcfa)}
                            </p>
                          </div>

                          {canRemoveLine && (
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
                            {linesLocked ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
                                Non honore - en attente de reglement : {line.motifNonHonore}
                            </div>
                          ) : isHospitalizationFlow ? (
                              <div className={`rounded-xl border px-3 py-2 text-[12px] ${
                                isExistingHospitalizationCharge
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                              }`}>
                                {isExistingHospitalizationCharge
                                  ? 'Reste du : ce frais du sejour pourra etre regle plus tard.'
                                  : 'Ajout caisse non soumis : cette ligne ne sera materialisee que si elle est cochée au moment du paiement.'}
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
                  )})
                )}
              </div>

              {!linesLocked && !lockedWithoutTransaction && (
                <div className="relative mb-5">
                  <button
                    type="button"
                    onClick={() => setShowCat((value) => !value)}
                    className="flex h-10 w-full items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-3 text-[13px] text-zinc-400 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-600"
                  >
                    <Plus size={13} />
                    {isHospitalizationFlow ? 'Ajouter une ordonnance ou un acte' : 'Ajouter depuis le catalogue'}
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
                              disabled={item.stockManaged && item.quantiteStock <= 0}
                              onClick={() => addItem(item)}
                              className={`flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-0 ${
                                item.stockManaged && item.quantiteStock <= 0
                                  ? 'cursor-not-allowed bg-zinc-50 text-zinc-400'
                                  : 'hover:bg-zinc-50'
                              }`}
                            >
                              <div>
                                <p className="text-[13px] font-medium text-zinc-800">{item.nom}</p>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                                  <span>{item.codeElement} · {item.type} · {item.service}</span>
                                  {item.stockManaged && (
                                    <span
                                      className={`rounded-full px-2 py-0.5 font-semibold ${
                                        item.quantiteStock < 0
                                          ? 'bg-red-50 text-red-700'
                                          : item.quantiteStock === 0
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-emerald-50 text-emerald-700'
                                      }`}
                                    >
                                      Stock {item.quantiteStock}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-mono text-[12px] font-semibold text-zinc-600">
                                  {formatCFA(item.montantFcfa)}
                                </span>
                                {item.stockManaged && item.quantiteStock <= 0 && (
                                  <p className="text-[10px] font-semibold text-amber-700">Rupture</p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!noCurrentDue && (
                <div className="space-y-2 border-t border-zinc-100 pt-4">
                  <div className="flex justify-between text-[13px] text-zinc-500">
                    <span>Sous-total ({lignes.length} lignes)</span>
                    <span className="font-mono font-medium">{formatCFA(montantTotal)}</span>
                  </div>
                  {montantNonHonore > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">{isHospitalizationFlow ? 'Regle plus tard' : 'Non honore'}</span>
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
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={36} className="mb-4 text-zinc-200" />
              <p className="mb-1 text-[14px] font-semibold text-zinc-600">Aucun dossier charge</p>
              <p className="text-[13px] text-zinc-400">
                Recherchez un patient par numero VIS, numero HOSP, nom ou telephone.
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
                  <div
                    className={`rounded-2xl border p-4 ${
                      latestPayment.statut === 'RECU'
                        ? 'border-amber-200 bg-amber-50'
                        : latestPayment.statut === 'REJETE'
                          ? 'border-red-200 bg-red-50'
                          : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <p
                      className={`text-[12px] font-semibold ${
                        latestPayment.statut === 'RECU'
                          ? 'text-amber-700'
                          : latestPayment.statut === 'REJETE'
                            ? 'text-red-700'
                            : 'text-green-700'
                      }`}
                    >
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
                    {transaction.blockingReason &&
                      latestPayment.statut !== 'CONFIRME' &&
                      latestPayment.statut !== 'ENCAISSE' && (
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
            ) : noCurrentDue ? (
              <div className="space-y-4 py-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[12px] font-semibold text-emerald-700">{noCurrentDue.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-emerald-800">{noCurrentDue.message}</p>
                </div>
                <div className="grid gap-2">
                  <Btn
                    variant="secondary"
                    onClick={() => navigate(`/caissier/historique/dossiers/${encodeURIComponent(noCurrentDue.dossierId)}`)}
                    className="w-full justify-center"
                  >
                    <ExternalLink size={14} />
                    Ouvrir l'historique du dossier
                  </Btn>
                  <Btn variant="ghost" onClick={resetCurrentDossier} className="w-full justify-center">
                    Nouveau dossier
                  </Btn>
                </div>
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
                      {isHospitalizationFlow
                        ? payableLines.length === 0
                          ? 'Selectionnez au moins un frais a regler maintenant.'
                          : "Aucun frais exigible n'est pret pour l'encaissement."
                        : 'Ajoutez au moins une ligne payable et renseignez les motifs des lignes non honorees.'}
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
