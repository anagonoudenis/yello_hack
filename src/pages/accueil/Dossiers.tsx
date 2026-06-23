import { useEffect, useMemo, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { useNavigate } from 'react-router-dom'
import { listVisits } from '@/services/visitApi'
import type { VisitRecord } from '@/types/visit'
import { UserPlus, Clock, CheckCircle, CreditCard, Loader2 } from 'lucide-react'

const statusToVariant = (status: VisitRecord['statut']) => {
  if (status === 'SOLDE') return 'solde'
  if (status === 'PARTIELLEMENT_SOLDE') return 'partiel'
  if (status === 'EN_CAISSE') return 'encaisse'
  return 'attente'
}

const COLS: Column<VisitRecord>[] = [
  {
    key: 'idVisite',
    label: 'N° Dossier',
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
    key: 'motifVisite',
    label: 'Motif',
    render: (row) => <span className="text-[13px] text-zinc-600">{row.motifVisite}</span>,
  },
  {
    key: 'serviceOriente',
    label: 'Service',
    render: (row) => (
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
        {row.serviceOriente}
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
    label: 'Enregistre',
    render: (row) => <span className="text-[12px] text-zinc-400">{formatDate(row.createdAt)}</span>,
  },
]

export default function Dossiers() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await listVisits({ todayOnly: true, pageSize: 200 })
        if (active) setVisits(res.items)
      } catch {
        if (active) setError('Impossible de charger les dossiers du jour.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [])

  const counters = useMemo(
    () => ({
      attente: visits.filter((item) => item.statut === 'EN_ATTENTE').length,
      encaisse: visits.filter((item) => item.statut === 'EN_CAISSE').length,
      clotures: visits.filter((item) => item.statut === 'SOLDE' || item.statut === 'PARTIELLEMENT_SOLDE')
        .length,
    }),
    [visits]
  )

  return (
    <Layout>
      <PageHeader
        title="Dossiers patients"
        subtitle={`${visits.length} dossier${visits.length > 1 ? 's' : ''} charge${visits.length > 1 ? 's' : ''} pour aujourd'hui`}
        actions={
          <Btn variant="primary" icon={UserPlus} onClick={() => navigate('/accueil/enregistrement')}>
            Nouveau patient
          </Btn>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: 'En attente',
            count: counters.attente,
            icon: Clock,
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-200',
            iconColor: 'text-amber-500',
          },
          {
            label: 'En caisse',
            count: counters.encaisse,
            icon: CreditCard,
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-200',
            iconColor: 'text-blue-500',
          },
          {
            label: 'Clotures',
            count: counters.clotures,
            icon: CheckCircle,
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-200',
            iconColor: 'text-green-500',
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`${item.bg} ${item.border} flex items-center gap-4 rounded-2xl border p-5`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${item.border} bg-white`}>
              <item.icon size={16} className={item.iconColor} />
            </div>
            <div>
              <p className={`text-[28px] font-black leading-none ${item.text}`}>{item.count}</p>
              <p className={`mt-0.5 text-[12px] font-semibold ${item.text}`}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding="sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Chargement des dossiers...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-[13px] text-red-500">{error}</div>
        ) : (
          <DataTable<VisitRecord>
            columns={COLS}
            data={visits}
            searchable
            searchKeys={['patientNomComplet', 'idVisite', 'serviceOriente', 'motifVisite', 'patientTel']}
            emptyMessage="Aucun dossier enregistre aujourd'hui."
          />
        )}
      </Card>
    </Layout>
  )
}
