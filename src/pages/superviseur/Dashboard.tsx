import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Building2, Download, Paperclip, ArrowUpRight, AlertTriangle, Users, Wallet } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, StatCard, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { formatCFA } from '@/lib/formatCFA'
import { staggerContainer, staggerItem } from '@/lib/motion'
import useAlertStore from '@/store/alertStore'
import useVisitStore from '@/store/visitStore'
import { MOCK_CAISSES } from '@/lib/constants'

const MAX = Math.max(...MOCK_CAISSES.map((c) => c.total))
const GSTY: Record<string, { bg: string; text: string; tag: string }> = {
  critique: { bg: '#FEF2F2', text: '#991B1B', tag: 'CRIT' },
  haute:    { bg: '#FFFBEB', text: '#92400E', tag: 'HAUTE' },
  moyenne:  { bg: '#EFF6FF', text: '#1E40AF', tag: 'MOY' },
}

export default function Dashboard() {
  const { alertes } = useAlertStore()
  const { dossiers } = useVisitStore()
  const [montantVerse, setMontantVerse] = useState('')
  const theorique = 312000
  const ecart = montantVerse ? Number(montantVerse) - theorique : null
  const critique = alertes.find((a) => a.gravite === 'critique')

  return (
    <Layout>
      <PageHeader
        title="Tableau de bord"
        subtitle={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        badge={
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />En direct
          </span>
        }
        actions={<Btn variant="ghost" icon={Download}>Exporter</Btn>}
      />

      {critique && (
        <div className="mb-6">
          <AlertBanner code={critique.code} gravite={critique.gravite} message={critique.message} />
        </div>
      )}

      {/* KPI Row */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total encaissé', value: formatCFA(297000), sub: '23 transactions', icon: TrendingUp, accent: true },
          { label: 'MTN MoMo', value: formatCFA(168000), sub: '14 transactions', icon: Wallet },
          { label: 'Espèces', value: formatCFA(97500), sub: '5 transactions', icon: Building2 },
          { label: 'Chèques', value: formatCFA(31500), sub: '4 transactions', icon: TrendingUp },
        ].map((s, i) => (
          <motion.div key={i} variants={staggerItem}>
            <StatCard label={s.label} value={s.value} sub={s.sub} icon={s.icon} accent={s.accent} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Col 1 */}
        <div className="flex flex-col gap-5">
          {/* Caisses */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><Building2 size={15} className="text-zinc-500" /></div>
                <h2 className="text-[14px] font-semibold text-zinc-900">État des caisses</h2>
              </div>
              <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{MOCK_CAISSES.length} actives</span>
            </div>
            <div className="space-y-4">
              {MOCK_CAISSES.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${c.statut === 'alerte' ? 'bg-red-500 animate-pulse-dot' : 'bg-green-500'}`} />
                      <span className="text-[13px] font-medium text-zinc-700">{c.nom}</span>
                    </div>
                    <span className="font-mono font-bold text-[13px] text-zinc-900">{formatCFA(c.total)}</span>
                  </div>
                  <div className="relative h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`absolute inset-y-0 left-0 rounded-full ${c.statut === 'alerte' ? 'bg-red-400' : 'bg-[#FFCB00]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.total / MAX) * 100}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-zinc-400">{c.caissier}</span>
                    {c.ecart && <span className="text-[11px] text-red-600 font-semibold">Écart {formatCFA(c.ecart)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Alertes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle size={14} className="text-red-500" /></div>
                <h2 className="text-[14px] font-semibold text-zinc-900">Alertes actives</h2>
              </div>
              {alertes.filter((a) => a.gravite === 'critique').length > 0 && (
                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  {alertes.filter((a) => a.gravite === 'critique').length} critique{alertes.filter((a) => a.gravite === 'critique').length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {alertes.length === 0 ? (
              <p className="text-[13px] text-zinc-400 py-4 text-center">Aucune anomalie détectée</p>
            ) : (
              <div className="space-y-1.5">
                {alertes.slice(0, 4).map((a) => {
                  const s = GSTY[a.gravite]
                  return (
                    <div key={a.code} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 mt-0.5" style={{ backgroundColor: s.bg, color: s.text }}>{s.tag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-zinc-700 line-clamp-2 leading-snug">{a.message}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{a.heure}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Col 2 — Patients */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Users size={14} className="text-blue-500" /></div>
              <h2 className="text-[14px] font-semibold text-zinc-900">Patients du jour</h2>
            </div>
            <span className="font-black text-[18px] text-zinc-900">{dossiers.length}</span>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { label: `${dossiers.filter((d) => d.statut === 'SOLDE').length} soldés`, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
              { label: `${dossiers.filter((d) => d.statut === 'EN_ATTENTE').length} en attente`, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
              { label: `${dossiers.filter((d) => d.statut === 'PARTIELLEMENT_SOLDE').length} partiels`, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            ].map((s) => (
              <span key={s.label} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
            ))}
          </div>
          <div className="space-y-1">
            {dossiers.map((d) => {
              const init = d.nom.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <span className="font-mono font-bold text-[9px] text-amber-700">{init}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-800 truncate">{d.nom}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{d.motif}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-zinc-300">{d.id}</span>
                    <StatusBadge variant={d.statut === 'SOLDE' ? 'solde' : d.statut === 'EN_ATTENTE' ? 'attente' : 'partiel'} />
                  </div>
                </div>
              )
            })}
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors flex items-center justify-center gap-1.5">
            Voir tous les dossiers <ArrowUpRight size={12} />
          </button>
        </Card>

        {/* Col 3 */}
        <div className="flex flex-col gap-5">
          {/* Versement */}
          <Card variant="accent">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center"><Building2 size={14} className="text-amber-600" /></div>
              <h2 className="text-[14px] font-semibold text-zinc-900">Versement du soir</h2>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Montant théorique</p>
              <MoneyDisplay amount={theorique} variant="locked" />
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="mv-dash" className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Montant versé</label>
                <div className="flex gap-2 items-center">
                  <input id="mv-dash" type="number" value={montantVerse} onChange={(e) => setMontantVerse(e.target.value)} placeholder="0"
                    className="flex-1 h-10 px-3.5 rounded-xl text-[14px] font-mono border border-zinc-200 bg-zinc-50 focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_3px_rgba(255,203,0,0.15)] outline-none transition-all" />
                  <span className="text-[12px] text-zinc-400 shrink-0 font-medium">FCFA</span>
                </div>
              </div>
              {ecart !== null && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-[13px] font-semibold ${ecart === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <span>Écart</span>
                  <span className="font-mono">{ecart > 0 ? '+' : ''}{formatCFA(ecart)}</span>
                </motion.div>
              )}
              <button className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-zinc-300 text-[12px] text-zinc-400 hover:bg-zinc-50 hover:border-zinc-400 hover:text-zinc-600 transition-all">
                <Paperclip size={12} />Joindre le bordereau
              </button>
              <button className="w-full h-10 rounded-xl bg-[#1A1A1A] hover:bg-zinc-700 text-white text-[13px] font-semibold transition-colors">
                Déclarer le versement
              </button>
            </div>
          </Card>

          {/* Rapports */}
          <Card>
            <h2 className="text-[14px] font-semibold text-zinc-900 mb-4">Rapports</h2>
            <div className="space-y-2">
              {[
                { e: '📄', t: 'Rapport journalier', s: 'PDF · Aujourd\'hui' },
                { e: '📊', t: 'Export Excel / CSV', s: 'Toutes transactions' },
                { e: '📋', t: 'Relevé MoMo', s: 'Pour auditeurs' },
              ].map((r) => (
                <button key={r.t} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all text-left group">
                  <span className="text-lg shrink-0">{r.e}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-700">{r.t}</p>
                    <p className="text-[11px] text-zinc-400">{r.s}</p>
                  </div>
                  <Download size={12} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
