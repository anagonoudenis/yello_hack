import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader } from '@/components/layout/PageHeader'
import { OverlayPanel } from '@/components/shared/OverlayPanel'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import {
  assignHospitalBed,
  closeHospitalizationAdmin,
  createHospitalization,
  getHospitalization,
  listHospitalBeds,
  listHospitalizations,
  markActualDischarge,
  markMedicalDischarge,
  transferHospitalBed,
} from '@/services/hospitalizationApi'
import type { HospitalBed, HospitalizationCase } from '@/types/hospitalization'
import {
  ArrowRightLeft,
  BedDouble,
  CircleCheck,
  ClipboardCheck,
  DoorOpen,
  Eye,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'

type ConfirmAction = 'medical' | 'actual' | 'close' | null

function getPaymentStatus(caseItem: HospitalizationCase) {
  return caseItem.clearance.resteAPayerFcfa === 0
    ? { label: 'Solde', className: 'bg-emerald-50 text-emerald-700' }
    : { label: 'Non solde', className: 'bg-red-50 text-red-600' }
}

function getStayStatus(caseItem: HospitalizationCase) {
  if (caseItem.status === 'CLOSED') {
    return { label: 'Cloture', className: 'bg-zinc-100 text-zinc-600' }
  }
  if (caseItem.actualDischargeAt) {
    return { label: 'Patient sorti', className: 'bg-blue-50 text-blue-700' }
  }
  if (caseItem.dischargeMedicalAt) {
    return { label: 'Sortie medicale prononcee', className: 'bg-amber-50 text-amber-700' }
  }
  if (caseItem.status === 'TRANSFERRED') {
    return { label: 'Transfere', className: 'bg-sky-50 text-sky-700' }
  }
  if (caseItem.status === 'CANCELED') {
    return { label: 'Annule', className: 'bg-red-50 text-red-700' }
  }
  return { label: 'En cours', className: 'bg-emerald-50 text-emerald-700' }
}

function resolveDisplayedBed(caseItem: HospitalizationCase, bedsByCode: Record<string, HospitalBed>) {
  if (caseItem.activeBed) return caseItem.activeBed

  const lastMovement = [...caseItem.bedMovements].reverse().find(
    (movement) => movement.toBedCode || movement.fromBedCode,
  )
  const fallbackCode = lastMovement?.toBedCode ?? lastMovement?.fromBedCode ?? null
  return fallbackCode ? bedsByCode[fallbackCode] ?? null : null
}

export default function SejoursRecouvrement() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visitId, setVisitId] = useState('')
  const [selectedBedId, setSelectedBedId] = useState('')
  const [beds, setBeds] = useState<HospitalBed[]>([])
  const [items, setItems] = useState<HospitalizationCase[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [bedDrawerOpen, setBedDrawerOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [selectedCase, setSelectedCase] = useState<HospitalizationCase | null>(null)

  const bedsByCode = useMemo(
    () => Object.fromEntries(beds.map((bed) => [bed.bedCode, bed])),
    [beds],
  )

  const assignableBeds = useMemo(() => {
    if (!selectedCase) return beds.filter((bed) => bed.actif && !bed.occupied)
    return beds.filter((bed) => bed.actif && (!bed.occupied || bed.id === selectedCase.activeBed?.id))
  }, [beds, selectedCase])

  const openableBeds = useMemo(
    () => beds.filter((bed) => bed.actif && !bed.occupied),
    [beds],
  )

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [caseResponse, bedResponse] = await Promise.all([
        listHospitalizations(search.trim() || undefined, statusFilter || undefined),
        listHospitalBeds(),
      ])
      setItems(caseResponse.items)
      setTotal(caseResponse.total)
      setBeds(bedResponse)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger les sejours d'hospitalisation."))
    } finally {
      setLoading(false)
    }
  }

  const loadCase = async (caseNumber: string) => {
    setDetailLoading(true)
    try {
      const detail = await getHospitalization(caseNumber)
      setSelectedCase(detail)
      return detail
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger le detail du sejour."))
      return null
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load()
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search, statusFilter])

  const openCase = async (event: FormEvent) => {
    event.preventDefault()
    if (!visitId.trim()) return
    setSaving(true)
    setError('')
    try {
      const created = await createHospitalization({
        idVisite: visitId.trim().toUpperCase(),
        admissionAt: new Date().toISOString(),
        initialBedId: selectedBedId ? Number(selectedBedId) : null,
      })
      setVisitId('')
      setSelectedBedId('')
      setOpenModal(false)
      await load()
      setSelectedCase(created)
      setDetailOpen(true)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Ouverture du sejour impossible. Verifie le dossier d'admission."))
    } finally {
      setSaving(false)
    }
  }

  const openDetails = async (caseItem: HospitalizationCase) => {
    setDetailOpen(true)
    setSelectedCase(caseItem)
    return loadCase(caseItem.caseNumber)
  }

  const openBedDrawer = async (caseItem: HospitalizationCase) => {
    const detail = await openDetails(caseItem)
    if (!detail) return
    setSelectedBedId('')
    setBedDrawerOpen(true)
  }

  const openConfirm = async (caseItem: HospitalizationCase, action: Exclude<ConfirmAction, null>) => {
    const detail = await openDetails(caseItem)
    if (!detail) return
    setConfirmAction(action)
  }

  const submitBedAction = async (event: FormEvent) => {
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
      await load()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible d'enregistrer l'affectation du lit."))
    } finally {
      setSaving(false)
    }
  }

  const runConfirmedAction = async () => {
    if (!selectedCase || !confirmAction) return
    setSaving(true)
    setError('')
    try {
      let nextCase = selectedCase
      if (confirmAction === 'medical') {
        nextCase = await markMedicalDischarge(selectedCase.caseNumber)
      } else if (confirmAction === 'actual') {
        nextCase = await markActualDischarge(selectedCase.caseNumber)
      } else if (confirmAction === 'close') {
        nextCase = await closeHospitalizationAdmin(selectedCase.caseNumber)
      }
      setSelectedCase(nextCase)
      setConfirmAction(null)
      await load()
    } catch (nextError) {
      const messages: Record<Exclude<ConfirmAction, null>, string> = {
        medical: "Impossible d'enregistrer la sortie medicale.",
        actual: "Impossible d'enregistrer la sortie reelle.",
        close: "Cloture administrative impossible pour ce sejour.",
      }
      setError(getApiErrorMessage(nextError, messages[confirmAction]))
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<HospitalizationCase>[] = [
    {
      key: 'caseNumber',
      label: 'Numero sejour',
      render: (row) => (
        <div>
          <p className="font-mono text-[12px] font-bold text-amber-700">{row.caseNumber}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{row.visitId}</p>
        </div>
      ),
    },
    {
      key: 'patientNom',
      label: 'Patient',
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{row.patientNom}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{row.patientTel}</p>
        </div>
      ),
    },
    {
      key: 'pavilion',
      label: 'Pavillon',
      render: (row) => (
        <span className="text-[12px] text-zinc-600">
          {resolveDisplayedBed(row, bedsByCode)?.pavilionName ?? 'Non affecte'}
        </span>
      ),
    },
    {
      key: 'bed',
      label: 'Lit',
      render: (row) => {
        const displayedBed = resolveDisplayedBed(row, bedsByCode)
        return (
          <div>
            <p className="text-[12px] font-medium text-zinc-700">{displayedBed?.bedCode ?? 'Aucun'}</p>
            <p className="mt-1 text-[11px] text-zinc-400">{displayedBed?.roomName ?? '-'}</p>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Statut sejour',
      render: (row) => {
        const stayStatus = getStayStatus(row)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${stayStatus.className}`}>
            {stayStatus.label}
          </span>
        )
      },
    },
    {
      key: 'paymentStatus',
      label: 'Statut paiement',
      render: (row) => {
        const paymentStatus = getPaymentStatus(row)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatus.className}`}>
            {paymentStatus.label}
          </span>
        )
      },
    },
    {
      key: 'actualDischargeAt',
      label: 'Date sortie reelle',
      render: (row) => (
        <span className="text-[12px] text-zinc-600">
          {row.actualDischargeAt ? formatDate(row.actualDischargeAt) : '-'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const canManageStay =
          row.status !== 'CLOSED' &&
          row.status !== 'TRANSFERRED' &&
          row.status !== 'CANCELED' &&
          !row.actualDischargeAt
        const canClose = row.status !== 'CLOSED' && row.actualDischargeAt && row.clearance.resteAPayerFcfa === 0

        return (
          <RowActionsMenu
            actions={[
              { label: 'Voir le detail', icon: Eye, onSelect: () => openDetails(row) },
              {
                label: row.activeBed ? 'Transferer le lit' : 'Affecter un lit',
                icon: row.activeBed ? ArrowRightLeft : BedDouble,
                hidden: !canManageStay,
                onSelect: () => openBedDrawer(row),
              },
              {
                label: 'Marquer sortie medicale',
                icon: ClipboardCheck,
                hidden: !canManageStay || Boolean(row.dischargeMedicalAt),
                onSelect: () => openConfirm(row, 'medical'),
              },
              {
                label: 'Marquer sortie reelle',
                icon: DoorOpen,
                hidden: !canManageStay,
                onSelect: () => openConfirm(row, 'actual'),
              },
              {
                label: 'Cloturer',
                icon: CircleCheck,
                tone: 'success',
                hidden: !canClose,
                onSelect: () => openConfirm(row, 'close'),
              },
            ]}
          />
        )
      },
    },
  ]

  const selectedPaymentStatus = selectedCase ? getPaymentStatus(selectedCase) : null
  const selectedStayStatus = selectedCase ? getStayStatus(selectedCase) : null
  const selectedDisplayedBed = selectedCase ? resolveDisplayedBed(selectedCase, bedsByCode) : null
  const selectedCanManageStay = Boolean(
    selectedCase &&
      selectedCase.status !== 'CLOSED' &&
      selectedCase.status !== 'TRANSFERRED' &&
      selectedCase.status !== 'CANCELED' &&
      !selectedCase.actualDischargeAt,
  )
  const selectedCanClose = Boolean(
    selectedCase &&
      selectedCase.status !== 'CLOSED' &&
      selectedCase.actualDischargeAt &&
      selectedCase.clearance.resteAPayerFcfa === 0,
  )

  const confirmTitleMap: Record<Exclude<ConfirmAction, null>, string> = {
    medical: 'Marquer la sortie medicale',
    actual: 'Marquer la sortie reelle',
    close: 'Cloturer le sejour',
  }

  const confirmDescriptionMap: Record<Exclude<ConfirmAction, null>, string> = {
    medical: "Cette action conserve la facturation active tant que le patient n'a pas quitte le service.",
    actual: 'Le lit sera libere tout de suite et les journees futures ne seront plus ajoutees.',
    close: "La cloture administrative reste impossible tant que le dossier n'est pas integralement solde.",
  }

  return (
    <Layout>
      <PageHeader
        title="Sejours hospitalisation"
        subtitle={`${total} sejours consultables pour le recouvrement`}
        actions={(
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => void load()} disabled={loading}>
              Actualiser
            </Btn>
            <Btn variant="primary" icon={Plus} onClick={() => setOpenModal(true)}>
              Ouvrir un sejour
            </Btn>
          </>
        )}
      />

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <Card padding="sm">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="HOSP, VIS, patient, telephone..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="OPEN">En cours</option>
            <option value="PENDING_EXIT">Sortie en attente</option>
            <option value="CLOSED">Cloture</option>
            <option value="TRANSFERRED">Transfere</option>
            <option value="CANCELED">Annule</option>
          </select>
        </div>

        <DataTable<HospitalizationCase>
          columns={columns}
          data={items}
          searchable={false}
          emptyMessage={loading ? 'Chargement des sejours...' : 'Aucun sejour trouve.'}
        />
      </Card>

      <OverlayPanel
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Ouvrir un sejour"
        subtitle="Associer un dossier visite hospitalisation et, si besoin, affecter un lit des l'ouverture."
        actions={(
          <>
            <Btn variant="ghost" onClick={() => setOpenModal(false)}>Annuler</Btn>
            <Btn variant="primary" type="submit" form="open-hospitalization-form" disabled={saving || !visitId.trim()}>
              {saving ? 'Ouverture...' : 'Ouvrir le sejour'}
            </Btn>
          </>
        )}
      >
        <form id="open-hospitalization-form" onSubmit={openCase} className="grid gap-4">
          <label className="text-[12px] font-semibold text-zinc-500">
            Numero de visite
            <input
              value={visitId}
              onChange={(event) => setVisitId(event.target.value.toUpperCase())}
              placeholder="VIS-XXXX"
              required
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 font-mono text-[14px]"
            />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Lit initial optionnel
            <select
              value={selectedBedId}
              onChange={(event) => setSelectedBedId(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            >
              <option value="">Sans lit initial</option>
              {openableBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  {bed.bedCode} · {bed.pavilionName}
                </option>
              ))}
            </select>
          </label>
        </form>
      </OverlayPanel>

      <OverlayPanel
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedCase ? `Sejour ${selectedCase.caseNumber}` : 'Detail sejour'}
        subtitle={selectedCase ? `${selectedCase.visitId} · ${selectedCase.patientNom}` : 'Chargement du sejour'}
        widthClassName="max-w-4xl"
      >
        {!selectedCase || detailLoading ? (
          <p className="text-[13px] text-zinc-400">Chargement du sejour...</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Identite patient</p>
                <p className="mt-2 text-[18px] font-bold text-zinc-900">{selectedCase.patientNom}</p>
                <p className="mt-1 text-[13px] text-zinc-500">{selectedCase.patientTel}</p>
                <p className="mt-1 text-[12px] text-zinc-400">{selectedCase.visitId} · {selectedCase.serviceOriente}</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Situation</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedStayStatus && (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${selectedStayStatus.className}`}>
                      {selectedStayStatus.label}
                    </span>
                  )}
                  {selectedPaymentStatus && (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${selectedPaymentStatus.className}`}>
                      {selectedPaymentStatus.label}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[12px] text-zinc-400">Admission {formatDate(selectedCase.admissionAt)}</p>
                <p className="mt-1 text-[12px] text-zinc-400">
                  Sortie reelle {selectedCase.actualDischargeAt ? formatDate(selectedCase.actualDischargeAt) : 'non renseignee'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Pavillon</p>
                <p className="mt-2 text-[14px] font-semibold text-zinc-900">{selectedDisplayedBed?.pavilionName ?? 'Non affecte'}</p>
                <p className="mt-1 text-[12px] text-zinc-400">Chambre {selectedDisplayedBed?.roomName ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Lit</p>
                <p className="mt-2 text-[14px] font-semibold text-zinc-900">{selectedDisplayedBed?.bedCode ?? 'Aucun lit'}</p>
                <p className="mt-1 text-[12px] text-zinc-400">{selectedDisplayedBed?.roomCategory ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Dates</p>
                <p className="mt-2 text-[12px] text-zinc-600">Admission: {formatDate(selectedCase.admissionAt)}</p>
                <p className="mt-1 text-[12px] text-zinc-600">
                  Sortie reelle: {selectedCase.actualDischargeAt ? formatDate(selectedCase.actualDischargeAt) : 'Non renseignee'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total dossier</p>
                <p className="mt-2 font-mono text-[22px] font-black text-zinc-900">{formatCFA(selectedCase.clearance.totalCumuleFcfa)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Montant paye</p>
                <p className="mt-2 font-mono text-[22px] font-black text-emerald-700">{formatCFA(selectedCase.clearance.totalPayeFcfa)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Reste a payer</p>
                <p className="mt-2 font-mono text-[22px] font-black text-red-600">{formatCFA(selectedCase.clearance.resteAPayerFcfa)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCanManageStay && (
                <Btn
                  variant="ghost"
                  icon={selectedCase.activeBed ? ArrowRightLeft : BedDouble}
                  onClick={() => setBedDrawerOpen(true)}
                >
                  {selectedCase.activeBed ? 'Transferer' : 'Affecter lit'}
                </Btn>
              )}
              {selectedCanManageStay && !selectedCase.dischargeMedicalAt && (
                <Btn
                  variant="ghost"
                  icon={ClipboardCheck}
                  onClick={() => setConfirmAction('medical')}
                >
                  Marquer sortie medicale
                </Btn>
              )}
              {selectedCanManageStay && (
                <Btn
                  variant="ghost"
                  icon={DoorOpen}
                  onClick={() => setConfirmAction('actual')}
                >
                  Marquer sortie reelle
                </Btn>
              )}
              {selectedCanClose && (
                <Btn
                  variant="primary"
                  icon={CircleCheck}
                  onClick={() => setConfirmAction('close')}
                  disabled={saving}
                >
                  Cloturer
                </Btn>
              )}
            </div>
          </div>
        )}
      </OverlayPanel>

      <OverlayPanel
        open={bedDrawerOpen}
        onClose={() => setBedDrawerOpen(false)}
        title={selectedCase?.activeBed ? 'Transferer le lit' : 'Affecter un lit'}
        subtitle="Choisir un lit disponible pour ce sejour."
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
        <form id="hospital-bed-action-form" onSubmit={submitBedAction} className="grid gap-4">
          <label className="text-[12px] font-semibold text-zinc-500">
            Lit
            <select
              value={selectedBedId}
              onChange={(event) => setSelectedBedId(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            >
              <option value="">{selectedCase?.activeBed ? 'Choisir le nouveau lit' : 'Choisir un lit'}</option>
              {assignableBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  {bed.bedCode} · {bed.pavilionName} · {bed.roomCategory}
                </option>
              ))}
            </select>
          </label>
        </form>
      </OverlayPanel>

      <OverlayPanel
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction ? confirmTitleMap[confirmAction] : 'Confirmation'}
        subtitle={confirmAction ? confirmDescriptionMap[confirmAction] : undefined}
        widthClassName="max-w-xl"
        actions={(
          <>
            <Btn variant="ghost" onClick={() => setConfirmAction(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={() => void runConfirmedAction()} disabled={saving}>
              {saving ? 'Validation...' : 'Confirmer'}
            </Btn>
          </>
        )}
      >
        <p className="text-[13px] text-zinc-500">
          {selectedCase
            ? `${selectedCase.caseNumber} · reste a payer ${formatCFA(selectedCase.clearance.resteAPayerFcfa)}`
            : 'Chargement du sejour...'}
        </p>
      </OverlayPanel>
    </Layout>
  )
}
