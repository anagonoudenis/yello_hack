import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Btn, PageHeader, StatCard } from '@/components/layout/PageHeader'
import { OverlayPanel } from '@/components/shared/OverlayPanel'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCFA } from '@/lib/formatCFA'
import {
  createHospitalBed,
  createHospitalizationTariff,
  listHospitalBeds,
  listHospitalizationTariffs,
} from '@/services/hospitalizationApi'
import type { HospitalBed, HospitalizationTariff } from '@/types/hospitalization'
import { BedDouble, Building2, Plus, RefreshCw, WalletCards } from 'lucide-react'

const defaultBedForm = {
  pavilionName: '',
  roomName: '',
  bedCode: '',
  roomCategory: '',
  service: '',
}

const defaultTariffForm = {
  pavilionName: '',
  roomCategory: '',
  service: '',
  montantJournalierFcfa: '',
  effectiveFrom: new Date().toISOString().slice(0, 10),
}

type ResourcesTab = 'beds' | 'tariffs'

interface HospitalizationResourcesPageProps {
  title: string
  subtitle: string
  canManageTariffs?: boolean
}

export default function HospitalizationResourcesPage({
  title,
  subtitle,
  canManageTariffs = true,
}: HospitalizationResourcesPageProps) {
  const [tab, setTab] = useState<ResourcesTab>('beds')
  const [beds, setBeds] = useState<HospitalBed[]>([])
  const [tariffs, setTariffs] = useState<HospitalizationTariff[]>([])
  const [bedForm, setBedForm] = useState(defaultBedForm)
  const [tariffForm, setTariffForm] = useState(defaultTariffForm)
  const [loading, setLoading] = useState(true)
  const [savingBed, setSavingBed] = useState(false)
  const [savingTariff, setSavingTariff] = useState(false)
  const [bedFormOpen, setBedFormOpen] = useState(false)
  const [tariffFormOpen, setTariffFormOpen] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextBeds, nextTariffs] = await Promise.all([listHospitalBeds(), listHospitalizationTariffs()])
      setBeds(nextBeds)
      setTariffs(nextTariffs)
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, "Impossible de charger les ressources d'hospitalisation."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const occupiedCount = useMemo(() => beds.filter((bed) => bed.occupied).length, [beds])
  const activeBedCount = useMemo(() => beds.filter((bed) => bed.actif).length, [beds])

  const submitBed = async (event: FormEvent) => {
    event.preventDefault()
    setSavingBed(true)
    setError('')
    try {
      await createHospitalBed({
        pavilionName: bedForm.pavilionName,
        roomName: bedForm.roomName,
        bedCode: bedForm.bedCode,
        roomCategory: bedForm.roomCategory,
        service: bedForm.service,
      })
      setBedForm(defaultBedForm)
      setBedFormOpen(false)
      await loadData()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Creation du lit impossible.'))
    } finally {
      setSavingBed(false)
    }
  }

  const submitTariff = async (event: FormEvent) => {
    event.preventDefault()
    setSavingTariff(true)
    setError('')
    try {
      await createHospitalizationTariff({
        pavilionName: tariffForm.pavilionName || undefined,
        roomCategory: tariffForm.roomCategory,
        service: tariffForm.service,
        montantJournalierFcfa: Number(tariffForm.montantJournalierFcfa || 0),
        effectiveFrom: tariffForm.effectiveFrom,
      })
      setTariffForm(defaultTariffForm)
      setTariffFormOpen(false)
      await loadData()
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Creation du tarif impossible.'))
    } finally {
      setSavingTariff(false)
    }
  }

  const bedColumns: Column<HospitalBed>[] = useMemo(() => [
    {
      key: 'bedCode',
      label: 'Code lit',
      render: (row) => <span className="font-mono text-[12px] font-bold text-zinc-800">{row.bedCode}</span>,
    },
    {
      key: 'roomName',
      label: 'Pavillon / Chambre',
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{row.pavilionName}</p>
          <p className="text-[11px] text-zinc-400">{row.roomName}</p>
        </div>
      ),
    },
    {
      key: 'roomCategory',
      label: 'Categorie',
      render: (row) => <span className="text-[12px] text-zinc-600">{row.roomCategory}</span>,
    },
    {
      key: 'service',
      label: 'Service',
      render: (row) => <span className="text-[12px] text-zinc-600">{row.service}</span>,
    },
    {
      key: 'occupied',
      label: 'Etat',
      render: (row) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          row.occupied ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {row.occupied ? 'Occupe' : 'Disponible'}
        </span>
      ),
    },
  ], [])

  const tariffColumns: Column<HospitalizationTariff>[] = useMemo(() => [
    {
      key: 'service',
      label: 'Service',
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{row.service}</p>
          <p className="text-[11px] text-zinc-400">
            {row.roomCategory}
            {row.pavilionName ? ` · ${row.pavilionName}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'montantJournalierFcfa',
      label: 'Montant',
      align: 'right',
      render: (row) => <span className="font-mono text-[12px] font-bold text-zinc-800">{formatCFA(row.montantJournalierFcfa)}</span>,
    },
    {
      key: 'effectiveFrom',
      label: 'Effet',
      render: (row) => <span className="text-[12px] text-zinc-600">{new Date(row.effectiveFrom).toLocaleDateString('fr-FR')}</span>,
    },
  ], [])

  return (
    <Layout>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={(
          <>
            <Btn variant="ghost" icon={RefreshCw} onClick={() => void loadData()} disabled={loading}>
              Actualiser
            </Btn>
            {tab === 'beds' ? (
              <Btn variant="primary" icon={Plus} onClick={() => setBedFormOpen(true)}>
                Nouveau lit
              </Btn>
            ) : canManageTariffs ? (
              <Btn variant="primary" icon={Plus} onClick={() => setTariffFormOpen(true)}>
                Nouveau tarif
              </Btn>
            ) : (
              <span className="text-[12px] font-medium text-zinc-400">Lecture seule</span>
            )}
          </>
        )}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Lits actifs" value={activeBedCount} sub="ressources disponibles" icon={BedDouble} accent />
        <StatCard label="Lits occupes" value={occupiedCount} sub="sejours en cours" icon={Building2} />
        <StatCard label="Tarifs" value={tariffs.length} sub="grille journalier" icon={WalletCards} />
      </div>

      {error && (
        <Card className="mb-5 border border-red-200 bg-red-50">
          <p className="text-[13px] text-red-600">{error}</p>
        </Card>
      )}

      <Card padding="sm">
        <div className="mb-5 flex items-center gap-2 border-b border-zinc-100 pb-4">
          <button
            type="button"
            onClick={() => setTab('beds')}
            className={`relative px-1 pb-2 text-[13px] font-semibold transition-colors ${tab === 'beds' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'}`}
          >
            Lits
            {tab === 'beds' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCB00]" />}
          </button>
          <button
            type="button"
            onClick={() => setTab('tariffs')}
            className={`relative px-1 pb-2 text-[13px] font-semibold transition-colors ${tab === 'tariffs' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'}`}
          >
            Tarifs
            {tab === 'tariffs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCB00]" />}
          </button>
        </div>

        {tab === 'beds' ? (
          <DataTable<HospitalBed>
            columns={bedColumns}
            data={beds}
            searchable={false}
            emptyMessage={loading ? 'Chargement des lits...' : 'Aucun lit configure.'}
          />
        ) : (
          <div className="space-y-4">
            {!canManageTariffs && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] text-zinc-500">
                La grille tarifaire est consultable ici, mais sa creation reste reservee a l'administration.
              </div>
            )}
            <DataTable<HospitalizationTariff>
              columns={tariffColumns}
              data={tariffs}
              searchable={false}
              emptyMessage={loading ? 'Chargement des tarifs...' : "Aucun tarif d'hospitalisation."}
            />
          </div>
        )}
      </Card>

      <OverlayPanel
        open={bedFormOpen}
        onClose={() => setBedFormOpen(false)}
        title="Nouveau lit"
        subtitle="Ajouter un lit exploitable pour les sejours hospitalisation"
        variant="drawer"
        actions={(
          <>
            <Btn variant="ghost" onClick={() => setBedFormOpen(false)}>Annuler</Btn>
            <Btn variant="primary" type="submit" form="hospital-bed-form" disabled={savingBed}>
              {savingBed ? 'Creation...' : 'Creer le lit'}
            </Btn>
          </>
        )}
      >
        <form id="hospital-bed-form" onSubmit={submitBed} className="grid gap-4 sm:grid-cols-2">
          <label className="text-[12px] font-semibold text-zinc-500">
            Pavillon
            <input value={bedForm.pavilionName} onChange={(event) => setBedForm((current) => ({ ...current, pavilionName: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Chambre
            <input value={bedForm.roomName} onChange={(event) => setBedForm((current) => ({ ...current, roomName: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Code lit
            <input value={bedForm.bedCode} onChange={(event) => setBedForm((current) => ({ ...current, bedCode: event.target.value.toUpperCase() }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 font-mono text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Categorie chambre
            <input value={bedForm.roomCategory} onChange={(event) => setBedForm((current) => ({ ...current, roomCategory: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500 sm:col-span-2">
            Service
            <input value={bedForm.service} onChange={(event) => setBedForm((current) => ({ ...current, service: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
        </form>
      </OverlayPanel>

      <OverlayPanel
        open={canManageTariffs && tariffFormOpen}
        onClose={() => setTariffFormOpen(false)}
        title="Nouveau tarif"
        subtitle="Ajouter un tarif journalier pour les sejours hospitalisation"
        variant="drawer"
        actions={(
          <>
            <Btn variant="ghost" onClick={() => setTariffFormOpen(false)}>Annuler</Btn>
            <Btn variant="primary" type="submit" form="hospital-tariff-form" disabled={savingTariff}>
              {savingTariff ? 'Creation...' : 'Creer le tarif'}
            </Btn>
          </>
        )}
      >
        <form id="hospital-tariff-form" onSubmit={submitTariff} className="grid gap-4">
          <label className="text-[12px] font-semibold text-zinc-500">
            Pavillon optionnel
            <input value={tariffForm.pavilionName} onChange={(event) => setTariffForm((current) => ({ ...current, pavilionName: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Categorie chambre
            <input value={tariffForm.roomCategory} onChange={(event) => setTariffForm((current) => ({ ...current, roomCategory: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Service
            <input value={tariffForm.service} onChange={(event) => setTariffForm((current) => ({ ...current, service: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Montant journalier FCFA
            <input type="number" min={0} value={tariffForm.montantJournalierFcfa} onChange={(event) => setTariffForm((current) => ({ ...current, montantJournalierFcfa: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
          <label className="text-[12px] font-semibold text-zinc-500">
            Date d'effet
            <input type="date" value={tariffForm.effectiveFrom} onChange={(event) => setTariffForm((current) => ({ ...current, effectiveFrom: event.target.value }))} required className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]" />
          </label>
        </form>
      </OverlayPanel>
    </Layout>
  )
}
