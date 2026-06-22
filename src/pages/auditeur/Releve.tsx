import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { Download, ScrollText, TrendingUp, Wallet } from 'lucide-react'

interface Releve {
  id: string; date: Date; caisse: string; caissier: string
  total: number; momo: number; especes: number; cheque: number
  ecart: number; statut: 'solde' | 'critique'
}

const DATA: Releve[] = [
  { id: 'REL-2026-0623-A', date: new Date('2026-06-23T23:00:00'), caisse: 'Caisse principale',    caissier: 'Amadou K.',   total: 168000, momo: 98000, especes: 52000, cheque: 18000, ecart: 0,      statut: 'solde' },
  { id: 'REL-2026-0623-B', date: new Date('2026-06-23T23:00:00'), caisse: 'Caisse Pharmacie',     caissier: 'Romuald D.',  total: 31500,  momo: 12000, especes: 19500, cheque: 0,     ecart: -15000, statut: 'critique' },
  { id: 'REL-2026-0622-A', date: new Date('2026-06-22T23:00:00'), caisse: 'Caisse principale',    caissier: 'Amadou K.',   total: 143500, momo: 87000, especes: 56500, cheque: 0,     ecart: 0,      statut: 'solde' },
  { id: 'REL-2026-0622-B', date: new Date('2026-06-22T23:00:00'), caisse: 'Caisse 2 — Maternité', caissier: 'Béatrice A.', total: 97500,  momo: 41000, especes: 56500, cheque: 0,     ecart: 0,      statut: 'solde' },
]

const COLS: Column<Releve>[] = [
  { key: 'id', label: 'N° Relevé', render: (r) => <span className="font-mono text-[12px] font-semibold text-zinc-500">{r.id}</span> },
  { key: 'date', label: 'Date', render: (r) => <span className="text-[13px] text-zinc-700">{formatDate(r.date)}</span> },
  { key: 'caisse', label: 'Caisse', render: (r) => (
    <div><p className="text-[13px] font-semibold text-zinc-800">{r.caisse}</p><p className="text-[11px] text-zinc-400">{r.caissier}</p></div>
  )},
  { key: 'total',   label: 'Total',   align: 'right', sortable: true, render: (r) => <span className="font-mono font-black text-[14px] text-zinc-900">{formatCFA(r.total)}</span> },
  { key: 'momo',    label: 'MoMo',    align: 'right', render: (r) => <span className="font-mono text-[12px] text-zinc-600">{formatCFA(r.momo)}</span> },
  { key: 'especes', label: 'Espèces', align: 'right', render: (r) => <span className="font-mono text-[12px] text-zinc-600">{formatCFA(r.especes)}</span> },
  { key: 'ecart', label: 'Écart', align: 'right', render: (r) => (
    <span className={`font-mono font-bold text-[13px] ${r.ecart === 0 ? 'text-green-600' : 'text-red-600'}`}>
      {r.ecart === 0 ? '✓' : (r.ecart > 0 ? '+' : '') + formatCFA(r.ecart)}
    </span>
  )},
  { key: 'statut', label: 'Statut', render: (r) => <StatusBadge variant={r.statut} /> },
]

export default function Releve() {
  const totalMoMo    = DATA.reduce((s, d) => s + d.momo, 0)
  const totalEspeces = DATA.reduce((s, d) => s + d.especes, 0)
  const totalCheque  = DATA.reduce((s, d) => s + d.cheque, 0)
  const totalAll     = DATA.reduce((s, d) => s + d.total, 0)

  return (
    <Layout>
      <PageHeader
        title="Relevé MoMo"
        subtitle="Synthèse des paiements Mobile Money pour audit"
        actions={<Btn variant="ghost" icon={Download}>Exporter CSV</Btn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total général',   val: formatCFA(totalAll),     dot: 'bg-zinc-900',  icon: TrendingUp },
          { label: 'MTN MoMo',        val: formatCFA(totalMoMo),    dot: 'bg-[#FFCB00]', icon: Wallet },
          { label: 'Espèces',         val: formatCFA(totalEspeces), dot: 'bg-green-500', icon: TrendingUp },
          { label: 'Écarts détectés', val: `${DATA.filter((d) => d.ecart !== 0).length} relevé(s)`, dot: 'bg-red-500', icon: ScrollText },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{s.label}</p>
            </div>
            <p className="font-mono font-black text-[20px] text-zinc-900">{s.val}</p>
          </div>
        ))}
      </div>

      <Card padding="sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><ScrollText size={14} className="text-zinc-500" /></div>
          <h2 className="text-[15px] font-semibold text-zinc-900">Relevés par caisse</h2>
        </div>
        <DataTable<Releve>
          columns={COLS} data={DATA}
          searchable searchKeys={['caisse', 'caissier', 'id']}
          emptyMessage="Aucun relevé disponible pour cette période"
        />
      </Card>
    </Layout>
  )
}
