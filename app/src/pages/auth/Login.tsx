import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const DEMO_USERS = [
  { role: 'Admin',        id: 'admin',    hint: 'Configuration et catalogue', color: '#A78BFA' },
  { role: 'Caissier',    id: 'amadou.k', hint: 'Poste de caisse principal',  color: '#34D399' },
  { role: 'Superviseur', id: 'marie.d',  hint: 'Vue multi-caisses',           color: '#FFCB00' },
  { role: 'Accueil',     id: 'jean.a',   hint: 'Enregistrement patient',      color: '#93C5FD' },
]

export default function Login() {
  const { signIn } = useAuth()
  const [id,      setId]      = useState('')
  const [pwd,     setPwd]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(id, pwd)
    if (!result.ok) {
      setError(result.error ?? 'Identifiant ou mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] lg:h-screen lg:max-h-screen lg:overflow-hidden">
      <div className="relative mx-auto min-h-screen lg:h-screen">

        {/* Fond dégradé global — unifié, pas de séparation visible */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[#FFF8E6]" />
          <div className="absolute right-0 top-0 h-full w-[60%] bg-gradient-to-l from-[#FFF6DA] via-[#FFF8E6] to-transparent" />
        </div>

        <div className="relative grid min-h-screen lg:h-screen lg:grid-cols-[1fr_1fr]">

          {/* ── Colonne gauche — formulaire centré ── */}
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-screen items-center justify-center px-5 py-10 lg:h-screen lg:min-h-0 lg:px-10"
          >
            <div className="w-full max-w-[420px]">
              <div className="rounded-[28px] border border-zinc-100/80 bg-white p-7 shadow-[0_8px_40px_rgba(0,0,0,0.07)]">

                {/* Logo Clinica */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFCB00] shadow-sm shrink-0">
                    <span className="font-mono font-black text-[11px] text-[#1A1A1A]">CL</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-zinc-900 leading-none">Clinica</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Hôpital Saint Jean · Bénin</p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[14px] font-medium text-zinc-500">Ravi de vous retrouver</p>
                  <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#18181B] sm:text-[32px]">
                    Connectez-vous<br className="hidden sm:block" /> à Clinica
                  </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="id"
                      className="mb-2 block text-[13px] font-medium text-zinc-700">
                      Identifiant
                    </label>
                    <input
                      ref={ref} id="id" type="text"
                      value={id} onChange={(e) => setId(e.target.value)}
                      autoComplete="username" placeholder="ex: admin"
                      className={cn(
                        'h-12 w-full rounded-2xl border bg-[#FBFBFC] px-4 text-[14px] outline-none transition-all placeholder:text-zinc-300',
                        error
                          ? 'border-red-300 bg-red-50/40'
                          : 'border-zinc-200 focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,203,0,0.12)]'
                      )}
                    />
                  </div>

                  <div>
                    <label htmlFor="pwd"
                      className="mb-2 block text-[13px] font-medium text-zinc-700">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="pwd" type={showPwd ? 'text' : 'password'}
                        value={pwd} onChange={(e) => setPwd(e.target.value)}
                        autoComplete="current-password" placeholder="••••••••"
                        className={cn(
                          'h-12 w-full rounded-2xl border bg-[#FBFBFC] pl-4 pr-11 text-[14px] outline-none transition-all placeholder:text-zinc-300',
                          error
                            ? 'border-red-300 bg-red-50/40'
                            : 'border-zinc-200 focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,203,0,0.12)]'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        aria-label={showPwd ? 'Masquer' : 'Afficher'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-300 transition-colors hover:text-zinc-500"
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-[12px] text-red-500"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !id || !pwd}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1A1A] text-[14px] font-semibold text-white transition-all duration-100 hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" />Connexion...</>
                      : <><ArrowRight size={16} />Entrer dans la plateforme</>
                    }
                  </button>
                </form>

                {/* Comptes démo */}
                <div className="mt-6 border-t border-zinc-100 pt-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
                    Comptes de démo · mot de passe : 1234
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DEMO_USERS.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => { setId(user.id); setPwd('1234'); setError('') }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-[#FCFCFD] px-3 py-2.5 text-left transition-all hover:border-zinc-300 hover:bg-white"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: user.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-zinc-700">{user.role}</p>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-300 hidden sm:block">{user.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.section>

          {/* ── Colonne droite — illustration (fond transparent, unifié) ── */}
          <motion.section
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative hidden items-center justify-center lg:flex lg:h-screen"
          >
            {/* Blob circulaire centré */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[75%] w-[75%] rounded-full bg-[#FFF0BE]/60 blur-2xl" />
            </div>

            {/* Illustration médicale — centré, collé */}
            <div className="relative z-10 flex h-full w-full items-end justify-center pb-0">
              <img
                src="/doctors-cuate.svg"
                alt="Illustration médicale Clinica"
                className="h-[85%] w-auto max-w-full object-contain object-bottom"
              />
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  )
}
