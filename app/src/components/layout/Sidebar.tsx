import { useState, createContext, useContext } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wallet, ClipboardList, FileText, LogOut,
  AlertTriangle, Users, BookOpen, Activity, BarChart3,
  Building2, UserCog, ScrollText, ChevronLeft, ChevronDown, Menu, X, Database, Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/constants'

/* ─── Context ─────────────────────────────────────── */
const SidebarCtx = createContext({ collapsed: false })
export const useSidebarCtx = () => useContext(SidebarCtx)

/* ─── Nav config ──────────────────────────────────── */
interface NavSubItem { label: string; to: string }
interface NavItem { label: string; to: string; icon: typeof LayoutDashboard; children?: NavSubItem[] }
const NAV: Record<Role, { section: string; items: NavItem[] }[]> = {
  caissier: [{ section: 'Caisse', items: [
    { label: 'Encaissement', to: '/caissier/encaissement', icon: Wallet },
    {
      label: 'Historique',
      to: '/caissier/historique/dossiers',
      icon: ClipboardList,
      children: [
        { label: 'Historique dossiers', to: '/caissier/historique/dossiers' },
        { label: 'Historique paiements', to: '/caissier/historique/paiements' },
      ],
    },
    { label: 'Factures',     to: '/caissier/factures',     icon: FileText },
  ]}],
  superviseur: [{ section: 'Supervision', items: [
    { label: 'Dashboard', to: '/superviseur/dashboard', icon: LayoutDashboard },
    { label: 'Alertes',   to: '/superviseur/alertes',   icon: AlertTriangle },
    { label: 'Versement', to: '/superviseur/versement', icon: Building2 },
    { label: 'Rapports',  to: '/superviseur/rapports',  icon: BarChart3 },
  ]}],
  accueil: [{ section: 'Accueil', items: [
    { label: 'Enregistrement', to: '/accueil/enregistrement', icon: Users },
    { label: 'Dossiers',       to: '/accueil/dossiers',       icon: ClipboardList },
  ]}],
  recouvrement: [{ section: 'Recouvrement', items: [
    { label: 'Sejours', to: '/recouvrement/sejours', icon: Building2 },
    { label: 'Ressources', to: '/recouvrement/ressources', icon: Database },
  ]}],
  admin: [{ section: 'Administration', items: [
    { label: 'Catalogue', to: '/admin/catalogue', icon: BookOpen },
    {
      label: 'Stock pharmacie',
      to: '/admin/stock-pharmacie/produits',
      icon: Boxes,
      children: [
        { label: 'Produits', to: '/admin/stock-pharmacie/produits' },
        { label: 'Mouvements', to: '/admin/stock-pharmacie/mouvements' },
      ],
    },
    { label: 'Hospitalisation', to: '/admin/hospitalisation', icon: Building2 },
    { label: 'Caisses',   to: '/admin/caisses',   icon: Wallet },
    { label: 'Comptes',   to: '/admin/comptes',   icon: UserCog },
    { label: 'Versements', to: '/admin/versements', icon: Building2 },
    { label: 'Alertes', to: '/admin/alertes', icon: AlertTriangle },
    { label: 'Rapports', to: '/admin/rapports', icon: BarChart3 },
    { label: 'Journal', to: '/admin/journal-audit', icon: Activity },
    { label: 'Sauvegardes', to: '/admin/sauvegardes', icon: Database },
  ]}],
  auditeur: [{ section: 'Audit', items: [
    { label: 'Relevé',  to: '/auditeur/releve',  icon: ScrollText },
    { label: 'Journal', to: '/auditeur/journal', icon: Activity },
  ]}],
}
const ROLE_BADGE: Record<Role, { bg: string; text: string; label: string }> = {
  admin:       { bg: 'rgba(124,58,237,0.18)',  text: '#A78BFA', label: 'Admin' },
  superviseur: { bg: 'rgba(255,203,0,0.18)',   text: '#FFCB00', label: 'Superviseur' },
  caissier:    { bg: 'rgba(16,185,129,0.18)',  text: '#34D399', label: 'Caissier' },
  accueil:     { bg: 'rgba(59,130,246,0.18)',  text: '#93C5FD', label: 'Accueil' },
  auditeur:    { bg: 'rgba(161,161,170,0.18)', text: '#D4D4D8', label: 'Auditeur' },
  recouvrement:{ bg: 'rgba(244,114,182,0.18)', text: '#F472B6', label: 'Recouvrement' },
}

/* ─── Sidebar inner ───────────────────────────────── */
function SidebarInner({ collapsed, onClose, onToggle }: {
  collapsed: boolean; onClose?: () => void; onToggle?: () => void
}) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [openBranches, setOpenBranches] = useState<Record<string, boolean>>({})
  if (!user) return null

  const badge = ROLE_BADGE[user.role]
  const groups = NAV[user.role] ?? []
  const W = collapsed ? 64 : 220

  const toggleBranch = (key: string) => {
    setOpenBranches((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <motion.div
      animate={{ width: W }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full bg-[#111111] overflow-hidden relative"
      style={{ minWidth: W }}
    >
      {/* Brand */}
      <div className={cn('flex items-center border-b border-white/5 shrink-0', collapsed ? 'justify-center py-5 px-0' : 'gap-2.5 px-4 py-5')}>
        <div className="w-8 h-8 rounded-xl bg-[#FFCB00] flex items-center justify-center shrink-0 shadow-sm">
          <span className="font-mono font-black text-[10px] text-[#1A1A1A]">CT</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }} className="flex-1 min-w-0 overflow-hidden">
              <p className="text-white font-semibold text-[13px] leading-none whitespace-nowrap">CaisseTrace</p>
              <p className="text-zinc-500 text-[10px] mt-0.5 whitespace-nowrap">Santé 229</p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Collapse toggle — desktop only */}
        {onToggle && (
          <button onClick={onToggle} aria-label={collapsed ? 'Développer' : 'Réduire'}
            className={cn('p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-all duration-150', collapsed ? 'absolute bottom-[88px] left-1/2 -translate-x-1/2' : 'ml-auto')}>
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronLeft size={14} />
            </motion.div>
          </button>
        )}
      </div>

      {/* Role badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }} className="px-4 py-2.5 border-b border-white/5 overflow-hidden">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ backgroundColor: badge.bg, color: badge.text }}>
              {badge.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        {groups.map((group) => (
          <div key={group.section}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 whitespace-nowrap overflow-hidden">
                  {group.section}
                </motion.p>
              )}
            </AnimatePresence>
            {group.items.map((item) => {
              const hasChildren = Boolean(item.children?.length)
              const isActiveBranch = hasChildren
                ? item.children!.some((child) => location.pathname.startsWith(child.to))
                : location.pathname.startsWith(item.to)
              const isBranchOpen = hasChildren && !collapsed
                ? (openBranches[item.label] ?? isActiveBranch)
                : false

              if (hasChildren && !collapsed) {
                return (
                  <div key={item.label} className="mx-2">
                    <button
                      type="button"
                      onClick={() => toggleBranch(item.label)}
                      className={cn(
                        'group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors duration-75 relative overflow-hidden',
                        isActiveBranch ? 'bg-white/8 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
                      )}
                    >
                      {isActiveBranch && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#FFCB00] rounded-full" />
                      )}
                      <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.15 }}>
                        <item.icon size={15} className={cn('shrink-0', isActiveBranch ? 'text-[#FFCB00]' : 'text-zinc-500 group-hover:text-zinc-300')} />
                      </motion.div>
                      <span className="flex-1 text-[13px] font-medium whitespace-nowrap overflow-hidden">
                        {item.label}
                      </span>
                      <ChevronDown
                        size={14}
                        className={cn('shrink-0 transition-transform duration-200', isBranchOpen && 'rotate-180')}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isBranchOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 space-y-0.5 pl-6">
                            {item.children!.map((child) => (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                onClick={onClose}
                                className={({ isActive }) => cn(
                                  'block rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-75',
                                  isActive ? 'bg-white/8 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200',
                                )}
                              >
                                {child.label}
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              if (hasChildren && collapsed) {
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      navigate(item.to)
                      onClose?.()
                    }}
                    className={cn(
                      'group flex items-center gap-2.5 mb-0.5 transition-colors duration-75 relative overflow-hidden justify-center mx-2 px-0 py-2.5 rounded-xl w-[calc(100%-1rem)]',
                      isActiveBranch ? 'bg-white/8 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
                    )}
                  >
                    <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.15 }}>
                      <item.icon size={15} className={cn('shrink-0', isActiveBranch ? 'text-[#FFCB00]' : 'text-zinc-500 group-hover:text-zinc-300')} />
                    </motion.div>
                  </button>
                )
              }

              return (
                <NavLink key={item.to} to={item.to} onClick={onClose}
                  className={({ isActive }) => cn(
                    'group flex items-center gap-2.5 mb-0.5 transition-colors duration-75 relative overflow-hidden',
                    collapsed ? 'justify-center mx-2 px-0 py-2.5 rounded-xl' : 'mx-2 px-3 py-2 rounded-xl',
                    isActive ? 'bg-white/8 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  )}>
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#FFCB00] rounded-full" />
                      )}
                      <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.15 }}>
                        <item.icon size={15} className={cn('shrink-0', isActive ? 'text-[#FFCB00]' : 'text-zinc-500 group-hover:text-zinc-300')} />
                      </motion.div>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 text-[13px] font-medium whitespace-nowrap overflow-hidden">
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}

        {/* Caisse badge */}
        {user.caisse && (
          <div>
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                  Poste actif
                </motion.p>
              )}
            </AnimatePresence>
            <div className={cn('mx-2 rounded-xl bg-white/5 border border-white/5', collapsed ? 'p-2.5 flex justify-center' : 'px-3 py-2')}>
              {collapsed ? (
                <div className="w-5 h-5 rounded bg-[#FFCB00] flex items-center justify-center">
                  <Wallet size={10} className="text-[#1A1A1A]" />
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-zinc-500 mb-0.5">Caisse active</p>
                  <p className="font-mono text-[11px] text-[#FFCB00] font-semibold truncate">{user.caisse}</p>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-white/5 shrink-0', collapsed ? 'px-2 py-3 flex justify-center' : 'px-3 py-3 flex items-center gap-2.5')}>
        <div className="w-7 h-7 rounded-full bg-[#FFCB00] flex items-center justify-center shrink-0">
          <span className="font-mono font-black text-[10px] text-[#1A1A1A]">{user.initiales}</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
              <p className="text-zinc-200 text-[12px] font-medium truncate">{user.nom}</p>
              <p className="text-zinc-500 text-[10px] capitalize">{user.role}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {!collapsed && (
          <button onClick={() => { signOut(); navigate('/login') }} aria-label="Se déconnecter"
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/8 rounded-lg transition-all duration-150">
            <LogOut size={14} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Main export ─────────────────────────────────── */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SidebarCtx.Provider value={{ collapsed }}>
      {/* Desktop */}
      <aside className="hidden lg:flex shrink-0 h-screen sticky top-0">
        <SidebarInner collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </aside>

      {/* Mobile toggle */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 rounded-xl bg-[#111] text-white shadow-lg border border-white/10 flex items-center justify-center">
        <Menu size={16} />
      </motion.button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex shadow-2xl">
              <SidebarInner collapsed={false} onClose={() => setMobileOpen(false)} />
              <button onClick={() => setMobileOpen(false)} aria-label="Fermer"
                className="absolute top-4 right-[-40px] w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <X size={14} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SidebarCtx.Provider>
  )
}
