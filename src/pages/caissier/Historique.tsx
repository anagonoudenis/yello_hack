import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'

interface Tx { id: string; patient: string; montant: number; mode: string; statut: 'solde' | 'partiel' | 'attente'; date: Date; ref: string }

const DATA: Tx[] = [
  { id: 'FA-229-000145', patient: 'Fatima Kouassi',     montant: 7000,  mode: 'MoMo',    statut: 'solde',   date: new Date('2026-06-23T14:32:00'), ref: 'MTN-2026-749-XK91' },
  { id: 'FA-229-000144', patient: 'Kofi Mensah',        montant: 3500,  mode: 'Espèces', statut: 'solde',   date: new Date('2026-06-23T13:15:00'), ref: '—' },
  { id: 'FA-229-000143', patient: 'Aïcha Traoré',       montant: 9000,  mode: 'Chèque',  statut: 'partiel', date: new Date('2026-06-23T11:40:00'), ref: 'CHQ-00892' },
  { id: 'FA-229-000142', patient: 'Jean-Baptiste D.',   montant: 2000,  mode: 'MoMo',    statut: 'solde',   date: new Date('2026-06-23T10:05:00'), ref: 'MTN-2026-748-PR44' },
  { id: 'FA-229-000141', patient: 'Marie Ahoué',        montant: 15000, mode: 'Espèces', statut: 'solde',   date: new Date('2026-06-23T09:20:00'), ref: '—' },
  { id: 'FA-229-000140', patient: 'Pierre Agossou',     montant: 4500,  mode: 'MoMo',    statut: 'attente', date: new Date('2026-06-22T16:50:00'), ref: '—' },
]

const MODE_STYLE: Record<string, string> = {
  MoMo: 'bg-amber-50 text-amber-700 border border-amber-200',
  Espèces: 'bg-green-50 text-green-700 border border-green-200',
  Chèque: 'bg-blue-50 text-blue-700 border border-blue-200',
}

const COLS: Column<Tx>[] = [
  { key: 'id', label: 'Facture', render: (r) => <span className="font-mono text-[12px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">{r.id}</span> },
  { key: 'patient', label: 'Patient', render: (r) => (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-black text-zinc-500">{r.patient.split(' ').map((n) => n[0]).join('').slice(0,2)}</span>
      </div>
      <span className="text-[13px] font-semibold text-zinc-800">{r.patient}</span>
    </div>
  )},
  { key: 'montant', label: 'Montant', align: 'right', sortable: true, render: (r) => <span className="font-mono font-bold text-[13px] text-zinc-900">{formatCFA(r.montant)}</span> },
  { key: 'mode', label: 'Mode', render: (r) => <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${MODE_STYLE[r.mode]}`}>{r.mode}</span> },
  { key: 'statut', label: 'Statut', render: (r) => <StatusBadge variant={r.statut} /> },
  { key: 'ref', label: 'Référence', render: (r) => <span className="font-mono text-[11px] text-zinc-400">{r.ref}</span> },
  { key: 'date', label: 'Date', render: (r) => <span className="text-[12px] text-zinc-400">{formatDate(r.date)}</span> },
]

export default function Historique() {
  const total = DATA.filter((d) => d.statut === 'solde').reduce((s, d) => s + d.montant, 0)
  return (
    <Layout>
      <PageHeader
        title="Historique des transactions"
        subtitle="Toutes les factures émises sur votre caisse"
        actions={
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total encaissé</p>
            <p className="font-mono font-black text-[20px] text-zinc-900">{formatCFA(total)}</p>
          </div>
        }
      />
      <Card padding="sm">
        <DataTable<Tx> columns={COLS} data={DATA} searchable searchKeys={['patient', 'id', 'mode']}
          emptyMessage="Aucune transaction enregistrée pour cette caisse aujourd'hui" />
      </Card>
    </Layout>
  )
}
