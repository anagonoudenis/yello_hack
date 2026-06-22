import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { formatDate } from '@/lib/formatDate'
import { Printer, Search } from 'lucide-react'

interface FactureData {
  id: string; dossier: string; patient: string; tel: string
  actes: { nom: string; montant: number; checked: boolean }[]
  total: number; mode: string; statut: 'solde' | 'partiel'; date: Date; ref: string
}

const FACTURES: FactureData[] = [
  { id: 'FA-229-000145', dossier: 'VIS-4792', patient: 'Fatima Kouassi', tel: '+229 97 12 34 56',
    actes: [{ nom: 'Consultation spécialisée', montant: 3500, checked: true }, { nom: 'Glycémie à jeun', montant: 2000, checked: true }, { nom: 'Paracétamol 500mg ×3', montant: 1500, checked: true }, { nom: 'Amoxicilline 500mg ×6', montant: 2500, checked: false }],
    total: 7000, mode: 'MoMo', statut: 'solde', date: new Date('2026-06-23T14:32:00'), ref: 'MTN-2026-749-XK91' },
  { id: 'FA-229-000144', dossier: 'VIS-4795', patient: 'Kofi Mensah', tel: '+229 96 55 44 33',
    actes: [{ nom: 'Consultation générale', montant: 2000, checked: true }, { nom: 'Analyse tension', montant: 1500, checked: true }],
    total: 3500, mode: 'Espèces', statut: 'solde', date: new Date('2026-06-23T13:15:00'), ref: '—' },
  { id: 'FA-229-000143', dossier: 'VIS-4793', patient: 'Aïcha Traoré', tel: '+229 95 44 22 11',
    actes: [{ nom: 'Douleurs abdominales — urgence', montant: 5000, checked: true }, { nom: 'Amoxicilline 500mg ×6', montant: 4000, checked: false }],
    total: 5000, mode: 'Chèque', statut: 'partiel', date: new Date('2026-06-23T11:40:00'), ref: 'CHQ-00892' },
]

export default function Facture() {
  const [selected, setSelected] = useState<FactureData>(FACTURES[0])
  const [query, setQuery] = useState('')
  const filtered = FACTURES.filter((f) =>
    f.patient.toLowerCase().includes(query.toLowerCase()) ||
    f.id.includes(query) || f.dossier.includes(query.toUpperCase())
  )
  const initiales = selected.patient.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Layout>
      <PageHeader title="Factures" subtitle="Consultez et imprimez les factures émises" />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* List */}
        <Card padding="none">
          <div className="p-3 border-b border-zinc-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…"
                className="w-full h-9 pl-8 pr-3 rounded-xl text-[13px] border border-zinc-200 bg-zinc-50 focus:border-[#FFCB00] outline-none transition-all" />
            </div>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[520px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[13px] text-zinc-400 text-center py-8">Aucun résultat</p>
            ) : filtered.map((f) => (
              <button key={f.id} onClick={() => setSelected(f)}
                className={`w-full text-left px-4 py-3.5 hover:bg-zinc-50 transition-colors ${selected.id === f.id ? 'bg-[#FFFAE6] border-l-2 border-l-[#FFCB00]' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-black text-amber-700">{f.id}</span>
                  <StatusBadge variant={f.statut} />
                </div>
                <p className="text-[13px] font-semibold text-zinc-800">{f.patient}</p>
                <p className="text-[12px] text-zinc-400 mt-0.5">{formatCFA(f.total)} · {f.mode}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Detail */}
        <Card>
          {/* Header */}
          <div className="flex items-start justify-between pb-5 mb-5 border-b border-zinc-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFAE6] border border-[#FDE68A] flex items-center justify-center shrink-0">
                <span className="font-mono font-black text-[13px] text-[#92400E]">{initiales}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[13px] font-black text-amber-700">{selected.id}</span>
                  <StatusBadge variant={selected.statut} />
                </div>
                <p className="text-[15px] font-bold text-zinc-900">{selected.patient}</p>
                <p className="text-[12px] text-zinc-400">{selected.tel} · {formatDate(selected.date)}</p>
              </div>
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
              <Printer size={14} />Imprimer
            </button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 mb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">N° Dossier</p>
              <p className="font-mono font-black text-[14px] text-amber-700">{selected.dossier}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Mode de paiement</p>
              <p className="text-[14px] font-semibold text-zinc-800">{selected.mode}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Référence</p>
              <p className="font-mono text-[13px] text-zinc-600">{selected.ref}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Date d'émission</p>
              <p className="text-[13px] text-zinc-600">{formatDate(selected.date)}</p>
            </div>
          </div>

          {/* Actes */}
          <div className="rounded-2xl border border-zinc-200 overflow-hidden mb-5">
            <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <span>Acte médical</span><span>Montant</span>
              </div>
            </div>
            {selected.actes.map((a, i) => (
              <div key={i} className={`flex justify-between items-center px-4 py-3 border-b border-zinc-100 last:border-0 ${!a.checked ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2">
                  {!a.checked && <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-semibold">Non honoré</span>}
                  <span className={`text-[14px] text-zinc-700 ${!a.checked ? 'line-through' : ''}`}>{a.nom}</span>
                </div>
                <span className={`font-mono font-semibold text-[13px] ${!a.checked ? 'text-zinc-300 line-through' : 'text-zinc-900'}`}>{formatCFA(a.montant)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center px-5 py-4 rounded-2xl bg-[#1A1A1A]">
            <span className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider">Total payé</span>
            <span className="font-mono font-black text-[22px] text-white">{formatCFA(selected.total)}</span>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
