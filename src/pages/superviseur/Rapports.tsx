import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Download, FileText, BarChart3, Table2, Clock, TrendingUp } from 'lucide-react'
import { formatCFA } from '@/lib/formatCFA'

const RAPPORTS = [
  { Icon: FileText,  title: 'Rapport journalier',   desc: 'Récapitulatif complet — toutes caisses', fmt: 'PDF',   size: '245 Ko', color: '#EF4444', updated: 'Aujourd\'hui 23h00' },
  { Icon: BarChart3, title: 'Export transactions',  desc: 'Détail patient et mode de paiement',    fmt: 'Excel', size: '1.2 Mo', color: '#166534', updated: 'Aujourd\'hui 23h00' },
  { Icon: Table2,    title: 'Relevé MoMo',          desc: 'Synthèse Mobile Money pour MTN',        fmt: 'CSV',   size: '88 Ko',  color: '#1E40AF', updated: 'Aujourd\'hui 23h00' },
  { Icon: FileText,  title: 'Rapport mensuel',      desc: 'Bilan consolidé — Juin 2026',           fmt: 'PDF',   size: '1.8 Mo', color: '#7C3AED', updated: '30 juin 2026' },
  { Icon: Table2,    title: 'Export audit',         desc: 'Journal d\'audit pour auditeurs',       fmt: 'CSV',   size: '3.1 Mo', color: '#92400E', updated: 'Hier 23h00' },
]

const STATS = [
  { label: 'Transactions (mois)', val: '847', sub: '+12% vs mai', icon: TrendingUp },
  { label: 'Recettes totales',    val: formatCFA(8421500), sub: 'Juin 2026', icon: BarChart3 },
  { label: 'Taux MoMo',          val: '64%', sub: 'vs 52% en mai', icon: TrendingUp },
  { label: 'Alertes résolues',    val: '18/21', sub: '3 en attente', icon: FileText },
]

export default function Rapports() {
  return (
    <Layout>
      <PageHeader title="Rapports & Exports" subtitle="Téléchargez et exportez les données"
        actions={<Btn variant="ghost" icon={Download}>Tout télécharger</Btn>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{s.label}</p>
              <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100"><s.icon size={12} className="text-zinc-400" /></div>
            </div>
            <p className="font-mono font-black text-[22px] text-zinc-900">{s.val}</p>
            <p className="text-[11px] text-zinc-400 mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">Rapports disponibles</h2>
          <span className="text-[12px] text-zinc-400 flex items-center gap-1.5"><Clock size={12} />Générés automatiquement à 23h00</span>
        </div>
        <div className="divide-y divide-zinc-100">
          {RAPPORTS.map((r) => (
            <div key={r.title} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors group">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${r.color}12` }}>
                <r.Icon size={18} style={{ color: r.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-zinc-800">{r.title}</p>
                <p className="text-[12px] text-zinc-400">{r.desc} · <span className="font-mono">{r.fmt}</span> · {r.size}</p>
              </div>
              <div className="hidden sm:block text-right mr-4">
                <p className="text-[12px] text-zinc-400">{r.updated}</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-600 text-[13px] font-semibold transition-all">
                <Download size={13} />Télécharger
              </button>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  )
}
