import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader } from '@/components/layout/PageHeader'
import { OverlayPanel } from '@/components/shared/OverlayPanel'
import { Card } from '@/components/ui/Card'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { listCatalogue } from '@/services/catalogueApi'
import { openInvoicePdf } from '@/services/invoiceApi'
import {
  assignHospitalBed,
  closeHospitalizationAdmin,
  createHospitalizationManualCharge,
  getHospitalization,
  getHospitalizationTransactions,
  listHospitalBeds,
  markActualDischarge,
  markMedicalDischarge,
  transferHospitalBed,
} from '@/services/hospitalizationApi'
import type { CatalogueItem } from '@/types/catalogue'
import type {
  HospitalBed,
  HospitalizationCase,
  HospitalizationCaseTransactionRecord,
} from '@/types/hospitalization'
import {
  ArrowLeft,
  ArrowRightLeft,
  BedDouble,
  CircleCheck,
  FilePlus2,
  Plus,
  RefreshCw,
  ReceiptText,
  Stethoscope,
  DoorOpen,
} from 'lucide-react'

const STATUS_LABELS: Record<HospitalizationCase['status'], string> = {
  OPEN: 'Ouvert',
  PENDING_EXIT: 'Sortie medicale',
  CLOSED: 'Clos',
  TRANSFERRED: 'Transfere',
  CANCELED: 'Annule',
}

const STATUS_CLASSES: Record<HospitalizationCase['status'], string> = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  PENDING_EXIT: 'bg-amber-50 text-amber-700',
  CLOSED: 'bg-zinc-100 text-zinc-600',
  TRANSFERRED: 'bg-blue-50 text-blue-700',
  CANCELED: 'bg-red-50 text-red-700',
}

const PAYMENT_METHOD_LABELS: Record<HospitalizationCaseTransactionRecord['paymentMethod'], string> = {
  ESPECES: 'Especes',
  CHEQUE: 'Cheque',
  MOBILE_MONEY: 'Mobile Money',
}

const PAYMENT_STATUS_LABELS: Record<HospitalizationCaseTransactionRecord['paymentStatus'], string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirme',
  ECHOUE: 'Echoue',
  RECU: 'Recu',
  ENCAISSE: 'Encaisse',
  REJETE: 'Rejete',
}

const initialManualCharge = {
  label: '',
  montantFcfa: '',
  service: '',
}

type ConfirmAction = 'mark-discharge' | 'mark-actual-discharge' | 'close-admin' | null

function buildConfirmCopy(action: Exclude<ConfirmAction, null>): {
  title: string
  description: string
  cta: string
} {
  switch (action) {
    case 'mark-discharge':
      return {
        title: 'Marquer la sortie medicale',
        description: "La sortie medicale reste une etape clinique. La facturation continue tant que la sortie reelle n'est pas enregistree.",
        cta: 'Confirmer la sortie medicale',
      }
    case 'mark-actual-discharge':
      return {
        title: 'Marquer la sortie reelle',
        description: "Le lit sera libere immediatement et les journees futures ne seront plus ajoutees au dossier.",
        cta: 'Confirmer la sortie reelle',
      }
    case 'close-admin':
      return {
        title: 'Cloturer administrativement',
        description: "La cloture termine le sejour une fois la sortie reelle enregistree et le reste a payer ramene a zero.",
        cta: 'Cloturer le sejour',
      }
  }

  return {
    title: '',
    description: '',
    cta: '',
  }
}

export default function SejourDetailRecouvrement() {
  const navigate = useNavigate()
  const { caseNumber = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCase, setSelectedCase] = useState<HospitalizationCase | null>(null)
  const [transactions, setTransactions] = useState<HospitalizationCaseTransactionRecord[]>([])
  const [beds, setBeds] = useState<HospitalBed[]>([])
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([])
  const [catalogueQuery, setCatalogueQuery] = useState('')
  const [manualCharge, setManualCharge] = useState(initialManualCharge)
  const [selectedBedId, setSelectedBedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [bedDrawerOpen, setBedDrawerOpen] = useState(false)
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [catalogueDrawerOpen, setCatalogueDrawerOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const actionParam = searchParams.get('action')

  const availableBeds = useMemo(() => {
    if (!selectedCase) return beds.filter((bed) => bed.actif && !bed.occupied)
    return beds.filter((bed) => bed.actif && (!bed.occupied || bed.id === selectedCase.activeBed?.id))
  }, [beds, selectedCase])

  const canClose = Boolean(
    selectedCase &&
      selectedCase.status !== 'CLOSED' &&
      selectedCase.actualDischargeAt &&
      selectedCase.clearance.resteAPayerFcfa === 0,
  )

  const clearActionParam = () => {
    if (!actionParam) return
    const next = new URLSearchParams(searchParams)
    next.delete('action')
    setSearchParams(next, { replace: true })
  }

  const loadCaseData = async () => {
    if (!caseNumber) return
    setLoading(true)
    setError('')
    try {
      const [nextCase, nextTransactions, nextBeds] = await Promise.all([
        getHospitalization(caseNumber),
        getHospitalizationTransactions(caseNumber),
        listHospitalBeds(),
      ])
      setSelectedCase(nextCase)
      setTransactions(nextTransactions)
      setBeds(nextBeds)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger le detail de ce sejour."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCaseData()
  }, [caseNumber])

  useEffect(() => {
    if (!catalogueDrawerOpen) return undefined

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await listCatalogue({ search: catalogueQuery || undefined, actif: true, pageSize: 12 })
        setCatalogueItems(response.items)
      } catch {
        setCatalogueItems([])
      }
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [catalogueDrawerOpen, catalogueQuery])

  useEffect(() => {
    if (!selectedCase || !actionParam) return

    if (actionParam === 'assign-bed' || actionParam === 'transfer-bed') {
      setSelectedBedId('')
      setBedDrawerOpen(true)
    } else if (actionParam === 'mark-discharge' || actionParam === 'mark-actual-discharge' || actionParam === 'close-admin') {
      setConfirmAction(actionParam)
    }

    clearActionParam()
  }, [selectedCase?.caseNumber, actionParam])

  const refresh = async () => {
    await loadCaseData()
  }

  const handleAssignOrTransferBed = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedCase || !selectedBedId) return
    setSaving(true)
    setError('')
    try {
      const nextCase = selectedCase.activeBed
        ? await transferHospitalBed(selectedCase.caseNumber, Number(selectedBedId))
        : await assignHospitalBed(selectedCase.caseNumber, Number(selectedBedId))
      setSelectedCase(nextCase)
      setSelectedBedId('')
      setBedDrawerOpen(false)
      await refresh()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Operation sur le lit impossible.'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddManualCharge = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedCase) return
    setSaving(true)
    setError('')
    try {
      await createHospitalizationManualCharge(selectedCase.caseNumber, {
        chargeType: 'MANUAL',
        label: manualCharge.label,
        montantFcfa: Number(manualCharge.montantFcfa || 0),
        service: manualCharge.service || undefined,
      })
      setManualCharge(initialManualCharge)
      setManualDrawerOpen(false)
      await refresh()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Ajout du frais manuel impossible."))
    } finally {
      setSaving(false)
    }
  }

  const handleAddCatalogueCharge = async (item: CatalogueItem) => {
    if (!selectedCase) return
    setSaving(true)
    setError('')
    try {
      await createHospitalizationManualCharge(selectedCase.caseNumber, {
        chargeType: 'CATALOGUE',
        catalogueItemId: item.id,
      })
      setCatalogueDrawerOpen(false)
      await refresh()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Ajout de l'acte catalogue impossible."))
    } finally {
      setSaving(false)
    }
  }

  const executeConfirmAction = async () => {
    if (!selectedCase || !confirmAction) return
    setSaving(true)
    setError('')
    try {
      if (confirmAction === 'mark-discharge') {
        const nextCase = await markMedicalDischarge(selectedCase.caseNumber)
        setSelectedCase(nextCase)
      } else if (confirmAction === 'mark-actual-discharge') {
        const nextCase = await markActualDischarge(selectedCase.caseNumber)
        setSelectedCase(nextCase)
      } else if (confirmAction === 'close-admin') {
        const nextCase = await closeHospitalizationAdmin(selectedCase.caseNumber)
        setSelectedCase(nextCase)
      }

      setConfirmAction(null)
      await refresh()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Operation de recouvrement impossible."))
    } finally {
      setSaving(false)
    }
  }

  const confirmCopy = confirmAction ? buildConfirmCopy(confirmAction) : null

  return (
    <Layout>
      <PageHeader
        title={selectedCase ? `Sejour ${selectedCase.caseNumber}` : 'Detail sejour'}
        subtitle={selectedCase ? `${selectedCase.visitId} · ${selectedCase.patientNom}` : 'Chargement du detail du sejour'}
        actions={(
          <>
            <Btn variant="ghost" icon={ArrowLeft} onClick={() => navigate('/recouvrement/sejours')}>
              Retour a la liste
            </Btn>
            <Btn variant="secondary" icon={RefreshCw} onClick={() => void refresh()} disabled={loading || saving}>
              Actualiser
            </Btn>
          </>
        )}
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      {!selectedCase ? (
        <Card>
          <p className="text-[13px] text-zinc-400">{loading ? 'Chargement du sejour...' : 'Sejour introuvable.'}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASSES[selectedCase.status]}`}>
                      {STATUS_LABELS[selectedCase.status]}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-amber-700">{selectedCase.caseNumber}</span>
                  </div>
                  <h2 className="mt-3 text-[24px] font-bold text-zinc-900">{selectedCase.patientNom}</h2>
                  <p className="mt-1 text-[13px] text-zinc-500">{selectedCase.patientTel} · {selectedCase.serviceOriente}</p>
                  <p className="mt-1 text-[12px] text-zinc-400">Admission {formatDate(selectedCase.admissionAt)}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
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
            </Card>

            <Card>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-zinc-400">Actions rapides</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Btn variant="ghost" icon={selectedCase.activeBed ? ArrowRightLeft : BedDouble} onClick={() => setBedDrawerOpen(true)}>
                  {selectedCase.activeBed ? 'Transferer le lit' : 'Affecter un lit'}
                </Btn>
                <Btn variant="ghost" icon={FilePlus2} onClick={() => setManualDrawerOpen(true)}>
                  Frais manuel
                </Btn>
                <Btn variant="ghost" icon={Plus} onClick={() => setCatalogueDrawerOpen(true)}>
                  Depuis catalogue
                </Btn>
                {!selectedCase.dischargeMedicalAt && selectedCase.status !== 'CLOSED' && (
                  <Btn variant="ghost" icon={Stethoscope} onClick={() => setConfirmAction('mark-discharge')}>
                    Sortie medicale
                  </Btn>
                )}
                {!selectedCase.actualDischargeAt && selectedCase.status !== 'CLOSED' && (
                  <Btn variant="ghost" icon={DoorOpen} onClick={() => setConfirmAction('mark-actual-discharge')}>
                    Sortie reelle
                  </Btn>
                )}
                {canClose && (
                  <Btn variant="primary" icon={CircleCheck} onClick={() => setConfirmAction('close-admin')}>
                    Cloturer admin
                  </Btn>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Lit actif</p>
                  <p className="mt-2 text-[14px] font-semibold text-zinc-900">
                    {selectedCase.activeBed ? `${selectedCase.activeBed.bedCode} · ${selectedCase.activeBed.roomCategory}` : 'Aucun lit affecte'}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Prochain jalon</p>
                  <p className="mt-2 text-[14px] font-semibold text-zinc-900">
                    {selectedCase.prochainJalonAt ? formatDate(selectedCase.prochainJalonAt) : 'Aucun'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-bold text-zinc-900">Lit actuel et historique</p>
                  <p className="text-[12px] text-zinc-400">Suivi des affectations et transferts sur le sejour</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {selectedCase.bedMovements.length === 0 ? (
                  <p className="text-[13px] text-zinc-400">Aucun mouvement de lit enregistre.</p>
                ) : (
                  selectedCase.bedMovements.map((movement) => (
                    <div key={movement.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-900">{movement.movementType}</p>
                          <p className="mt-1 text-[12px] text-zinc-500">
                            {movement.fromBedCode ?? 'Aucun'} → {movement.toBedCode ?? 'Aucun'}
                          </p>
                        </div>
                        <p className="text-[11px] text-zinc-400">{formatDate(movement.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <p className="text-[15px] font-bold text-zinc-900">Situation du reglement</p>
              <p className="mt-1 text-[12px] text-zinc-400">Synthese du dossier avant passage effectif en caisse</p>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-zinc-400">Reste dossier</p>
                    <p className="mt-1 text-[12px] text-zinc-500">
                      Les reglements deja effectues restent visibles dans l'historique ci-dessous.
                    </p>
                  </div>
                  <p className="font-mono text-[24px] font-black text-zinc-900">{formatCFA(selectedCase.clearance.resteAPayerFcfa)}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-bold text-zinc-900">Frais du sejour</p>
                  <p className="text-[12px] text-zinc-400">Journees, actes rattaches et frais manuels</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="ghost" icon={FilePlus2} onClick={() => setManualDrawerOpen(true)}>
                    Ajouter un frais manuel
                  </Btn>
                  <Btn variant="ghost" icon={Plus} onClick={() => setCatalogueDrawerOpen(true)}>
                    Ajouter depuis le catalogue
                  </Btn>
                </div>
              </div>

              <div className="mt-4 divide-y divide-zinc-100">
                {selectedCase.charges.length === 0 ? (
                  <p className="py-10 text-[13px] text-zinc-400">Aucun frais materialise.</p>
                ) : (
                  selectedCase.charges.map((charge) => (
                    <div key={charge.id} className="flex items-start justify-between gap-3 py-4">
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-900">{charge.label}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {charge.codeReference} · {charge.chargeType}
                          {charge.chargeDate ? ` · ${charge.chargeDate}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[13px] font-bold text-zinc-900">{formatCFA(charge.montantFcfa)}</p>
                        <p className={`mt-1 text-[11px] font-semibold ${
                          charge.statusReglement === 'REGLE'
                            ? 'text-emerald-700'
                            : charge.statusReglement === 'EN_ATTENTE_PAIEMENT'
                              ? 'text-amber-700'
                              : 'text-red-600'
                        }`}>
                          {charge.statusReglement}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <p className="text-[15px] font-bold text-zinc-900">Historique des reglements</p>
              <p className="mt-1 text-[12px] text-zinc-400">Paiements deja engages ou finalises sur ce sejour</p>

              <div className="mt-4 space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-[13px] text-zinc-400">Aucun reglement enregistre pour ce sejour.</p>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-900">
                            {transaction.transactionKind === 'HOSPITALIZATION_FINAL' ? 'Reglement final' : 'Reglement intermediaire'}
                          </p>
                          <p className="mt-1 text-[12px] text-zinc-500">
                            {PAYMENT_METHOD_LABELS[transaction.paymentMethod]} · {PAYMENT_STATUS_LABELS[transaction.paymentStatus]}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-400">{formatDate(transaction.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[13px] font-bold text-zinc-900">{formatCFA(transaction.montantEncaisseFcfa)}</p>
                          {transaction.invoiceNumber && (
                            <button
                              type="button"
                              onClick={() => void openInvoicePdf(transaction.invoiceNumber!)}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900"
                            >
                              <ReceiptText size={13} />
                              Voir la facture
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      <OverlayPanel
        open={bedDrawerOpen}
        onClose={() => setBedDrawerOpen(false)}
        title={selectedCase?.activeBed ? 'Transferer le lit' : 'Affecter un lit'}
        subtitle="Selectionner le lit a utiliser pour ce sejour"
        variant="drawer"
        actions={(
          <>
            <Btn variant="ghost" onClick={() => setBedDrawerOpen(false)}>Annuler</Btn>
            <Btn variant="primary" type="submit" form="hospital-bed-action-form" disabled={saving || !selectedBedId}>
              {saving ? 'Enregistrement...' : selectedCase?.activeBed ? 'Transferer le lit' : 'Affecter le lit'}
            </Btn>
          </>
        )}
      >
        <form id="hospital-bed-action-form" onSubmit={handleAssignOrTransferBed} className="grid gap-4">
          <label className="text-[12px] font-semibold text-zinc-500">
            Lit
            <select
              value={selectedBedId}
              onChange={(event) => setSelectedBedId(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            >
              <option value="">{selectedCase?.activeBed ? 'Choisir le nouveau lit' : 'Choisir un lit'}</option>
              {availableBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  {bed.bedCode} · {bed.roomCategory} · {bed.service}
                </option>
              ))}
            </select>
          </label>
        </form>
      </OverlayPanel>

      <OverlayPanel
        open={manualDrawerOpen}
        onClose={() => setManualDrawerOpen(false)}
        title="Ajouter un frais manuel"
        subtitle="Saisir un frais complementaire sur le sejour"
        variant="drawer"
        actions={(
          <>
            <Btn variant="ghost" onClick={() => setManualDrawerOpen(false)}>Annuler</Btn>
            <Btn variant="primary" type="submit" form="hospital-manual-charge-form" disabled={saving}>
              {saving ? 'Ajout...' : 'Ajouter le frais'}
            </Btn>
          </>
        )}
      >
        <form id="hospital-manual-charge-form" onSubmit={handleAddManualCharge} className="grid gap-4">
          <label className="text-[12px] font-semibold text-zinc-500">
            Libelle
            <input value={manualCharge.label} onChange={(event) => setManualCharge((current) => ({ ...current, label: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Montant FCFA
            <input type="number" min={0} value={manualCharge.montantFcfa} onChange={(event) => setManualCharge((current) => ({ ...current, montantFcfa: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Service optionnel
            <input value={manualCharge.service} onChange={(event) => setManualCharge((current) => ({ ...current, service: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
        </form>
      </OverlayPanel>

      <OverlayPanel
        open={catalogueDrawerOpen}
        onClose={() => setCatalogueDrawerOpen(false)}
        title="Ajouter depuis le catalogue"
        subtitle="Rechercher un acte ou un produit a rattacher au sejour"
        variant="drawer"
      >
        <div className="space-y-4">
          <input
            value={catalogueQuery}
            onChange={(event) => setCatalogueQuery(event.target.value)}
            placeholder="Nom, code ou service..."
            className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
          />
          <div className="space-y-2">
            {catalogueItems.length === 0 ? (
              <p className="text-[13px] text-zinc-400">Aucun element catalogue.</p>
            ) : (
              catalogueItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleAddCatalogueCharge(item)}
                  className="flex w-full items-center justify-between rounded-2xl border border-zinc-100 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-900">{item.nom}</p>
                    <p className="mt-1 text-[11px] text-zinc-400">{item.codeElement} · {item.service}</p>
                  </div>
                  <span className="font-mono text-[12px] font-bold text-zinc-800">{formatCFA(item.montantFcfa)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </OverlayPanel>

      <OverlayPanel
        open={Boolean(confirmAction && confirmCopy)}
        onClose={() => setConfirmAction(null)}
        title={confirmCopy?.title ?? ''}
        subtitle={confirmCopy?.description}
        variant="modal"
        widthClassName="max-w-xl"
        actions={(
          <>
            <Btn variant="ghost" onClick={() => setConfirmAction(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={() => void executeConfirmAction()} disabled={saving}>
              {saving ? 'Traitement...' : confirmCopy?.cta}
            </Btn>
          </>
        )}
      >
        <p className="text-[13px] text-zinc-500">
          Le sejour concerne {selectedCase.patientNom} ({selectedCase.caseNumber}).
        </p>
      </OverlayPanel>
    </Layout>
  )
}
