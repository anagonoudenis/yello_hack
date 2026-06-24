import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCFA } from '@/lib/formatCFA'
import { fadeIn } from '@/lib/motion'

/* ─── Types exportés (utilisés par Encaissement.tsx) ── */
export type PaymentSubmission =
  | { method: 'especes'; montantRecuFcfa: number }
  | { method: 'momo';   telephonePaiement: string }
  | { method: 'cheque'; chequeNumero: string; chequeBanque: string; chequeTitulaire: string }

type PayTab = 'momo' | 'especes' | 'cheque'

interface PaymentTabsProps {
  montant:    number
  telephone:  string
  submitting: boolean
  onSubmit:   (submission: PaymentSubmission) => Promise<void> | void
}

const TABS: { id: PayTab; label: string }[] = [
  { id: 'momo',    label: 'Mobile Money' },
  { id: 'especes', label: 'Espèces' },
  { id: 'cheque',  label: 'Chèque' },
]

const inputCls = 'h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-[14px] outline-none transition-all focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)] placeholder:text-zinc-300'
const btnCls   = 'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] text-[14px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40'

export function PaymentTabs({ montant, telephone, submitting, onSubmit }: PaymentTabsProps) {
  const [tab, setTab] = useState<PayTab>('momo')

  /* ─── MoMo ─── */
  const [momoPhone, setMomoPhone] = useState(telephone)

  /* ─── Espèces ─── */
  const [montantRecu, setMontantRecu] = useState('')
  const monnaie = montantRecu ? Math.max(0, Number(montantRecu) - montant) : null

  /* ─── Chèque ─── */
  const [chequeNumero,    setChequeNumero]    = useState('')
  const [chequeBanque,    setChequeBanque]    = useState('')
  const [chequeTitulaire, setChequeTitulaire] = useState('')

  /* ─── Soumissions ─── */
  const handleMomo = () => {
    if (!momoPhone.trim()) return
    void onSubmit({ method: 'momo', telephonePaiement: momoPhone.trim() })
  }

  const handleEspeces = () => {
    const recu = Number(montantRecu)
    if (!recu || recu < montant) return
    void onSubmit({ method: 'especes', montantRecuFcfa: recu })
  }

  const handleCheque = () => {
    if (!chequeNumero.trim() || !chequeBanque.trim() || !chequeTitulaire.trim()) return
    void onSubmit({
      method: 'cheque',
      chequeNumero: chequeNumero.trim(),
      chequeBanque: chequeBanque.trim(),
      chequeTitulaire: chequeTitulaire.trim(),
    })
  }

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-100 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2.5 text-[13px] font-medium transition-colors relative',
              tab === t.id ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
            )}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#FFCB00]" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── MoMo ── */}
        {tab === 'momo' && (
          <motion.div key="momo" variants={fadeIn} initial="initial" animate="animate" exit="exit"
            className="space-y-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Montant à payer
              </p>
              <div className="flex items-center justify-between rounded-xl bg-[#111] px-4 py-3">
                <span className="font-mono text-[18px] font-bold text-[#FFCB00]">{formatCFA(montant)}</span>
                <span className="text-[11px] text-zinc-500">MTN MoMo</span>
              </div>
            </div>
            <div>
              <label htmlFor="momo-phone"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Numéro patient
              </label>
              <input
                id="momo-phone"
                type="tel"
                value={momoPhone}
                onChange={(e) => setMomoPhone(e.target.value)}
                placeholder="+229 97 00 00 00"
                className={cn(inputCls, momoPhone && 'border-[#FFCB00] border-l-4')}
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="font-mono text-[13px] text-zinc-500">Code USSD : *144*{montant}#</p>
            </div>
            <button
              type="button"
              onClick={handleMomo}
              disabled={submitting || !momoPhone.trim()}
              className={btnCls}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Envoi en cours…' : 'Initier le paiement Mobile Money'}
            </button>
          </motion.div>
        )}

        {/* ── Espèces ── */}
        {tab === 'especes' && (
          <motion.div key="especes" variants={fadeIn} initial="initial" animate="animate" exit="exit"
            className="space-y-4">
            <div>
              <label htmlFor="montant-recu"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Montant à payer
              </label>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="font-mono text-[18px] font-bold text-zinc-900">{formatCFA(montant)}</span>
              </div>
            </div>
            <div>
              <label htmlFor="montant-recu"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Montant reçu du patient
              </label>
              <input
                id="montant-recu"
                type="number"
                value={montantRecu}
                onChange={(e) => setMontantRecu(e.target.value)}
                placeholder={String(montant)}
                min={montant}
                className={inputCls}
              />
            </div>
            {monnaie !== null && (
              <motion.div variants={fadeIn} initial="initial" animate="animate"
                className={cn('rounded-xl border px-4 py-3',
                  monnaie >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                )}>
                <p className={cn('text-[11px] font-semibold uppercase tracking-widest mb-1',
                  monnaie >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {monnaie >= 0 ? 'Monnaie à rendre' : 'Montant insuffisant'}
                </p>
                <p className={cn('font-mono text-[18px] font-bold',
                  monnaie >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {formatCFA(Math.abs(monnaie))}
                </p>
              </motion.div>
            )}
            <button
              type="button"
              onClick={handleEspeces}
              disabled={submitting || !montantRecu || Number(montantRecu) < montant}
              className={btnCls}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Enregistrement…' : 'Encaisser en espèces'}
            </button>
          </motion.div>
        )}

        {/* ── Chèque ── */}
        {tab === 'cheque' && (
          <motion.div key="cheque" variants={fadeIn} initial="initial" animate="animate" exit="exit"
            className="space-y-3">
            {([
              { id: 'numero',    label: 'N° de chèque', value: chequeNumero,    set: setChequeNumero    },
              { id: 'banque',    label: 'Banque',        value: chequeBanque,    set: setChequeBanque    },
              { id: 'titulaire', label: 'Titulaire',     value: chequeTitulaire, set: setChequeTitulaire },
            ] as const).map((f) => (
              <div key={f.id}>
                <label htmlFor={`cheque-${f.id}`}
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                  {f.label}
                </label>
                <input
                  id={`cheque-${f.id}`}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Montant</p>
              <div className="flex items-center rounded-xl border-l-4 border-[#FFCB00] border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                <span className="font-mono font-bold text-zinc-900">{formatCFA(montant)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheque}
              disabled={submitting || !chequeNumero.trim() || !chequeBanque.trim() || !chequeTitulaire.trim()}
              className={btnCls}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Enregistrement…' : 'Enregistrer le chèque'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
