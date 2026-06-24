import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const DEMO_USERS = [
  { role: 'Admin', id: 'admin', hint: 'Configuration et catalogue', color: '#A78BFA' },
  { role: 'Caissier', id: 'amadou.k', hint: 'Poste de caisse principal', color: '#34D399' },
  { role: 'Superviseur', id: 'marie.d', hint: 'Vue multi-caisses', color: '#FFCB00' },
  { role: 'Accueil', id: 'jean.a', hint: 'Enregistrement patient', color: '#93C5FD' },
]

export default function Login() {
  const { signIn } = useAuth()
  const [id, setId] = useState('')
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

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
    <div className="min-h-screen bg-[#FFF] lg:h-screen lg:max-h-screen lg:overflow-hidden">
      <div className="relative mx-auto min-h-screen max-w-[1600px] bg-[#FFF] lg:h-screen">
        <div className="absolute left-[8%] top-14 hidden h-5 w-28 rounded-md bg-[#E8EEF5] lg:block" />
        <div className="absolute left-[8%] top-[30%] hidden h-5 w-40 rounded-md bg-[#E8EEF5] lg:block" />
        <div className="absolute left-[8%] top-[36%] hidden h-5 w-56 rounded-md bg-[#E8EEF5] lg:block" />
        <div className="absolute left-[8%] top-[44%] hidden h-2.5 w-52 rounded-full bg-[#EAEFF5] lg:block" />
        <div className="absolute left-[8%] top-[48%] hidden h-2.5 w-56 rounded-full bg-[#EEF2F7] lg:block" />
        <div className="absolute left-[8%] top-[52%] hidden h-2.5 w-48 rounded-full bg-[#EEF2F7] lg:block" />
        <div className="absolute left-[8%] top-[62%] hidden h-10 w-24 rounded-xl bg-[#FDE8A6] lg:block" />

        <div className="grid min-h-screen lg:h-screen lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex min-h-screen items-center px-5 py-8 sm:px-8 lg:h-screen lg:min-h-0 lg:px-16 lg:py-6 xl:px-24"
          >
            <div className="w-full">
              <div className="rounded-[28px] border border-zinc-100 bg-white p-6 sm:p-8">
                <div className="mb-8">
                  <p className="text-[14px] font-medium text-zinc-500">Ravi de vous retrouver</p>
                  <h1 className="mt-3 text-[30px] font-bold leading-[1.05] text-[#18181B] sm:text-[36px]">
                    Connectez-vous à Clinica
                  </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="id" className="mb-2 block text-[13px] font-medium text-zinc-700">
                      Identifiant
                    </label>
                    <input
                      ref={ref}
                      id="id"
                      type="text"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      autoComplete="username"
                      placeholder="ex: admin"
                      className={cn(
                        'h-12 w-full rounded-2xl border bg-[#FBFBFC] px-4 text-[14px] outline-none transition-all placeholder:text-zinc-300',
                        error
                          ? 'border-red-300 bg-red-50/40'
                          : 'border-zinc-200 focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,203,0,0.12)]'
                      )}
                    />
                  </div>

                  <div>
                    <label htmlFor="pwd" className="mb-2 block text-[13px] font-medium text-zinc-700">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="pwd"
                        type={showPwd ? 'text' : 'password'}
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        autoComplete="current-password"
                        placeholder="********"
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
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {loading ? 'Connexion...' : 'Entrer dans la plateforme'}
                  </button>
                </form>

                <div className="mt-6 border-t border-zinc-100 pt-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
                    Comptes de demo
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {DEMO_USERS.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setId(user.id)
                          setPwd('1234')
                          setError('')
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-[#FCFCFD] px-3 py-3 text-left transition-all hover:border-zinc-300 hover:bg-white"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: user.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-zinc-700">{user.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="relative hidden overflow-hidden bg-[#FFF] lg:flex lg:h-screen"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_14%,rgba(255,244,209,0.85),rgba(255,255,255,0.6)_32%,rgba(255,255,255,0)_58%)]" />
            <div className="absolute right-[-10%] top-[-4%] h-[82%] w-[88%] rounded-[44%] bg-[#FFF6DA]" />
            <div className="absolute right-[12%] top-[6%] flex gap-5 opacity-75">
              <span className="h-2 w-12 rounded-full bg-white/90" />
              <span className="h-2 w-12 rounded-full bg-white/85" />
              <span className="h-2 w-12 rounded-full bg-white/80" />
            </div>
            <div className="relative flex w-full items-center justify-center px-6 py-10 xl:px-10">
              <div className="absolute left-[12%] top-[19%] max-w-[260px] rounded-[28px] bg-white/66 px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.05)] backdrop-blur">
                <div className="mb-3 h-3 w-16 rounded-full bg-[#E6EDF5]" />
                <div className="mb-2 h-4 w-32 rounded-md bg-[#E9EFF6]" />
                <div className="h-3 w-44 rounded-full bg-[#EEF3F8]" />
              </div>
              <div className="absolute left-[15%] top-[33%] max-w-[320px] rounded-[28px] bg-white/52 px-5 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] backdrop-blur">
                <div className="mb-3 h-3 w-28 rounded-full bg-[#E6EDF5]" />
                <div className="mb-2 h-3 w-52 rounded-full bg-[#EEF3F8]" />
                <div className="mb-2 h-3 w-56 rounded-full bg-[#EEF3F8]" />
                <div className="h-3 w-44 rounded-full bg-[#EEF3F8]" />
              </div>

              <img
                src="/doctors-cuate.svg"
                alt="Illustration medicale"
                className="relative z-10 w-full max-w-[640px] object-contain"
              />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
