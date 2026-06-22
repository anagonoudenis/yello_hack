import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, UserPlus, Phone, User, Stethoscope, Building2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { VisitConfirmation } from '@/components/shared/VisitConfirmation'
import { cn } from '@/lib/utils'
import { MOCK_DOSSIERS, type Dossier } from '@/lib/constants'
import useVisitStore from '@/store/visitStore'

/* ── Data ──────────────────────────────────────────── */
const SERVICES = [
  { id: 'med',    label: 'Médecine générale', icon: '🩺', color: 'blue' },
  { id: 'chir',   label: 'Chirurgie',         icon: '⚕️', color: 'orange' },
  { id: 'mat',    label: 'Maternité',         icon: '🤱', color: 'pink' },
  { id: 'pharma', label: 'Pharmacie',         icon: '💊', color: 'green' },
  { id: 'cardio', label: 'Cardiologie',       icon: '❤️', color: 'red' },
  { id: 'labo',   label: 'Laboratoire',       icon: '🔬', color: 'purple' },
]

const MOTIFS = [
  'Consultation générale', 'Douleurs abdominales', 'Contrôle tension',
  'Vaccination', 'Urgence médicale', 'Suivi grossesse',
  'Analyse médicale', 'Traumatisme', 'Autre',
]

const SERVICE_COLOR: Record<string, { active: string; bg: string; ring: string }> = {
  blue:   { active: 'border-blue-400 bg-blue-50',   bg: 'bg-blue-50',   ring: 'ring-blue-200' },
  orange: { active: 'border-orange-400 bg-orange-50', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  pink:   { active: 'border-pink-400 bg-pink-50',   bg: 'bg-pink-50',   ring: 'ring-pink-200' },
  green:  { active: 'border-green-400 bg-green-50', bg: 'bg-green-50',  ring: 'ring-green-200' },
  red:    { active: 'border-red-400 bg-red-50',     bg: 'bg-red-50',    ring: 'ring-red-200' },
  purple: { active: 'border-purple-400 bg-purple-50', bg: 'bg-purple-50', ring: 'ring-purple-200' },
}

type PhoneStatus = 'idle' | 'checking' | 'ok' | 'doublon'
let cnt = 4796

/* ── Input component ───────────────────────────────── */
function Field({ id, label, icon: Icon, error, children }: {
  id: string; label: string; icon: typeof User; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
        <Icon size={11} className="text-zinc-400" />
        {label}
      </label>
      {children}
      {error && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="text-[11px] text-red-500 font-medium mt-1.5 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </motion.p>
      )}
    </div>
  )
}

/* ── Page ──────────────────────────────────────────── */
export default function Enregistrement() {
  const { addDossier } = useVisitStore()
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [tel, setTel] = useState('')
  const [motif, setMotif] = useState('')
  const [service, setService] = useState('')
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>('idle')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState<Dossier | null>(null)

  const checkPhone = async (val: string) => {
    setTel(val)
    if (val.replace(/\s/g, '').length < 8) { setPhoneStatus('idle'); return }
    setPhoneStatus('checking')
    await new Promise((r) => setTimeout(r, 700))
    setPhoneStatus(
      MOCK_DOSSIERS.some((d) => d.tel.replace(/\s/g, '').includes(val.replace(/\s/g, '')))
        ? 'doublon' : 'ok'
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    const d: Dossier = {
      id: `VIS-${cnt++}`, nom: `${prenom} ${nom}`,
      tel: `+229 ${tel}`, motif, service,
      statut: 'EN_ATTENTE', date: new Date(),
    }
    addDossier(d)
    setConfirmed(d)
    setLoading(false)
  }

  const reset = () => {
    setConfirmed(null)
    setNom(''); setPrenom(''); setTel(''); setMotif(''); setService('')
    setPhoneStatus('idle')
  }

  const steps = [
    { label: 'Identité', done: !!(nom && prenom) },
    { label: 'Contact', done: phoneStatus === 'ok' },
    { label: 'Motif', done: !!motif },
    { label: 'Service', done: !!service },
  ]
  const step = steps.findIndex((s) => !s.done)
  const valid = steps.every((s) => s.done)

  /* Base input style */
  const iCls = (extra = '') =>
    cn('w-full h-10 px-3.5 rounded-lg text-[14px] border bg-white outline-none transition-all duration-100 placeholder:text-zinc-300', extra)

  if (confirmed) {
    return <VisitConfirmation visId={confirmed.id} nom={confirmed.nom} tel={confirmed.tel} motif={confirmed.motif} onNouveauPatient={reset} />
  }

  return (
    <Layout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-zinc-900">Enregistrement patient</h1>
        <p className="text-[13px] text-zinc-400 mt-0.5">Créer un nouveau dossier de visite</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        {/* ── FORM ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl border border-zinc-200 shadow-[0_4px_24px_rgba(0,0,0,0.05)] overflow-hidden"
        >
          {/* Card header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/60">
            <div className="w-8 h-8 rounded-lg bg-[#FFCB00] flex items-center justify-center">
              <UserPlus size={15} className="text-[#1A1A1A]" />
            </div>
            <div className="flex-1">
              <h2 className="text-[14px] font-bold text-zinc-900">Nouveau patient</h2>
              <p className="text-[11px] text-zinc-400">Tous les champs * sont obligatoires</p>
            </div>
            {/* Progress dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {steps.map((s, i) => (
                <div key={i} title={s.label}
                  className={cn('w-2 h-2 rounded-full transition-colors', s.done ? 'bg-green-500' : i === step ? 'bg-[#FFCB00] animate-pulse' : 'bg-zinc-200')} />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* ── Identité ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center text-[9px] font-black">1</span>
                Identité
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="nom" label="Nom *" icon={User}>
                  <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required
                    placeholder="Kouassi"
                    className={iCls(nom ? 'border-green-300 bg-green-50/30' : 'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]')}
                  />
                </Field>
                <Field id="prenom" label="Prénom *" icon={User}>
                  <input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required
                    placeholder="Fatima"
                    className={iCls(prenom ? 'border-green-300 bg-green-50/30' : 'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]')}
                  />
                </Field>
              </div>
            </div>

            {/* ── Contact ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center text-[9px] font-black">2</span>
                Contact
              </p>
              <Field id="tel" label="Téléphone *" icon={Phone}>
                <div className="flex gap-2">
                  <div className="flex items-center h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-100 shrink-0">
                    <span className="text-[13px] font-mono font-semibold text-zinc-600">+229</span>
                  </div>
                  <div className="relative flex-1">
                    <input id="tel" value={tel} onChange={(e) => checkPhone(e.target.value)}
                      placeholder="97 12 34 56"
                      className={iCls(cn('pr-10',
                        phoneStatus === 'ok' && 'border-green-400 bg-green-50/30',
                        phoneStatus === 'doublon' && 'border-amber-400 bg-amber-50/20',
                        phoneStatus === 'idle' && 'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]'
                      ))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {phoneStatus === 'checking' && <Loader2 size={14} className="animate-spin text-zinc-400" />}
                      {phoneStatus === 'ok'      && <CheckCircle size={14} className="text-green-500" />}
                      {phoneStatus === 'doublon' && <AlertCircle size={14} className="text-amber-500" />}
                    </span>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {phoneStatus === 'ok' && (
                    <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[12px] text-green-600 font-semibold mt-1.5 flex items-center gap-1">
                      <CheckCircle size={11} />Aucun doublon — nouveau patient
                    </motion.p>
                  )}
                  {phoneStatus === 'doublon' && (
                    <motion.p key="dblon" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[12px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} />Numéro déjà enregistré — vérifiez le dossier existant
                    </motion.p>
                  )}
                </AnimatePresence>
              </Field>
            </div>

            {/* ── Motif ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center text-[9px] font-black">3</span>
                Motif de consultation
              </p>
              <Field id="motif" label="Motif *" icon={Stethoscope}>
                <div className="relative">
                  <select id="motif" value={motif} onChange={(e) => setMotif(e.target.value)} required
                    className={iCls(cn('appearance-none cursor-pointer pr-8',
                      motif ? 'border-green-300 bg-green-50/30' : 'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]'
                    ))}>
                    <option value="">Sélectionner un motif…</option>
                    {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▾</span>
                </div>
              </Field>
            </div>

            {/* ── Service ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center text-[9px] font-black">4</span>
                Service d'orientation
              </p>
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 mb-2.5 uppercase tracking-wider">
                <Building2 size={11} className="text-zinc-400" />Service *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICES.map((s) => {
                  const c = SERVICE_COLOR[s.color]
                  const active = service === s.label
                  return (
                    <button key={s.id} type="button" onClick={() => setService(s.label)}
                      className={cn(
                        'relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-100',
                        active
                          ? cn('border-2 shadow-sm', c.active)
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                      )}>
                      {active && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-500" />}
                      <span className="text-[18px] leading-none shrink-0">{s.icon}</span>
                      <span className={cn('text-[12px] font-medium leading-tight', active ? 'text-zinc-900 font-semibold' : 'text-zinc-600')}>
                        {s.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── CTA ── */}
            <div className="pt-2">
              <button type="submit" disabled={!valid || loading}
                className={cn(
                  'w-full h-12 rounded-lg text-[14px] font-bold transition-all duration-100 flex items-center justify-center gap-2.5',
                  valid && !loading
                    ? 'bg-[#1A1A1A] hover:bg-zinc-700 active:scale-[0.99] text-white shadow-sm cursor-pointer'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                )}>
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />Création en cours…</>
                  : valid
                    ? <><UserPlus size={16} />Créer le dossier</>
                    : <>Complétez tous les champs ({steps.filter((s) => s.done).length}/4)</>
                }
              </button>
            </div>
          </form>
        </motion.div>

        {/* ── SIDE PANEL ── */}
        <div className="flex flex-col gap-4">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Progression</h3>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
                    s.done ? 'bg-green-500 text-white' : i === step ? 'bg-[#FFCB00] text-[#1A1A1A]' : 'bg-zinc-100 text-zinc-400')}>
                    {s.done ? '✓' : i + 1}
                  </div>
                  <span className={cn('text-[13px]', s.done ? 'text-zinc-900 font-semibold' : i === step ? 'text-zinc-700 font-medium' : 'text-zinc-400')}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <motion.div
                className="h-full bg-[#FFCB00] rounded-full"
                animate={{ width: `${(steps.filter((s) => s.done).length / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">{steps.filter((s) => s.done).length} / {steps.length} étapes complétées</p>
          </div>

          {/* Preview */}
          <AnimatePresence>
            {(nom || prenom || tel || service) && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-zinc-200 p-5">
                <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Aperçu du dossier</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FFFAE6] border border-[#FDE68A] flex items-center justify-center shrink-0">
                    <span className="font-mono font-black text-[11px] text-[#92400E]">
                      {`${prenom?.[0] ?? '?'}${nom?.[0] ?? '?'}`.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-zinc-900">{[prenom, nom].filter(Boolean).join(' ') || '—'}</p>
                    <p className="text-[12px] text-zinc-400 font-mono">{tel ? `+229 ${tel}` : '—'}</p>
                  </div>
                </div>
                {motif && (
                  <div className="flex items-start gap-2 text-[12px] text-zinc-600 mb-2">
                    <Stethoscope size={12} className="text-zinc-400 mt-0.5 shrink-0" />
                    <span>{motif}</span>
                  </div>
                )}
                {service && (
                  <div className="flex items-center gap-2 text-[12px] text-zinc-600">
                    <Building2 size={12} className="text-zinc-400 shrink-0" />
                    <span>{service}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <div className="p-4 rounded-2xl bg-[#FFFAE6] border border-[#FDE68A]">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">À communiquer</p>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              Le numéro de dossier <span className="font-bold">VIS-XXXX</span> généré sera communiqué au patient avant son passage en caisse.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
