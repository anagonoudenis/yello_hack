import { motion } from 'framer-motion'
import { CheckCircle, Printer } from 'lucide-react'
import { scaleIn, fadeIn } from '@/lib/motion'

interface VisitConfirmationProps {
  visId: string
  nom: string
  tel: string
  motif: string
  onNouveauPatient: () => void
}

export function VisitConfirmation({ visId, nom, tel, motif, onNouveauPatient }: VisitConfirmationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFCB00]">
      <motion.div
        variants={fadeIn} initial="initial" animate="animate"
        className="text-center px-8 max-w-sm w-full"
      >
        <motion.div variants={fadeIn} initial="initial" animate="animate" className="inline-flex items-center gap-2 bg-[#166534] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full mb-8">
          <CheckCircle size={14} />
          Dossier créé
        </motion.div>

        <motion.div variants={scaleIn} initial="initial" animate="animate" className="mb-6">
          <p className="font-mono font-extrabold text-[72px] leading-none text-[#1A1A1A] tracking-tight">
            {visId}
          </p>
        </motion.div>

        <div className="mb-8 space-y-1">
          <p className="text-xl font-semibold text-zinc-800">{nom}</p>
          <p className="font-mono text-base text-zinc-700">{tel}</p>
          <p className="text-[14px] text-zinc-600">{motif}</p>
        </div>

        <div className="border-t border-b border-[#EDBA00] py-3 mb-8">
          <p className="text-[13px] text-zinc-700 font-medium">À communiquer au patient</p>
          <p className="text-[13px] text-zinc-600">avant de passer en caisse</p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1A1A1A] text-[14px] font-medium text-[#1A1A1A] hover:bg-[#EDBA00] transition-colors duration-75"
          >
            <Printer size={15} />
            Imprimer
          </button>
          <button
            onClick={onNouveauPatient}
            className="px-5 py-2.5 rounded-lg bg-[#1A1A1A] text-[#FFCB00] text-[14px] font-semibold hover:bg-[#242424] transition-colors duration-75"
          >
            Nouveau patient
          </button>
        </div>
      </motion.div>
    </div>
  )
}
