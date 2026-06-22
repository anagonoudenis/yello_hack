import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, CheckCircle } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { PaymentTabs } from '@/components/shared/PaymentTabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCFA } from '@/lib/formatCFA'
import { cn } from '@/lib/utils'
import { MOCK_DOSSIERS, MOCK_CATALOGUE, type Dossier } from '@/lib/constants'
import { useNotification } from '@/context/NotificationContext'
import useVisitStore from '@/store/visitStore'

interface Ligne { code: string; nom: string; montant: number; checked: boolean; motif: string }

const INIT: Ligne[] = [
  { code: 'CONS-SPEC-01', nom: 'Consultation spécialisée', montant: 3500, checked: true,  motif: '' },
  { code: 'ANAL-GLY-01',  nom: 'Glycémie à jeun',          montant: 2000, checked: true,  motif: '' },
  { code: 'MED-PARA-500', nom: 'Paracétamol 500mg ×3',     montant: 1500, checked: true,  motif: '' },
  { code: 'MED-AMOX-500', nom: 'Amoxicilline 500mg ×6',    montant: 2500, checked: false, motif: '' },
]

export default function Encaissement() {
  const { toast } = useNotification()
  const { updateStatut } = useVisitStore()
  const [query, setQuery] = useState('')
  const [dossier, setDossier] = useState<Dossier | null>(MOCK_DOSSIERS[0])
  const [lignes, setLignes] = useState<Ligne[]>(INIT)
  const [paid, setPaid] = useState(false)
  const [showCat, setShowCat] = useState(false)

  const checked  = lignes.filter((l) => l.checked)
  const unchecked = lignes.filter((l) => !l.checked)
  const total    = checked.reduce((s, l) => s + l.montant, 0)
  const totalNH  = unchecked.reduce((s, l) => s + l.montant, 0)
  const canPay   = checked.length > 0 && unchecked.every((l) => l.motif.trim().length > 0)

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    const found = MOCK_DOSSIERS.find((d) =>
      d.id.toUpperCase() === query.toUpperCase() ||
      d.nom.toLowerCase().includes(query.toLowerCase())
    )
    if (found) { setDossier(found); setLignes(INIT); setPaid(false); setQuery('') }
  }

  const toggle  = (code: string) => setLignes((p) => p.map((l) => l.code === code ? { ...l, checked: !l.checked, motif: '' } : l))
  const setMotif = (code: string, m: string) => setLignes((p) => p.map((l) => l.code === code ? { ...l, motif: m } : l))
  const remove  = (code: string) => setLignes((p) => p.filter((l) => l.code !== code))

  const addItem = (item: typeof MOCK_CATALOGUE[0]) => {
    if (!lignes.find((l) => l.code === item.code))
      setLignes((p) => [...p, { code: item.code, nom: item.nom, montant: item.montant, checked: true, motif: '' }])
    setShowCat(false)
  }

  const onPaid = (_: string, ref?: string) => {
    if (!dossier) return
    setPaid(true)
    updateStatut(dossier.id, 'SOLDE')
    toast('success', 'Encaissement confirmé', `FA-229-000145 · ${formatCFA(total)}`)
    if (ref) setTimeout(() => toast('info', 'SMS envoyé', dossier.tel), 600)
  }

  return (
    <Layout>
      <PageHeader
        title="Encaissement"
        subtitle="Saisie et paiement des actes médicaux"
        badge={dossier ? <StatusBadge variant={paid ? 'solde' : 'attente'} /> : undefined}
        actions={
          <form onSubmit={search} className="flex gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="N° dossier ou patient…"
                className="w-52 h-9 pl-8 pr-3 rounded-xl text-[13px] border border-zinc-200 bg-white focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)] outline-none transition-all" />
            </div>
            <Btn variant="secondary" type="submit">Charger</Btn>
          </form>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Dossier + lignes */}
        <Card>
          {dossier ? (
            <>
              {/* Patient info */}
              <div className="flex items-center gap-4 pb-5 mb-5 border-b border-zinc-100">
                <div className="w-11 h-11 rounded-2xl bg-[#FFFAE6] border border-[#FDE68A] flex items-center justify-center shrink-0">
                  <span className="font-mono font-black text-[12px] text-[#92400E]">
                    {dossier.nom.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-zinc-900">{dossier.nom}</p>
                  <p className="text-[12px] text-zinc-400">{dossier.tel} · {dossier.service}</p>
                </div>
                <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#FFFAE6] text-[#92400E] border border-[#FDE68A]">
                  {dossier.id}
                </span>
              </div>

              {/* Lignes */}
              <div className="space-y-1 mb-5">
                {lignes.map((l) => (
                  <div key={l.code}>
                    <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all', !l.checked && 'opacity-45')}>
                      <input type="checkbox" id={`l-${l.code}`} checked={l.checked} onChange={() => toggle(l.code)}
                        className="w-[18px] h-[18px] rounded-md accent-[#FFCB00] shrink-0 cursor-pointer" />
                      <label htmlFor={`l-${l.code}`} className="flex-1 text-[14px] cursor-pointer select-none">
                        <span className={cn('text-zinc-800', !l.checked && 'line-through text-zinc-400')}>{l.nom}</span>
                      </label>
                      <span className={cn('font-mono text-[13px] font-semibold shrink-0', l.checked ? 'text-zinc-900' : 'text-zinc-300 line-through')}>
                        {formatCFA(l.montant)}
                      </span>
                      <button onClick={() => remove(l.code)} aria-label="Retirer" className="p-1 text-zinc-200 hover:text-red-400 transition-colors shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {!l.checked && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-[52px] pr-9 pb-1.5">
                          <input value={l.motif} onChange={(e) => setMotif(l.code, e.target.value)}
                            placeholder="Motif requis…"
                            className="w-full h-8 px-3 rounded-lg text-[12px] border border-zinc-200 bg-zinc-50 focus:border-[#FFCB00] outline-none transition-all" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Add item */}
              <div className="relative mb-5">
                <button onClick={() => setShowCat((v) => !v)}
                  className="flex items-center gap-2 w-full h-9 px-3 rounded-xl border border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-[13px] text-zinc-400 hover:text-zinc-600 transition-all">
                  <Plus size={13} />Ajouter depuis le catalogue
                </button>
                <AnimatePresence>
                  {showCat && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute z-10 top-full mt-1 left-0 right-0 bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
                      {MOCK_CATALOGUE.map((item) => (
                        <button key={item.code} onClick={() => addItem(item)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 text-left">
                          <div>
                            <p className="text-[13px] font-medium text-zinc-800">{item.nom}</p>
                            <p className="text-[11px] text-zinc-400">{item.service}</p>
                          </div>
                          <span className="font-mono text-[12px] font-semibold text-zinc-600">{formatCFA(item.montant)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-zinc-100">
                <div className="flex justify-between text-[13px] text-zinc-500">
                  <span>Sous-total ({checked.length} actes)</span>
                  <span className="font-mono font-medium">{formatCFA(total + totalNH)}</span>
                </div>
                {totalNH > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-zinc-500">Non honoré</span>
                    <span className="font-mono font-semibold text-red-500">−{formatCFA(totalNH)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
                  <span className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">Total à encaisser</span>
                  <span className="font-mono font-black text-[24px] text-zinc-900">{formatCFA(total)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={36} className="text-zinc-200 mb-4" />
              <p className="text-[14px] font-semibold text-zinc-600 mb-1">Aucun dossier chargé</p>
              <p className="text-[13px] text-zinc-400">Recherchez un patient par numéro de dossier ou par nom</p>
            </div>
          )}
        </Card>

        {/* Paiement */}
        <div>
          <Card variant="elevated" className="sticky top-6">
            <p className="text-[15px] font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100">Paiement</p>
            {paid ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <p className="text-[15px] font-bold text-zinc-900 mb-1">Confirmé</p>
                <p className="font-mono text-[13px] text-zinc-400 mb-1">FA-229-000145</p>
                <p className="font-mono font-black text-[18px] text-zinc-900">{formatCFA(total)}</p>
                <Btn variant="ghost" onClick={() => { setDossier(null); setLignes(INIT); setPaid(false) }} className="mt-5 w-full justify-center">
                  Nouveau dossier
                </Btn>
              </motion.div>
            ) : !dossier ? (
              <div className="text-center py-8">
                <p className="text-[13px] text-zinc-400">Chargez un dossier pour commencer</p>
              </div>
            ) : !canPay ? (
              <div className="text-center py-6">
                <p className="text-[13px] text-zinc-400 leading-relaxed">Renseignez les motifs des actes décochés pour continuer.</p>
              </div>
            ) : (
              <PaymentTabs montant={total} telephone={dossier.tel} onPaid={onPaid} />
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}
