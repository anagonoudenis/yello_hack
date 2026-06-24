import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { formatDate } from '@/lib/formatDate'
import { getApiErrorMessage } from '@/lib/apiError'
import { useNavigate } from 'react-router-dom'
import { listVisits, updateVisit } from '@/services/visitApi'
import type { VisitCreatePayload, VisitRecord, VisitStatus } from '@/types/visit'
import { UserPlus, Loader2, Edit2, Eye, X } from 'lucide-react'

const MOTIFS = [
  'Consultation generale',
  'Douleurs abdominales',
  'Controle tension',
  'Vaccination',
  'Urgence medicale',
  'Suivi grossesse',
  'Analyse medicale',
  'Traumatisme',
  'Autre',
]

const SERVICES = [
  'Medecine generale',
  'Chirurgie',
  'Maternite',
  'Pharmacie',
  'Cardiologie',
  'Laboratoire',
]

const STATUS_OPTIONS: Array<{ value: '' | VisitStatus; label: string }> = [
  { value: '', label: 'Tous statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_CAISSE', label: 'En caisse' },
  { value: 'SOLDE', label: 'Solde' },
  { value: 'PARTIELLEMENT_SOLDE', label: 'Partiellement solde' },
]

const statusToVariant = (status: VisitRecord['statut']) => {
  if (status === 'SOLDE') return 'solde'
  if (status === 'PARTIELLEMENT_SOLDE') return 'partiel'
  if (status === 'EN_CAISSE') return 'encaisse'
  return 'attente'
}

const parcoursLabel = (parcoursType: VisitRecord['parcoursType']) =>
  parcoursType === 'HOSPITALISATION' ? 'Hospitalisation' : 'Consultation externe'

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function toEditForm(visit: VisitRecord): VisitCreatePayload {
  return {
    patientNom: visit.patientNom,
    patientPrenom: visit.patientPrenom,
    patientTel: visit.patientTel,
    contactUrgenceTel: visit.contactUrgenceTel ?? '',
    motifVisite: visit.motifVisite,
    serviceOriente: visit.serviceOriente,
    parcoursType: visit.parcoursType,
  }
}

export default function Dossiers() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | VisitStatus>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [todayOnly, setTodayOnly] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<VisitRecord | null>(null)
  const [editingVisit, setEditingVisit] = useState<VisitRecord | null>(null)
  const [form, setForm] = useState<VisitCreatePayload>({
    patientNom: '',
    patientPrenom: '',
    patientTel: '',
    contactUrgenceTel: '',
    motifVisite: '',
    serviceOriente: '',
    parcoursType: 'EXTERNE',
  })

  const loadDossiers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listVisits({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        todayOnly,
        dateFrom: todayOnly ? undefined : dateFrom || undefined,
        dateTo: todayOnly ? undefined : dateTo || undefined,
        pageSize: 500,
      })
      setVisits(res.items)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Impossible de charger l'historique accueil."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDossiers()
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [search, statusFilter, dateFrom, dateTo, todayOnly])

  const subtitle = useMemo(() => {
    const base = `${visits.length} dossier${visits.length > 1 ? 's' : ''} charge${visits.length > 1 ? 's' : ''}`
    if (todayOnly) return `${base} pour aujourd'hui`
    if (dateFrom || dateTo) return `${base} sur la periode filtree`
    return `${base} dans l'historique accueil`
  }, [visits.length, todayOnly, dateFrom, dateTo])

  const applyTodayFilter = () => {
    setTodayOnly(true)
    setDateFrom('')
    setDateTo('')
  }

  const clearPeriodFilter = () => {
    setTodayOnly(false)
    setDateFrom('')
    setDateTo('')
  }

  const openEdit = (visit: VisitRecord) => {
    setEditingVisit(visit)
    setForm(toEditForm(visit))
  }

  const saveVisit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingVisit) return

    setSaving(true)
    setError('')
    try {
      const updated = await updateVisit(editingVisit.idVisite, form)
      setEditingVisit(null)
      setSelectedDetail((current) => (current?.idVisite === updated.idVisite ? updated : current))
      setVisits((current) => current.map((item) => (item.idVisite === updated.idVisite ? updated : item)))
      await loadDossiers()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Modification du dossier impossible.'))
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<VisitRecord>[] = useMemo(() => [
    {
      key: 'idVisite',
      label: 'N dossier',
      render: (row) => (
        <span className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[12px] font-black text-amber-700">
          {row.idVisite}
        </span>
      ),
    },
    {
      key: 'patientNomComplet',
      label: 'Patient',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            <span className="text-[10px] font-black text-zinc-500">
              {row.patientNomComplet
                .split(' ')
                .map((chunk) => chunk[0])
                .join('')
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-zinc-800">{row.patientNomComplet}</p>
            <p className="text-[11px] text-zinc-400">{row.patientTel}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'parcoursType',
      label: 'Type de passage',
      render: (row) => (
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
          {parcoursLabel(row.parcoursType)}
        </span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row) => <StatusBadge variant={statusToVariant(row.statut)} />,
    },
    {
      key: 'createdAt',
      label: "Date d'enregistrement",
      render: (row) => <span className="text-[12px] text-zinc-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <RowActionsMenu
          actions={[
            { label: 'Voir les details', icon: Eye, onSelect: () => { setSelectedDetail(row) } },
            { label: 'Modifier', icon: Edit2, onSelect: () => { openEdit(row) } },
          ]}
        />
      ),
    },
  ], [])

  return (
    <Layout>
      <PageHeader
        title="Dossiers patients"
        subtitle={subtitle}
        actions={
          <>
            <Btn variant={todayOnly ? 'secondary' : 'ghost'} onClick={applyTodayFilter}>
              Aujourd'hui
            </Btn>
            <Btn variant={!todayOnly && !dateFrom && !dateTo ? 'secondary' : 'ghost'} onClick={clearPeriodFilter}>
              Historique
            </Btn>
            <Btn variant="primary" icon={UserPlus} onClick={() => navigate('/accueil/enregistrement')}>
              Nouveau patient
            </Btn>
          </>
        }
      />

      <Card padding="sm">
        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </p>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numero, nom, prenom ou telephone..."
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3.5 text-[14px] outline-none transition-all duration-100 placeholder:text-zinc-300 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | VisitStatus)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3.5 text-[14px] outline-none transition-all duration-100 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setTodayOnly(false)
              setDateFrom(e.target.value)
            }}
            max={dateTo || undefined}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3.5 text-[14px] outline-none transition-all duration-100 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setTodayOnly(false)
              setDateTo(e.target.value)
            }}
            min={dateFrom || undefined}
            max={getTodayIso()}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3.5 text-[14px] outline-none transition-all duration-100 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Chargement des dossiers...
          </div>
        ) : (
          <DataTable<VisitRecord>
            columns={columns}
            data={visits}
            searchable={false}
            emptyMessage={todayOnly ? "Aucun dossier enregistre aujourd'hui." : 'Aucun dossier sur cette selection.'}
          />
        )}
      </Card>

      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">Detail du dossier</h2>
                <p className="text-[12px] text-zinc-400">{selectedDetail.idVisite}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Patient</p>
                <p className="mt-1 text-[14px] font-semibold text-zinc-900">{selectedDetail.patientNomComplet}</p>
                <p className="text-[13px] text-zinc-500">{selectedDetail.patientTel}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Contact urgence</p>
                <p className="mt-1 text-[14px] text-zinc-700">{selectedDetail.contactUrgenceTel || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Type de passage</p>
                <p className="mt-1 text-[14px] text-zinc-700">{parcoursLabel(selectedDetail.parcoursType)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Statut</p>
                <div className="mt-1">
                  <StatusBadge variant={statusToVariant(selectedDetail.statut)} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Motif</p>
                <p className="mt-1 text-[14px] text-zinc-700">{selectedDetail.motifVisite}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Service</p>
                <p className="mt-1 text-[14px] text-zinc-700">{selectedDetail.serviceOriente}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Date d'enregistrement
                </p>
                <p className="mt-1 text-[14px] text-zinc-700">{formatDate(selectedDetail.createdAt)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-4">
              <Btn variant="ghost" onClick={() => setSelectedDetail(null)}>
                Fermer
              </Btn>
              <Btn
                variant="primary"
                icon={Edit2}
                onClick={() => {
                  openEdit(selectedDetail)
                  setSelectedDetail(null)
                }}
              >
                Modifier
              </Btn>
            </div>
          </div>
        </div>
      )}

      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveVisit}
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-zinc-900">Modifier le dossier</h2>
                <p className="text-[12px] text-zinc-400">
                  {editingVisit.idVisite} - cree le {formatDate(editingVisit.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVisit(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="text-[12px] font-semibold text-zinc-500">
                Nom
                <input
                  value={form.patientNom}
                  onChange={(event) => setForm((current) => ({ ...current, patientNom: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Prenom
                <input
                  value={form.patientPrenom}
                  onChange={(event) => setForm((current) => ({ ...current, patientPrenom: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Telephone
                <input
                  value={form.patientTel}
                  onChange={(event) => setForm((current) => ({ ...current, patientTel: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Contact d'urgence
                <input
                  value={form.contactUrgenceTel || ''}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contactUrgenceTel: event.target.value }))
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                />
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Motif
                <select
                  value={form.motifVisite}
                  onChange={(event) => setForm((current) => ({ ...current, motifVisite: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                >
                  {MOTIFS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] font-semibold text-zinc-500">
                Service
                <select
                  value={form.serviceOriente}
                  onChange={(event) => setForm((current) => ({ ...current, serviceOriente: event.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                >
                  {SERVICES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] font-semibold text-zinc-500 md:col-span-2">
                Type de passage
                <select
                  value={form.parcoursType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      parcoursType: event.target.value as VisitCreatePayload['parcoursType'],
                    }))
                  }
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px] outline-none transition-all focus:border-[#FFCB00]"
                >
                  <option value="EXTERNE">Consultation externe</option>
                  <option value="HOSPITALISATION">Hospitalisation</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-4">
              <Btn variant="ghost" onClick={() => setEditingVisit(null)}>
                Annuler
              </Btn>
              <Btn variant="primary" type="submit" disabled={saving} icon={saving ? Loader2 : undefined}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Btn>
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}
