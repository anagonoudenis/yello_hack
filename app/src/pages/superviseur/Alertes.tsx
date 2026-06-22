import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, X, CheckCircle } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import useAlertStore from '@/store/alertStore'
import type { GraviteAlerte } from '@/lib/constants'
import { cn } from '@/lib/utils'

const CFG: Record<GraviteAlerte, { Icon: typeof AlertTriangle; bg: string; border: string; text: string; dot: string; label: string }> = {
  critique: { Icon: AlertTriangle, bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#EF4444', label: 'Critique' },
  haute:    { Icon: AlertCircle,   bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B', label: 'Haute' },
  moyenne:  { Icon: Info,          bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6', label: 'Moyenne' },
}

export default function Alertes() {
  const { alertes, removeAlerte } = useAlertStore()
  const [filtre, setFiltre] = useState<GraviteAlerte | 'all'>('all')
  const filtered = filtre === 'all' ? alertes : alertes.filter((a) => a.gravite === filtre)
  const counts = { critique: alertes.filter((a) => a.gravite === 'critique').length, haute: alertes.filter((a) => a.gravite === 'haute').length, moyenne: alertes.filter((a) => a.gravite === 'moyenne').length }

  return (
    <Layout>
      <PageHeader
        title="Alertes & Anomalies"
        subtitle="Journal des incidents détectés en temps réel"
        badge={counts.critique > 0 ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />{counts.critique} critique{counts.critique > 1 ? 's' : ''}
          </span>
        ) : undefined}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['critique', 'haute', 'moyenne'] as GraviteAlerte[]).map((g) => {
          const c = CFG[g]
          return (
            <button key={g} onClick={() => setFiltre(filtre === g ? 'all' : g)}
              className={cn('flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-150',
                filtre === g ? 'ring-2 ring-offset-2' : 'hover:-translate-y-0.5 hover:shadow-md'
              )}
              style={{ backgroundColor: c.bg, borderColor: c.border, ringColor: c.dot } as React.CSSProperties}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.dot}20` }}>
                <c.Icon size={18} style={{ color: c.dot }} />
              </div>
              <div>
                <p className="text-[28px] font-black leading-none" style={{ color: c.text }}>{counts[g]}</p>
                <p className="text-[12px] font-semibold mt-0.5" style={{ color: c.text }}>{c.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        {(['all', 'critique', 'haute', 'moyenne'] as const).map((f) => (
          <button key={f} onClick={() => setFiltre(f)}
            className={cn('px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all', filtre === f ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300')}>
            {f === 'all' ? `Toutes (${alertes.length})` : `${CFG[f].label} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-200">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <p className="text-[15px] font-semibold text-zinc-700 mb-1">Aucune anomalie</p>
              <p className="text-[13px] text-zinc-400">Toutes les caisses fonctionnent normalement</p>
            </Card>
          ) : (
            filtered.map((a) => {
              const c = CFG[a.gravite]
              return (
                <motion.div key={a.code} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex">
                    <div className="w-1.5 shrink-0 rounded-l-2xl" style={{ backgroundColor: c.dot }} />
                    <div className="flex items-start gap-4 p-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${c.dot}12` }}>
                        <c.Icon size={16} style={{ color: c.dot }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide" style={{ backgroundColor: c.bg, color: c.text }}>
                            {c.label} · {a.code}
                          </span>
                          {a.caisse && <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{a.caisse}</span>}
                        </div>
                        <p className="text-[14px] text-zinc-800 leading-snug">{a.message}</p>
                        <p className="text-[12px] text-zinc-400 mt-1.5">Détecté à {a.heure}</p>
                      </div>
                      <button onClick={() => removeAlerte(a.code)} aria-label="Archiver"
                        className="p-2 text-zinc-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
