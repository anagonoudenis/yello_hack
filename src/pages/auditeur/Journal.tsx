import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Activity, Download } from 'lucide-react'
import { formatDate } from '@/lib/formatDate'
import { formatCFA } from '@/lib/formatCFA'
import { cn } from '@/lib/utils'

type ActionType = 'paiement' | 'alerte' | 'connexion' | 'versement' | 'modification'

interface JEntry {
  id: string; date: Date; user: string; action: string
  type: ActionType; caisse?: string; montant?: number; ref?: string
}

const ENTRIES: JEntry[] = [
  { id: 'J001', date: new Date('2026-06-23T17:31:00'), user: 'Système',    action: 'Anomalie A7 enregistrée — Écart versement Caisse Pharmacie',       type: 'alerte',      caisse: 'Pharmacie' },
  { id: 'J002', date: new Date('2026-06-23T14:32:00'), user: 'Amadou K.',  action: 'Facture FA-229-000145 émise — VIS-4792 Fatima Kouassi',              type: 'paiement',    caisse: 'Principale', montant: 7000, ref: 'MTN-2026-749-XK91' },
  { id: 'J003', date: new Date('2026-06-23T13:15:00'), user: 'Amadou K.',  action: 'Facture FA-229-000144 émise — VIS-4795 Kofi Mensah',                 type: 'paiement',    caisse: 'Principale', montant: 3500 },
  { id: 'J004', date: new Date('2026-06-23T09:05:00'), user: 'Jean A.',    action: 'Dossier VIS-4795 créé — Kofi Mensah · Cardiologie',                  type: 'modification' },
  { id: 'J005', date: new Date('2026-06-23T08:45:00'), user: 'Amadou K.',  action: 'Ouverture de session — Caisse principale',                           type: 'connexion',   caisse: 'Principale' },
  { id: 'J006', date: new Date('2026-06-23T08:31:00'), user: 'Jean A.',    action: 'Dossier VIS-4792 créé — Fatima Kouassi · Médecine générale',         type: 'modification' },
  { id: 'J007', date: new Date('2026-06-22T23:02:00'), user: 'Marie D.',   action: 'Versement déclaré — 285 000 FCFA',                                   type: 'versement',   montant: 285000 },
  { id: 'J008', date: new Date('2026-06-22T22:55:00'), user: 'Romuald D.', action: 'Clôture de session — Caisse Pharmacie',                              type: 'connexion',   caisse: 'Pharmacie' },
]

const TCFG: Record<ActionType, { dot: string; bg: string; text: string; label: string }> = {
  paiement:     { dot: '#22C55E', bg: '#F0FDF4', text: '#166534', label: 'Paiement' },
  alerte:       { dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B', label: 'Alerte' },
  connexion:    { dot: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', label: 'Connexion' },
  versement:    { dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', label: 'Versement' },
  modification: { dot: '#A1A1AA', bg: '#F4F4F5', text: '#3F3F46', label: 'Modification' },
}

export default function Journal() {
  const [filtre, setFiltre] = useState<ActionType | 'all'>('all')
  const filtered = filtre === 'all' ? ENTRIES : ENTRIES.filter((e) => e.type === filtre)

  return (
    <Layout>
      <PageHeader
        title="Journal d'audit"
        subtitle="Toutes les actions — non modifiable"
        actions={<Btn variant="ghost" icon={Download}>Exporter</Btn>}
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(['all', 'paiement', 'alerte', 'versement', 'connexion', 'modification'] as const).map((f) => (
          <button key={f} onClick={() => setFiltre(f)}
            className={cn('px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all',
              filtre === f ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300')}>
            {f === 'all' ? `Toutes (${ENTRIES.length})` : TCFG[f].label}
          </button>
        ))}
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><Activity size={14} className="text-zinc-500" /></div>
          <div>
            <h2 className="text-[14px] font-semibold text-zinc-900">{filtered.length} entrée{filtered.length > 1 ? 's' : ''}</h2>
            <p className="text-[11px] text-zinc-400">Traçabilité complète et immuable</p>
          </div>
        </div>
        <div className="divide-y divide-zinc-100">
          {filtered.map((e) => {
            const c = TCFG[e.type]
            return (
              <div key={e.id} className="flex items-start gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0 mt-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[13px] font-semibold text-zinc-900">{e.user}</span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: c.bg, color: c.text }}>{c.label}</span>
                    {e.caisse && <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{e.caisse}</span>}
                    {e.montant && <span className="font-mono text-[12px] font-semibold text-zinc-600">{formatCFA(e.montant)}</span>}
                  </div>
                  <p className="text-[13px] text-zinc-600 leading-snug">{e.action}</p>
                  {e.ref && <p className="text-[11px] font-mono text-zinc-400 mt-0.5">Réf : {e.ref}</p>}
                </div>
                {/* Time */}
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-zinc-400">{formatDate(e.date)}</p>
                  <p className="font-mono text-[10px] text-zinc-200 mt-0.5">{e.id}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </Layout>
  )
}
