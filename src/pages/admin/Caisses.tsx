import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { formatCFA } from '@/lib/formatCFA'
import { MOCK_CAISSES } from '@/lib/constants'
import { Settings, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react'

const LOG = [
  { heure: '17h31', action: 'Anomalie A7 détectée — Caisse Pharmacie', type: 'alerte' },
  { heure: '14h32', action: 'FA-229-000145 émise — 7 000 FCFA — Caisse principale', type: 'ok' },
  { heure: '13h15', action: 'FA-229-000144 émise — 3 500 FCFA — Caisse principale', type: 'ok' },
  { heure: '11h40', action: 'Paiement partiel enregistré — Caisse 2 Maternité', type: 'warning' },
  { heure: '09h05', action: 'Ouverture de session — Amadou K. — Caisse principale', type: 'info' },
  { heure: '08h55', action: 'Ouverture de session — Béatrice A. — Caisse 2 Maternité', type: 'info' },
]

const DOT: Record<string, string> = { alerte: 'bg-red-500', ok: 'bg-green-500', warning: 'bg-amber-500', info: 'bg-blue-400' }

export default function Caisses() {
  const total = MOCK_CAISSES.reduce((s, c) => s + c.total, 0)

  return (
    <Layout>
      <PageHeader
        title="Gestion des caisses"
        subtitle="Supervision et configuration des postes"
        actions={
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Total global</p>
            <p className="font-mono font-black text-[20px] text-zinc-900">{formatCFA(total)}</p>
          </div>
        }
      />

      {/* Caisse cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {MOCK_CAISSES.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className={`h-1.5 ${c.statut === 'alerte' ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-[#FFCB00] to-[#FFB800]'}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[14px] font-bold text-zinc-900">{c.nom}</p>
                  <p className="text-[12px] text-zinc-400 mt-0.5">{c.caissier}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.statut === 'alerte' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.statut === 'alerte' ? 'bg-red-500 animate-pulse-dot' : 'bg-green-500'}`} />
                  {c.statut === 'alerte' ? 'Anomalie' : 'Actif'}
                </span>
              </div>
              <p className="font-mono font-black text-[28px] text-zinc-900 mb-1">{formatCFA(c.total)}</p>
              <p className="text-[12px] text-zinc-400">{c.transactions} transactions ce jour</p>
              {c.ecart && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <p className="text-[12px] text-red-700 font-semibold">Écart détecté : {formatCFA(c.ecart)}</p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-zinc-200 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                  <TrendingUp size={12} />Détail
                </button>
                <button className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 transition-colors" aria-label="Paramètres">
                  <Settings size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Caisses actives', val: `${MOCK_CAISSES.filter((c) => c.statut === 'ok').length}/${MOCK_CAISSES.length}`, icon: BarChart3 },
          { label: 'Transactions totales', val: MOCK_CAISSES.reduce((s, c) => s + c.transactions, 0).toString(), icon: TrendingUp },
          { label: 'Anomalies actives', val: MOCK_CAISSES.filter((c) => c.statut === 'alerte').length.toString(), icon: AlertTriangle },
          { label: 'Recettes du jour', val: formatCFA(total), icon: BarChart3 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{s.label}</p>
              <div className="p-1.5 rounded-lg bg-zinc-50"><s.icon size={12} className="text-zinc-400" /></div>
            </div>
            <p className="font-mono font-black text-[20px] text-zinc-900">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Activity log */}
      <Card>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><BarChart3 size={14} className="text-zinc-500" /></div>
          <h2 className="text-[15px] font-semibold text-zinc-900">Journal d'activité</h2>
        </div>
        <div className="space-y-1">
          {LOG.map((l, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
              <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[l.type]}`} />
              <span className="font-mono text-[11px] text-zinc-400 shrink-0 w-12">{l.heure}</span>
              <span className="text-[13px] text-zinc-700 flex-1">{l.action}</span>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  )
}
