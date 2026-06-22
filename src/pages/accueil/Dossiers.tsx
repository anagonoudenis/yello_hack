import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { useNavigate } from 'react-router-dom'
import useVisitStore from '@/store/visitStore'
import type { Dossier } from '@/lib/constants'
import { UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const COLS: Column<Dossier>[] = [
  { key: 'id', label: 'N° Dossier', render: (r) => (
    <span className="font-mono text-[12px] font-black px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">{r.id}</span>
  )},
  { key: 'nom', label: 'Patient', render: (r) => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-black text-zinc-500">{r.nom.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-zinc-800">{r.nom}</p>
        <p className="text-[11px] text-zinc-400">{r.tel}</p>
      </div>
    </div>
  )},
  { key: 'motif', label: 'Motif', render: (r) => <span className="text-[13px] text-zinc-600">{r.motif}</span> },
  { key: 'service', label: 'Service', render: (r) => (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600">{r.service}</span>
  )},
  { key: 'statut', label: 'Statut', render: (r) => (
    <StatusBadge variant={r.statut === 'SOLDE' ? 'solde' : r.statut === 'EN_ATTENTE' ? 'attente' : 'partiel'} />
  )},
  { key: 'date', label: 'Enregistré', render: (r) => <span className="text-[12px] text-zinc-400">{formatDate(r.date)}</span> },
]

export default function Dossiers() {
  const { dossiers } = useVisitStore()
  const navigate = useNavigate()
  const total = dossiers.length
  const soldes = dossiers.filter((d) => d.statut === 'SOLDE').length
  const attente = dossiers.filter((d) => d.statut === 'EN_ATTENTE').length
  const partiel = dossiers.filter((d) => d.statut === 'PARTIELLEMENT_SOLDE').length

  return (
    <Layout>
      <PageHeader
        title="Dossiers patients"
        subtitle={`${total} dossier${total > 1 ? 's' : ''} enregistré${total > 1 ? 's' : ''} aujourd'hui`}
        actions={<Btn variant="primary" icon={UserPlus} onClick={() => navigate('/accueil/enregistrement')}>Nouveau patient</Btn>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'En attente', count: attente, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconColor: 'text-amber-500' },
          { label: 'Soldés',     count: soldes,  icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', iconColor: 'text-green-500' },
          { label: 'Partiels',   count: partiel, icon: AlertCircle, bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200',  iconColor: 'text-blue-500' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl border ${s.border} p-5 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-2xl bg-white flex items-center justify-center border ${s.border}`}>
              <s.icon size={16} className={s.iconColor} />
            </div>
            <div>
              <p className={`font-black text-[28px] ${s.text} leading-none`}>{s.count}</p>
              <p className={`text-[12px] font-semibold ${s.text} mt-0.5`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding="sm">
        <DataTable<Dossier>
          columns={COLS} data={dossiers}
          searchable searchKeys={['nom', 'id', 'service', 'motif']}
          emptyMessage="Aucun dossier enregistré — cliquez sur Nouveau patient pour commencer"
        />
      </Card>
    </Layout>
  )
}
