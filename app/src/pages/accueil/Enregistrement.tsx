import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  UserPlus,
  Phone,
  User,
  Stethoscope,
  Building2,
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { VisitConfirmation } from '@/components/shared/VisitConfirmation'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/formatDate'
import { createVisit, duplicateCheckVisits } from '@/services/visitApi'
import type { VisitRecord } from '@/types/visit'

const SERVICES = [
  { id: 'med', label: 'Medecine generale', badge: 'MG', color: 'blue' },
  { id: 'chir', label: 'Chirurgie', badge: 'CH', color: 'orange' },
  { id: 'mat', label: 'Maternite', badge: 'MA', color: 'pink' },
  { id: 'pharma', label: 'Pharmacie', badge: 'PH', color: 'green' },
  { id: 'cardio', label: 'Cardiologie', badge: 'CA', color: 'red' },
  { id: 'labo', label: 'Laboratoire', badge: 'LA', color: 'purple' },
]

const MOTIFS = [
  'Consultation generale',
  'Douleurs abdominales',
  'Controle tension',
  'Vaccination',
  'Urgence medicale',
  'Suivi grossesse',
  'Analyse medicale',
  'Traumatisme',
  'Autre',
]

const SERVICE_COLOR: Record<string, { active: string }> = {
  blue: { active: 'border-blue-400 bg-blue-50' },
  orange: { active: 'border-orange-400 bg-orange-50' },
  pink: { active: 'border-pink-400 bg-pink-50' },
  green: { active: 'border-green-400 bg-green-50' },
  red: { active: 'border-red-400 bg-red-50' },
  purple: { active: 'border-purple-400 bg-purple-50' },
}

type DuplicateStatus = 'idle' | 'checking' | 'ok' | 'doublon'

function Field({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string
  label: string
  icon: typeof User
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-zinc-500"
      >
        <Icon size={11} className="text-zinc-400" />
        {label}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500"
        >
          <AlertCircle size={11} />
          {error}
        </motion.p>
      )}
    </div>
  )
}

function formatPreviewPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 8 || digits.length === 10) return `+229 ${value}`
  return value || '-'
}

export default function Enregistrement() {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [tel, setTel] = useState('')
  const [contactUrgenceTel, setContactUrgenceTel] = useState('')
  const [motif, setMotif] = useState('')
  const [service, setService] = useState('')
  const [parcoursType, setParcoursType] = useState<'EXTERNE' | 'HOSPITALISATION'>('EXTERNE')
  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateStatus>('idle')
  const [duplicateLookupError, setDuplicateLookupError] = useState('')
  const [duplicates, setDuplicates] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmed, setConfirmed] = useState<VisitRecord | null>(null)

  const phoneDigits = tel.replace(/\D/g, '')
  const shouldCheckDuplicates =
    phoneDigits.length >= 8 || (nom.trim().length > 1 && prenom.trim().length > 1)

  useEffect(() => {
    if (!shouldCheckDuplicates) {
      setDuplicateStatus('idle')
      setDuplicateLookupError('')
      setDuplicates([])
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setDuplicateStatus('checking')
      setDuplicateLookupError('')
      try {
        const items = await duplicateCheckVisits({
          patientNom: nom.trim(),
          patientPrenom: prenom.trim(),
          patientTel: tel,
        })
        setDuplicates(items)
        setDuplicateStatus(items.length > 0 ? 'doublon' : 'ok')
      } catch {
        setDuplicates([])
        setDuplicateStatus('idle')
        setDuplicateLookupError('Verification des doublons indisponible pour le moment.')
      }
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [nom, prenom, tel, shouldCheckDuplicates])

  const contactDone =
    phoneDigits.length >= 8 &&
    duplicateStatus !== 'checking' &&
    (duplicateStatus === 'ok' || duplicateStatus === 'doublon' || duplicateLookupError.length > 0)

  const steps = [
    { label: 'Identite', done: !!(nom && prenom) },
    { label: 'Contact', done: contactDone },
    { label: 'Motif', done: !!motif },
    { label: 'Service', done: !!service },
    { label: 'Parcours', done: !!parcoursType },
  ]
  const currentStep = steps.findIndex((item) => !item.done)
  const valid = steps.every((item) => item.done)

  const inputClass = (extra = '') =>
    cn(
      'h-10 w-full rounded-lg border bg-white px-3.5 text-[14px] outline-none transition-all duration-100 placeholder:text-zinc-300',
      extra
    )

  const reset = () => {
    setConfirmed(null)
    setNom('')
    setPrenom('')
    setTel('')
    setContactUrgenceTel('')
    setMotif('')
    setService('')
    setParcoursType('EXTERNE')
    setDuplicateStatus('idle')
    setDuplicateLookupError('')
    setDuplicates([])
    setSubmitError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setSubmitError('')
    try {
      const visit = await createVisit({
        patientNom: nom,
        patientPrenom: prenom,
        patientTel: tel,
        contactUrgenceTel,
        motifVisite: motif,
        serviceOriente: service,
        parcoursType,
      })
      setConfirmed(visit)
    } catch {
      setSubmitError('Creation impossible. Verifiez le backend et vos droits accueil.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <VisitConfirmation
        visId={confirmed.idVisite}
        nom={confirmed.patientNomComplet}
        tel={confirmed.patientTel}
        motif={confirmed.motifVisite}
        onNouveauPatient={reset}
      />
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-zinc-900">Enregistrement patient</h1>
        <p className="mt-0.5 text-[13px] text-zinc-400">Creer un nouveau dossier de visite</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_280px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/60 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFCB00]">
              <UserPlus size={15} className="text-[#1A1A1A]" />
            </div>
            <div className="flex-1">
              <h2 className="text-[14px] font-bold text-zinc-900">Nouveau patient</h2>
              <p className="text-[11px] text-zinc-400">Tous les champs * sont obligatoires</p>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              {steps.map((item, index) => (
                <div
                  key={item.label}
                  title={item.label}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    item.done
                      ? 'bg-green-500'
                      : index === currentStep
                        ? 'animate-pulse bg-[#FFCB00]'
                        : 'bg-zinc-200'
                  )}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-black text-zinc-400">
                  1
                </span>
                Identite
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="nom" label="Nom *" icon={User}>
                  <input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    placeholder="Kouassi"
                    className={inputClass(
                      nom
                        ? 'border-green-300 bg-green-50/30'
                        : 'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]'
                    )}
                  />
                </Field>
                <Field id="prenom" label="Prenom *" icon={User}>
                  <input
                    id="prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                    placeholder="Fatima"
                    className={inputClass(
                      prenom
                        ? 'border-green-300 bg-green-50/30'
                        : 'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]'
                    )}
                  />
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-black text-zinc-400">
                  2
                </span>
                Contact
              </p>
              <div className="space-y-4">
                <Field id="tel" label="Telephone *" icon={Phone}>
                  <div className="flex gap-2">
                    <div className="flex h-10 shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-100 px-3">
                      <span className="font-mono text-[13px] font-semibold text-zinc-600">+229</span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        id="tel"
                        value={tel}
                        onChange={(e) => setTel(e.target.value)}
                        placeholder="97 12 34 56"
                        className={inputClass(
                          cn(
                            'pr-10',
                            duplicateStatus === 'ok' && 'border-green-400 bg-green-50/30',
                            duplicateStatus === 'doublon' && 'border-amber-400 bg-amber-50/20',
                            duplicateStatus === 'idle' &&
                              'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]'
                          )
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {duplicateStatus === 'checking' && (
                          <Loader2 size={14} className="animate-spin text-zinc-400" />
                        )}
                        {duplicateStatus === 'ok' && <CheckCircle size={14} className="text-green-500" />}
                        {duplicateStatus === 'doublon' && <AlertCircle size={14} className="text-amber-500" />}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {duplicateStatus === 'ok' && (
                      <motion.p
                        key="duplicate-ok"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-green-600"
                      >
                        <CheckCircle size={11} />
                        Aucun doublon detecte sur le numero ou l'identite.
                      </motion.p>
                    )}
                    {duplicateStatus === 'doublon' && (
                      <motion.div
                        key="duplicate-warning"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3"
                      >
                        <p className="flex items-center gap-1 text-[12px] font-semibold text-amber-700">
                          <AlertCircle size={11} />
                          Des dossiers similaires existent deja. Verification conseillee avant creation.
                        </p>
                        <div className="mt-2 space-y-2">
                          {duplicates.slice(0, 3).map((item) => (
                            <div
                              key={item.idVisite}
                              className="rounded-lg border border-amber-100 bg-white/70 px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[12px] font-semibold text-zinc-800">
                                  {item.patientNomComplet}
                                </p>
                                <span className="font-mono text-[11px] font-bold text-amber-700">
                                  {item.idVisite}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-zinc-500">
                                {item.serviceOriente} - {formatDate(item.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {duplicateLookupError && (
                      <motion.p
                        key="duplicate-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1.5 text-[12px] font-medium text-zinc-500"
                      >
                        {duplicateLookupError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </Field>

                <Field id="contact-urgence" label="Contact d'urgence" icon={Phone}>
                  <div className="flex gap-2">
                    <div className="flex h-10 shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-100 px-3">
                      <span className="font-mono text-[13px] font-semibold text-zinc-600">+229</span>
                    </div>
                    <input
                      id="contact-urgence"
                      value={contactUrgenceTel}
                      onChange={(e) => setContactUrgenceTel(e.target.value)}
                      placeholder="01 90 11 22 33"
                      className={inputClass(
                        'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]'
                      )}
                    />
                  </div>
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-black text-zinc-400">
                  3
                </span>
                Motif de consultation
              </p>
              <Field id="motif" label="Motif *" icon={Stethoscope}>
                <div className="relative">
                  <select
                    id="motif"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    required
                    className={inputClass(
                      cn(
                        'cursor-pointer appearance-none pr-8',
                        motif
                          ? 'border-green-300 bg-green-50/30'
                          : 'border-zinc-200 focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.12)]'
                      )
                    )}
                  >
                    <option value="">Selectionner un motif...</option>
                    {MOTIFS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    v
                  </span>
                </div>
              </Field>
            </div>

            <div>
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-black text-zinc-400">
                  4
                </span>
                Service d'orientation
              </p>
              <label className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">
                <Building2 size={11} className="text-zinc-400" />
                Service *
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SERVICES.map((item) => {
                  const active = service === item.label
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setService(item.label)}
                      className={cn(
                        'relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-100',
                        active
                          ? cn('border-2 shadow-sm', SERVICE_COLOR[item.color].active)
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                      )}
                    >
                      {active && (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
                      )}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-zinc-500">
                        {item.badge}
                      </span>
                      <span
                        className={cn(
                          'text-[12px] leading-tight',
                          active ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-600'
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-black text-zinc-400">
                  5
                </span>
                Parcours
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'EXTERNE', label: 'Externe' },
                  { value: 'HOSPITALISATION', label: 'Hospitalisation' },
                ].map((item) => {
                  const active = parcoursType === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setParcoursType(item.value as 'EXTERNE' | 'HOSPITALISATION')}
                      className={cn(
                        'rounded-lg border px-3 py-3 text-left text-[13px] transition-all duration-100',
                        active
                          ? 'border-[#FFCB00] bg-[#FFFAE6] font-semibold text-zinc-900'
                          : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {submitError && <p className="text-[12px] font-medium text-red-500">{submitError}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!valid || loading}
                className={cn(
                  'flex h-12 w-full items-center justify-center gap-2.5 rounded-lg text-[14px] font-bold transition-all duration-100',
                  valid && !loading
                    ? 'cursor-pointer bg-[#1A1A1A] text-white shadow-sm hover:bg-zinc-700 active:scale-[0.99]'
                    : 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creation en cours...
                  </>
                ) : valid ? (
                  <>
                    <UserPlus size={16} />
                    Creer le dossier
                  </>
                ) : (
                  <>Completez tous les champs ({steps.filter((item) => item.done).length}/{steps.length})</>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-zinc-500">Progression</h3>
            <div className="space-y-3">
              {steps.map((item, index) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                      item.done
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                          ? 'bg-[#FFCB00] text-[#1A1A1A]'
                          : 'bg-zinc-100 text-zinc-400'
                    )}
                  >
                    {item.done ? 'OK' : index + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[13px]',
                      item.done
                        ? 'font-semibold text-zinc-900'
                        : index === currentStep
                          ? 'font-medium text-zinc-700'
                          : 'text-zinc-400'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <motion.div
                className="h-full rounded-full bg-[#FFCB00]"
                animate={{ width: `${(steps.filter((item) => item.done).length / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">
              {steps.filter((item) => item.done).length} / {steps.length} etapes completees
            </p>
          </div>

          <AnimatePresence>
            {(nom || prenom || tel || service) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-zinc-500">
                  Apercu du dossier
                </h3>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#FDE68A] bg-[#FFFAE6]">
                    <span className="font-mono text-[11px] font-black text-[#92400E]">
                      {`${prenom?.[0] ?? '?'}${nom?.[0] ?? '?'}`.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-zinc-900">
                      {[prenom, nom].filter(Boolean).join(' ') || '-'}
                    </p>
                    <p className="font-mono text-[12px] text-zinc-400">{tel ? formatPreviewPhone(tel) : '-'}</p>
                    {contactUrgenceTel && (
                      <p className="font-mono text-[11px] text-zinc-400">
                        Urgence: {formatPreviewPhone(contactUrgenceTel)}
                      </p>
                    )}
                  </div>
                </div>
                {motif && (
                  <div className="mb-2 flex items-start gap-2 text-[12px] text-zinc-600">
                    <Stethoscope size={12} className="mt-0.5 shrink-0 text-zinc-400" />
                    <span>{motif}</span>
                  </div>
                )}
                {service && (
                  <div className="flex items-center gap-2 text-[12px] text-zinc-600">
                    <Building2 size={12} className="shrink-0 text-zinc-400" />
                    <span>{service}</span>
                  </div>
                )}
                <div className="mt-2 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                  {parcoursType === 'HOSPITALISATION' ? 'Parcours hospitalisation' : 'Parcours externe'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFAE6] p-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
              A communiquer
            </p>
            <p className="text-[12px] leading-relaxed text-amber-700">
              Chaque nouveau passage genere un nouveau numero de dossier VIS-XXXX avant le passage en caisse.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
