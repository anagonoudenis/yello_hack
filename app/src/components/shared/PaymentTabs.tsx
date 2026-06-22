import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCFA } from '@/lib/formatCFA'
import { useMoMo } from '@/hooks/useMoMo'
import { fadeIn } from '@/lib/motion'

type PayTab = 'momo' | 'especes' | 'cheque'

interface PaymentTabsProps {
  montant: number
  telephone: string
  onPaid: (method: PayTab, ref?: string) => void
}

export function PaymentTabs({ montant, telephone, onPaid }: PaymentTabsProps) {
  const [tab, setTab] = useState<PayTab>('momo')
  const { status, ref, initier, reset } = useMoMo()
  const [montantRecu, setMontantRecu] = useState('')
  const [cheque, setCheque] = useState({ numero: '', banque: '', titulaire: '', montant: String(montant) })

  const TABS: { id: PayTab; label: string }[] = [
    { id: 'momo', label: 'MoMo' },
    { id: 'especes', label: 'Espèces' },
    { id: 'cheque', label: 'Chèque' },
  ]

  const monnaie = montantRecu ? Math.max(0, Number(montantRecu) - montant) : 0

  const handleMoMo = () => {
    if (status === 'confirmed' && ref) { onPaid('momo', ref); return }
    initier(montant, telephone)
  }

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-[#E4E4E7] mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); reset() }}
            className={cn(
              'flex-1 py-2.5 text-[14px] font-medium transition-colors duration-75 relative',
              tab === t.id ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
            )}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCB00]" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'momo' && (
          <motion.div key="momo" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-1.5">Montant verrouillé</p>
              <div className="bg-[#111] rounded-xl px-4 py-3">
                <p className="font-mono font-bold text-[18px] text-[#FFCB00]">{formatCFA(montant)}</p>
              </div>
            </div>
            <div>
              <label htmlFor="tel-momo" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 block mb-1.5">Numéro patient</label>
              <input
                id="tel-momo"
                readOnly
                value={telephone}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] font-mono border-l-[3px] border-[#FFCB00] border border-[#E4E4E7] bg-[#FAFAFA] text-zinc-900"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-1.5">Code USSD backup</p>
              <div className="px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50">
                <p className="font-mono text-[13px] text-zinc-700">*144*{montant}#</p>
              </div>
            </div>
            {status === 'pending' && (
              <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse-dot" />
                <span className="text-[13px] text-zinc-600">En attente de confirmation…</span>
              </motion.div>
            )}
            {status === 'confirmed' && ref && (
              <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex items-center gap-2 p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                <CheckCircle size={16} className="text-[#22C55E] flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-[#166534]">Confirmé</p>
                  <p className="font-mono text-[13px] text-[#166534]">{ref}</p>
                </div>
              </motion.div>
            )}
            <button
              onClick={handleMoMo}
              disabled={status === 'pending'}
              className="w-full py-3 rounded-lg bg-[#FFCB00] hover:bg-[#EDBA00] active:bg-[#D4A800] text-[#1A1A1A] text-[14px] font-semibold transition-colors duration-75 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'pending' && <Loader2 size={15} className="animate-spin" />}
              {status === 'confirmed' ? 'Valider l\'encaissement' : 'Initier le paiement'}
            </button>
          </motion.div>
        )}

        {tab === 'especes' && (
          <motion.div key="especes" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div>
              <label htmlFor="montant-recu" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 block mb-1.5">Montant reçu</label>
              <input
                id="montant-recu"
                type="number"
                value={montantRecu}
                onChange={(e) => setMontantRecu(e.target.value)}
                placeholder={String(montant)}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] font-mono border border-[#E4E4E7] bg-[#FAFAFA] focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.30)] outline-none transition-all duration-75"
              />
            </div>
            {montantRecu && (
              <motion.div variants={fadeIn} initial="initial" animate="animate" className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#166534] mb-0.5">Monnaie à rendre</p>
                <p className="font-mono font-bold text-[18px] text-[#166534]">{formatCFA(monnaie)}</p>
              </motion.div>
            )}
            <button
              onClick={() => onPaid('especes')}
              disabled={!montantRecu || Number(montantRecu) < montant}
              className="w-full py-3 rounded-lg bg-[#FFCB00] hover:bg-[#EDBA00] text-[#1A1A1A] text-[14px] font-semibold transition-colors duration-75 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Encaisser
            </button>
          </motion.div>
        )}

        {tab === 'cheque' && (
          <motion.div key="cheque" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-3">
            {(['numero', 'banque', 'titulaire'] as const).map((field) => (
              <div key={field}>
                <label htmlFor={`cheque-${field}`} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 block mb-1.5">
                  {field === 'numero' ? 'N° chèque' : field === 'banque' ? 'Banque' : 'Titulaire'}
                </label>
                <input
                  id={`cheque-${field}`}
                  value={cheque[field]}
                  onChange={(e) => setCheque({ ...cheque, [field]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-[14px] border border-[#E4E4E7] bg-[#FAFAFA] focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.30)] outline-none transition-all duration-75"
                />
              </div>
            ))}
            <div>
              <label htmlFor="cheque-montant" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 block mb-1.5">Montant</label>
              <input
                id="cheque-montant"
                readOnly
                value={formatCFA(montant)}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] font-mono border-l-[3px] border-[#FFCB00] border border-[#E4E4E7] bg-[#FAFAFA] text-zinc-900"
              />
            </div>
            <button
              onClick={() => onPaid('cheque')}
              disabled={!cheque.numero || !cheque.banque || !cheque.titulaire}
              className="w-full py-3 rounded-lg bg-[#FFCB00] hover:bg-[#EDBA00] text-[#1A1A1A] text-[14px] font-semibold transition-colors duration-75 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enregistrer le chèque
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
