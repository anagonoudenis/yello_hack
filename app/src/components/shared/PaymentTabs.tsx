import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCFA } from '@/lib/formatCFA'
import { fadeIn } from '@/lib/motion'
import { deduceOperatorFromPhone, type MobileMoneyOperator } from '@/lib/paymentOperators'


export type PayTab = 'momo' | 'especes' | 'cheque'

export type PaymentSubmission =
  | { method: 'momo'; telephonePaiement: string }
  | { method: 'especes'; montantRecuFcfa: number }
  | { method: 'cheque'; chequeNumero: string; chequeBanque: string; chequeTitulaire: string }

interface PaymentTabsProps {
  montant: number
  telephone: string
  submitting?: boolean
  onSubmit: (payload: PaymentSubmission) => void | Promise<void>
}

const operatorLabel: Record<MobileMoneyOperator, string> = {
  MTN: 'MTN',
  MOOV: 'Moov',
  CELTIIS: 'Celtiis',
}

export function PaymentTabs({ montant, telephone, submitting = false, onSubmit }: PaymentTabsProps) {
  const [tab, setTab] = useState<PayTab>('momo')
  const [montantRecu, setMontantRecu] = useState('')
  const [cheque, setCheque] = useState({ numero: '', banque: '', titulaire: '' })
  const [momoTelephone, setMomoTelephone] = useState(telephone)

  useEffect(() => {
    setMomoTelephone(telephone)
  }, [telephone])

  const tabs: { id: PayTab; label: string }[] = [
    { id: 'momo', label: 'MoMo' },
    { id: 'especes', label: 'Especes' },
    { id: 'cheque', label: 'Cheque' },
  ]

  const monnaie = montantRecu ? Math.max(0, Number(montantRecu) - montant) : 0
  const momoOperatorCode = deduceOperatorFromPhone(momoTelephone)

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex border-b border-[#E4E4E7]">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            disabled={submitting}
            className={cn(
              'relative flex-1 py-2.5 text-[14px] font-medium transition-colors duration-75 disabled:opacity-50',
              tab === item.id ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
            )}
          >
            {item.label}
            {tab === item.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCB00]" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'momo' && (
          <motion.div key="momo" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Montant verrouille</p>
              <div className="rounded-xl bg-[#111] px-4 py-3">
                <p className="font-mono text-[18px] font-bold text-[#FFCB00]">{formatCFA(montant)}</p>
              </div>
            </div>

            <div>
              <label htmlFor="tel-momo" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Numero Mobile Money
              </label>
              <input
                id="tel-momo"
                type="tel"
                inputMode="tel"
                value={momoTelephone}
                onChange={(event) => setMomoTelephone(event.target.value)}
                className="w-full rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 font-mono text-[14px] text-zinc-900 outline-none transition-all duration-75 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.30)]"
              />
            </div>

            <div>
              <label htmlFor="operateur-momo" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Operateur deduit
              </label>
              <input
                id="operateur-momo"
                readOnly
                value={momoOperatorCode ? operatorLabel[momoOperatorCode] : 'Prefixe non reconnu'}
                className="w-full rounded-lg border border-[#E4E4E7] border-l-[3px] border-l-[#FFCB00] bg-[#FAFAFA] px-3 py-2.5 text-[14px] text-zinc-900"
              />
            </div>

            {!momoOperatorCode && (
              <motion.div variants={fadeIn} initial="initial" animate="animate" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[12px] leading-relaxed text-amber-700">
                  Saisissez le numero qui doit recevoir la demande USSD. Le prefixe actuel ne correspond a aucun operateur Mobile Money connu.
                </p>
              </motion.div>
            )}

            <button
              type="button"
              onClick={() => void onSubmit({ method: 'momo', telephonePaiement: momoTelephone.trim() })}
              disabled={!momoOperatorCode || !momoTelephone.trim() || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFCB00] py-3 text-[14px] font-semibold text-[#1A1A1A] transition-colors duration-75 hover:bg-[#EDBA00] active:bg-[#D4A800] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Initialisation...' : 'Initier le paiement'}
            </button>
          </motion.div>
        )}

        {tab === 'especes' && (
          <motion.div key="especes" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div>
              <label htmlFor="montant-recu" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Montant recu
              </label>
              <input
                id="montant-recu"
                type="number"
                value={montantRecu}
                onChange={(event) => setMontantRecu(event.target.value)}
                placeholder={String(montant)}
                className="w-full rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 font-mono text-[14px] outline-none transition-all duration-75 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.30)]"
              />
            </div>

            {montantRecu && (
              <motion.div variants={fadeIn} initial="initial" animate="animate" className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#166534]">Monnaie a rendre</p>
                <p className="font-mono text-[18px] font-bold text-[#166534]">{formatCFA(monnaie)}</p>
              </motion.div>
            )}

            <button
              type="button"
              onClick={() => void onSubmit({ method: 'especes', montantRecuFcfa: Number(montantRecu) })}
              disabled={!montantRecu || Number(montantRecu) < montant || submitting}
              className="w-full rounded-lg bg-[#FFCB00] py-3 text-[14px] font-semibold text-[#1A1A1A] transition-colors duration-75 hover:bg-[#EDBA00] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Enregistrement...' : 'Encaisser'}
            </button>
          </motion.div>
        )}

        {tab === 'cheque' && (
          <motion.div key="cheque" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-3">
            {(['numero', 'banque', 'titulaire'] as const).map((field) => (
              <div key={field}>
                <label htmlFor={`cheque-${field}`} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {field === 'numero' ? 'N° cheque' : field === 'banque' ? 'Banque' : 'Titulaire'}
                </label>
                <input
                  id={`cheque-${field}`}
                  value={cheque[field]}
                  onChange={(event) => setCheque((current) => ({ ...current, [field]: event.target.value }))}
                  className="w-full rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 text-[14px] outline-none transition-all duration-75 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.30)]"
                />
              </div>
            ))}

            <div>
              <label htmlFor="cheque-montant" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Montant
              </label>
              <input
                id="cheque-montant"
                readOnly
                value={formatCFA(montant)}
                className="w-full rounded-lg border border-[#E4E4E7] border-l-[3px] border-l-[#FFCB00] bg-[#FAFAFA] px-3 py-2.5 font-mono text-[14px] text-zinc-900"
              />
            </div>

            <button
              type="button"
              onClick={() => void onSubmit({
                method: 'cheque',
                chequeNumero: cheque.numero,
                chequeBanque: cheque.banque,
                chequeTitulaire: cheque.titulaire,
              })}
              disabled={!cheque.numero || !cheque.banque || !cheque.titulaire || submitting}
              className="w-full rounded-lg bg-[#FFCB00] py-3 text-[14px] font-semibold text-[#1A1A1A] transition-colors duration-75 hover:bg-[#EDBA00] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer le cheque'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
