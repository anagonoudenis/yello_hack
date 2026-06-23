import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GraviteAlerte } from '@/lib/constants'
import { fadeSlideUp } from '@/lib/motion'

interface AlertBannerProps {
  code: string
  gravite: GraviteAlerte
  message: string
  onVoirDetails?: () => void
}

const CONFIG: Record<GraviteAlerte, { Icon: typeof AlertTriangle; bg: string; border: string; dot: string; iconColor: string }> = {
  critique: { Icon: AlertTriangle, bg: '#FEF2F2', border: '#EF4444', dot: '#EF4444', iconColor: '#EF4444' },
  haute:    { Icon: AlertCircle,   bg: '#FFFBEB', border: '#F59E0B', dot: '#F59E0B', iconColor: '#F59E0B' },
  moyenne:  { Icon: Info,          bg: '#EFF6FF', border: '#3B82F6', dot: '#3B82F6', iconColor: '#3B82F6' },
}

export function AlertBanner({ code, gravite, message, onVoirDetails }: AlertBannerProps) {
  const [visible, setVisible] = useState(true)
  const { Icon, bg, border, dot, iconColor } = CONFIG[gravite]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={fadeSlideUp} initial="initial" animate="animate" exit="exit"
          className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
          style={{ backgroundColor: bg, borderLeft: `4px solid ${border}` }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-dot"
            style={{ backgroundColor: dot }}
          />
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border flex-shrink-0"
            style={{ backgroundColor: bg, borderColor: border, color: border }}
          >
            {code}
          </span>
          <Icon size={15} className="flex-shrink-0" style={{ color: iconColor }} />
          <p className="text-[13px] text-zinc-700 flex-1">{message}</p>
          {onVoirDetails && (
            <button
              onClick={onVoirDetails}
              className="text-[13px] underline text-zinc-600 hover:text-zinc-900 flex-shrink-0 transition-colors duration-75"
            >
              Voir détails →
            </button>
          )}
          <button
            onClick={() => setVisible(false)}
            aria-label="Fermer l'alerte"
            className="text-zinc-400 hover:text-zinc-700 flex-shrink-0 transition-colors duration-75"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
