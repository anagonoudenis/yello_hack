import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Paperclip, CheckCircle, Clock } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { formatCFA } from '@/lib/formatCFA'
import { MOCK_CAISSES } from '@/lib/constants'
import { useNotification } from '@/context/NotificationContext'
import useAlertStore from '@/store/alertStore'

const HISTORIQUE = [
  { date: '22 juin 2026', montant: 285000, ecart: 0 },
  { date: '21 juin 2026', montant: 297000, ecart: -15000 },
  { date: '20 juin 2026', montant: 198500, ecart: 0 },
  { date: '19 juin 2026', montant: 421000, ecart: 2500 },
]

export default function Versement() {
  const { toast } = useNotification()
  const { addAlerte } = useAlertStore()
  const [montant, setMontant] = useState('')
  const [note, setNote] = useState('')
  const [declared, setDeclared] = useState(false)
  const theorique = MOCK_CAISSES.reduce((s, c) => s + c.total, 0)
  const ecart = montant ? Number(montant) - theorique : null

  const handleDeclarer = () => {
    if (!montant) return
    const diff = Number(montant) - theorique
    if (Math.abs(diff) > 1000) {
      addAlerte({ code: 'A' + Math.floor(Math.random() * 90 + 10), gravite: Math.abs(diff) > 10000 ? 'critique' : 'haute', message: `Écart de versement : ${diff > 0 ? '+' : ''}${formatCFA(diff)} par rapport au théorique`, heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), caisse: null })
      toast('error', 'Anomalie enregistrée', `Écart de ${formatCFA(Math.abs(diff))}`)
    } else {
      toast('success', 'Versement déclaré', formatCFA(Number(montant)))
    }
    setDeclared(true)
  }

  return (
    <Layout>
      <PageHeader title="Versement bancaire" subtitle="Déclaration du versement de fin de journée" />

      {/* Caisse summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {MOCK_CAISSES.map((c) => (
          <div key={c.id} className={`bg-white rounded-2xl border overflow-hidden ${c.statut === 'alerte' ? 'border-red-200' : 'border-zinc-200'}`}>
            <div className={`h-1 ${c.statut === 'alerte' ? 'bg-red-500' : 'bg-[#FFCB00]'}`} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold text-zinc-500 truncate">{c.nom}</p>
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.statut === 'alerte' ? 'bg-red-500' : 'bg-green-500'}`} />
              </div>
              <p className="font-mono font-black text-[22px] text-zinc-900">{formatCFA(c.total)}</p>
              <p className="text-[11px] text-zinc-400 mt-1">{c.caissier} · {c.transactions} transactions</p>
              {c.ecart && <p className="text-[11px] text-red-600 font-semibold mt-1">Écart {formatCFA(c.ecart)}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Building2 size={16} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">Déclarer le versement</h2>
              <p className="text-[11px] text-zinc-400">Fin de journée — {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {declared ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <p className="text-[16px] font-bold text-zinc-900 mb-1">Versement déclaré</p>
              <p className="font-mono text-[15px] text-zinc-500">{formatCFA(Number(montant))}</p>
              <button onClick={() => { setDeclared(false); setMontant(''); setNote('') }}
                className="mt-6 px-5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-600 hover:bg-zinc-50 transition-colors">
                Nouveau versement
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Montant théorique (total caisses)</p>
                <MoneyDisplay amount={theorique} variant="locked" />
              </div>

              <div>
                <label htmlFor="mv" className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Montant versé *</label>
                <div className="flex gap-2 items-center">
                  <input id="mv" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="0"
                    className="flex-1 h-12 px-4 rounded-xl text-[18px] font-mono border border-zinc-200 bg-zinc-50 focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_3px_rgba(255,203,0,0.15)] outline-none transition-all" />
                  <span className="text-[13px] font-semibold text-zinc-400 shrink-0">FCFA</span>
                </div>
              </div>

              {ecart !== null && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 rounded-xl border font-semibold ${ecart === 0 ? 'bg-green-50 border-green-200 text-green-700' : Math.abs(ecart) > 10000 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <span className="text-[13px]">Écart calculé</span>
                  <span className="font-mono text-[16px]">{ecart > 0 ? '+' : ''}{formatCFA(ecart)}</span>
                </motion.div>
              )}

              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="Observations sur le versement (optionnel)…"
                className="w-full px-4 py-3 rounded-xl text-[14px] border border-zinc-200 bg-zinc-50 focus:border-[#FFCB00] focus:bg-white outline-none transition-all resize-none" />

              <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-zinc-300 text-[13px] text-zinc-400 hover:bg-zinc-50 hover:border-zinc-400 hover:text-zinc-600 transition-all">
                <Paperclip size={13} />Joindre le bordereau
              </button>
              <button onClick={handleDeclarer} disabled={!montant}
                className="w-full h-11 rounded-xl bg-[#1A1A1A] hover:bg-zinc-700 text-white text-[14px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                Déclarer le versement
              </button>
            </div>
          )}
        </Card>

        {/* Historique */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><Clock size={14} className="text-zinc-500" /></div>
            <h2 className="text-[15px] font-semibold text-zinc-900">Historique des versements</h2>
          </div>
          <div className="space-y-2">
            {HISTORIQUE.map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${h.ecart === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-zinc-800">{h.date}</p>
                  {h.ecart !== 0 && <p className="text-[11px] text-red-500 font-semibold">Écart {formatCFA(h.ecart)}</p>}
                </div>
                <span className="font-mono text-[14px] font-bold text-zinc-900">{formatCFA(h.montant)}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${h.ecart === 0 ? 'bg-green-100' : 'bg-red-100'}`} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
