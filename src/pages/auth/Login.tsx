import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function Login() {
  const { signIn } = useAuth()
  const [id, setId] = useState('')
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    if (!signIn(id, pwd)) {
      setError('Identifiant ou mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[900px] min-h-[520px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex"
      >
        {/* Left — gradient panel */}
        <div className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #FFCB00 0%, #FFB800 35%, #FF9500 70%, #FF6B00 100%)',
          }}>
          {/* Noise overlay for premium texture */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }} />

          {/* Top — brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1A1A1A]/15 backdrop-blur-sm flex items-center justify-center">
                <span className="font-mono font-black text-[10px] text-[#1A1A1A]">CT</span>
              </div>
              <span className="font-bold text-[15px] text-[#1A1A1A]/80">CaisseTrace</span>
            </div>
          </div>

          {/* Bottom — tagline */}
          <div className="relative z-10">
            <p className="text-[13px] text-[#1A1A1A]/50 font-medium mb-2">Hôpital Saint Jean · Bénin</p>
            <h2 className="text-[26px] font-black text-[#1A1A1A] leading-tight">
              La caisse hospitalière<br />connectée au futur.
            </h2>
            <div className="flex items-center gap-2 mt-5">
              <div className="flex items-center gap-1.5 bg-[#1A1A1A]/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/40" />
                <span className="text-[11px] font-semibold text-[#1A1A1A]/70">Propulsé par MTN MoMo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex flex-col justify-center px-10 py-12">
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#FFCB00] flex items-center justify-center">
              <span className="font-mono font-black text-[10px] text-[#1A1A1A]">CT</span>
            </div>
            <span className="font-bold text-[15px] text-zinc-900">CaisseTrace</span>
          </div>

          <div className="mb-8">
            <div className="w-7 h-7 rounded-full bg-[#FFCB00] flex items-center justify-center mb-4">
              <span className="text-[#1A1A1A] font-black text-[15px] leading-none">*</span>
            </div>
            <h1 className="text-[28px] font-bold text-zinc-900 leading-tight mb-2">
              Connexion
            </h1>
            <p className="text-[14px] text-zinc-400 leading-relaxed">
              Accédez au système de caisse sécurisé<br />de l'Hôpital Saint Jean.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifiant */}
            <div>
              <label htmlFor="id" className="block text-[13px] font-medium text-zinc-700 mb-2">
                Identifiant
              </label>
              <input
                ref={ref} id="id" type="text" value={id} onChange={(e) => setId(e.target.value)}
                autoComplete="username" placeholder="ex: amadou.k"
                className={cn(
                  'w-full h-11 px-4 rounded-xl text-[14px] border-[1.5px] bg-zinc-50 outline-none transition-all duration-150 placeholder:text-zinc-300',
                  error
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-zinc-200 focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,203,0,0.12)]'
                )}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="pwd" className="block text-[13px] font-medium text-zinc-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="pwd" type={showPwd ? 'text' : 'password'} value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  autoComplete="current-password" placeholder="••••••••"
                  className={cn(
                    'w-full h-11 pl-4 pr-11 rounded-xl text-[14px] border-[1.5px] bg-zinc-50 outline-none transition-all duration-150 placeholder:text-zinc-300',
                    error
                      ? 'border-red-300 bg-red-50/40'
                      : 'border-zinc-200 focus:border-[#FFCB00] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,203,0,0.12)]'
                  )}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[12px] text-red-500 mt-2">
                  {error}
                </motion.p>
              )}
            </div>

            {/* CTA */}
            <button type="submit" disabled={loading || !id || !pwd}
              className="w-full h-11 rounded-xl bg-[#1A1A1A] hover:bg-zinc-700 active:scale-[0.98] text-white text-[14px] font-semibold transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <p className="text-[11px] text-zinc-300 uppercase font-semibold tracking-widest mb-3">Comptes de démo</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { role: 'Caissier', id: 'amadou.k', color: '#34D399' },
                { role: 'Superviseur', id: 'marie.d', color: '#FFCB00' },
                { role: 'Accueil', id: 'jean.a', color: '#93C5FD' },
              ].map((u) => (
                <button key={u.id} type="button"
                  onClick={() => { setId(u.id); setPwd('1234'); setError('') }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: u.color }} />
                  <span className="text-[12px] font-medium text-zinc-600">{u.role}</span>
                  <span className="font-mono text-[11px] text-zinc-400">{u.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
