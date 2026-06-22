import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { PageHeader, Btn } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { UserCog, Plus, Shield, Eye, EyeOff, Users } from 'lucide-react'
import { MOCK_USERS } from '@/lib/constants'
import type { Role } from '@/lib/constants'

const RS: Record<Role, { bg: string; text: string; border: string }> = {
  admin:       { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  superviseur: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  caissier:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  accueil:     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  auditeur:    { bg: 'bg-zinc-100',  text: 'text-zinc-600',   border: 'border-zinc-200' },
}

export default function Comptes() {
  const [showPwds, setShowPwds] = useState(false)
  const roleCount = MOCK_USERS.reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }), {})

  return (
    <Layout>
      <PageHeader
        title="Gestion des comptes"
        subtitle={`${MOCK_USERS.length} comptes utilisateurs`}
        actions={
          <>
            <Btn variant="ghost" icon={showPwds ? EyeOff : Eye} onClick={() => setShowPwds((v) => !v)}>
              {showPwds ? 'Masquer' : 'Afficher'} codes
            </Btn>
            <Btn variant="primary" icon={Plus}>Nouveau compte</Btn>
          </>
        }
      />

      {/* Role summary */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {Object.entries(roleCount).map(([role, count]) => {
          const s = RS[role as Role] ?? RS.auditeur
          return (
            <div key={role} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${s.bg} ${s.border}`}>
              <Users size={13} className={s.text} />
              <span className={`text-[13px] font-semibold ${s.text} capitalize`}>{role}</span>
              <span className={`font-mono font-black text-[14px] ${s.text}`}>{count}</span>
            </div>
          )
        })}
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center"><Shield size={14} className="text-zinc-500" /></div>
          <h2 className="text-[15px] font-semibold text-zinc-900">Utilisateurs du système</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {MOCK_USERS.map((u) => {
            const s = RS[u.role] ?? RS.auditeur
            return (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-[#FFCB00] flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-mono font-black text-[11px] text-[#1A1A1A]">{u.initiales}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-zinc-900">{u.nom}</p>
                  <p className="text-[12px] font-mono text-zinc-400">{u.identifiant}</p>
                </div>
                <span className={`px-3 py-1 rounded-xl text-[11px] font-bold capitalize border ${s.bg} ${s.text} ${s.border}`}>{u.role}</span>
                {u.caisse && <span className="text-[11px] text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full hidden sm:block">{u.caisse}</span>}
                {showPwds && (
                  <span className="font-mono text-[12px] bg-zinc-900 text-zinc-100 px-3 py-1 rounded-lg">{u.motDePasse}</span>
                )}
                <button className="p-2 rounded-xl border border-zinc-200 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-all" aria-label="Modifier le compte">
                  <UserCog size={14} />
                </button>
              </div>
            )
          })}
        </div>
        <div className="px-6 py-4 bg-amber-50 border-t border-amber-200 flex items-start gap-3">
          <Shield size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700">Les mots de passe doivent être changés à la première connexion. En production, utilisez un système d'authentification sécurisé avec hachage.</p>
        </div>
      </Card>
    </Layout>
  )
}
