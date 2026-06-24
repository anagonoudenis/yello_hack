import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wallet, ClipboardList, FileText,
  AlertTriangle, Users, BookOpen, Activity, BarChart3,
  Building2, UserCog, ScrollText, LogOut, Menu, X,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/constants'
import useAlertStore from '@/store/alertStore'

/* ─── Nav config ─────────────────────────────────── */
interface NavItem { label: string; to: string; icon: typeof LayoutDashboard }
const NAV: Record<Role, { section: string; items: NavItem[] }[]> = {
  caissier: [{ section: 'Caisse', items: [
    { label: 'Encaissement', to: '/caissier/encaissement', icon: Wallet },
    { label: 'Historique',   to: '/caissier/historique',   icon: ClipboardList },
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
  admin: [{ section: 'Administration', items: [
    { label: 'Catalogue', to: '/admin/catalogue', icon: BookOpen },
    { label: 'Caisses',   to: '/admin/caisses',   icon: Wallet },
    { label: 'Comptes',   to: '/admin/comptes',   icon: UserCog },
  ]}],
  auditeur: [{ section: 'Audit', items: [
    { label: 'Relevé',  to: '/auditeur/releve',  icon: ScrollText },
    { label: 'Journal', to: '/auditeur/journal', icon: Activity },
  ]}],
}

const ROLE_BADGE: Record<Role, { bg: string; text: string; label: string }> = {
  admin:       { bg: 'rgba(124,58,237,0.15)', text: '#A78BFA', label: 'Admin' },
  superviseur: { bg: 'rgba(255,203,0,0.15)',  text: '#FFCB00', label: 'Superviseur' },
  caissier:    { bg: 'rgba(16,185,129,0.15)', text: '#34D399', label: 'Caissier' },
  accueil:     { bg: 'rgba(59,130,246,0.15)', text: '#93C5FD', label: 'Accueil' },
  auditeur:    { bg: 'rgba(161,161,170,0.18)',text: '#D4D4D8', label: 'Auditeur' },
}

/* ─── Tooltip (affiché en mode collapsed) ────────── */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 z-50 pointer-events-none whitespace-nowrap"
          >
            <div className="bg-zinc-900 border border-zinc-700 text-zinc-100 text-[12px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl">
              {label}
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1.5 h-1.5 bg-zinc-900 border-l border-b border-zinc-700 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Sidebar Inner ──────────────────────────────── */
function SidebarInner({
  collapsed,
  onToggle,
  onClose,
}: {
  collapsed: boolean
  onToggle?: () => void
  onClose?: () => void
}) {
  const { user, signOut } = useAuth()
  const hasCritique = useAlertStore((s) => s.hasCritique)
  const navigate = useNavigate()

  if (!user) return null
  const badge  = ROLE_BADGE[user.role]
  const groups = NAV[user.role] ?? []
  const W = collapsed ? 60 : 232

  return (
    <motion.aside
      animate={{ width: W }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-[#0F0F0F] border-r border-white/[0.06] overflow-hidden shrink-0"
      style={{ minWidth: W }}
    >
      {/* ── Brand ── */}
      <div className={cn(
        'flex items-center h-14 border-b border-white/[0.06] shrink-0',
        collapsed ? 'justify-center px-0' : 'px-4 gap-3'
      )}>
        <div className="w-7 h-7 rounded-lg bg-[#FFCB00] flex items-center justify-center shrink-0">
          <span className="font-mono font-black text-[10px] text-[#1A1A1A] leading-none">CT</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <p className="text-white text-[13px] font-semibold leading-none whitespace-nowrap">CaisseTrace</p>
              <p className="text-zinc-500 text-[10px] mt-0.5 whitespace-nowrap">Santé 229</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button — desktop only */}
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Développer la barre' : 'Réduire la barre'}
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-md text-zinc-500',
              'hover:text-zinc-200 hover:bg-white/8 transition-all duration-150',
              collapsed && 'absolute right-0 translate-x-0'
            )}
          >
            {collapsed
              ? <PanelLeftOpen size={14} />
              : <PanelLeftClose size={14} />
            }
          </button>
        )}
      </div>

      {/* ── Role badge ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-2.5 border-b border-white/[0.06] shrink-0 overflow-hidden"
          >
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
        {groups.map((group) => (
          <div key={group.section} className="mb-3">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 whitespace-nowrap"
                >
                  {group.section}
                </motion.p>
              )}
            </AnimatePresence>

            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'group relative flex items-center rounded-lg mb-0.5 transition-colors duration-100 cursor-pointer',
                  collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 py-2',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/6 hover:text-zinc-200'
                )}
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#FFCB00] rounded-r-full" />
                    )}

                    {collapsed ? (
                      <Tooltip label={item.label}>
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg relative">
                          <item.icon
                            size={16}
                            className={cn(isActive ? 'text-[#FFCB00]' : 'text-zinc-500 group-hover:text-zinc-300')}
                          />
                          {item.label === 'Alertes' && hasCritique && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />
                          )}
                        </div>
                      </Tooltip>
                    ) : (
                      <>
                        <item.icon
                          size={15}
                          className={cn('shrink-0 transition-colors', isActive ? 'text-[#FFCB00]' : 'text-zinc-500 group-hover:text-zinc-300')}
                        />
                        <span className="text-[13px] font-medium flex-1 whitespace-nowrap overflow-hidden">
                          {item.label}
                        </span>
                        {item.label === 'Alertes' && hasCritique && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot shrink-0" />
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Caisse badge */}
        {user.caisse && (
          <div className="pt-2 border-t border-white/[0.06]">
            {collapsed ? (
              <Tooltip label={user.caisse}>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg mx-auto">
                  <Wallet size={14} className="text-[#FFCB00]" />
                </div>
              </Tooltip>
            ) : (
              <div className="mx-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">Caisse active</p>
                <p className="font-mono text-[11px] text-[#FFCB00] font-semibold truncate">{user.caisse}</p>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── User footer ── */}
      <div className={cn(
        'border-t border-white/[0.06] shrink-0',
        collapsed ? 'py-3 flex flex-col items-center gap-2' : 'px-3 py-3 flex items-center gap-2.5'
      )}>
        {collapsed ? (
          <>
            <Tooltip label={`${user.nom} — ${user.role}`}>
              <div className="w-8 h-8 rounded-full bg-[#FFCB00] flex items-center justify-center cursor-default">
                <span className="font-mono font-black text-[10px] text-[#1A1A1A]">{user.initiales}</span>
              </div>
            </Tooltip>
            <Tooltip label="Se déconnecter">
              <button
                onClick={() => { signOut(); navigate('/login') }}
                aria-label="Se déconnecter"
                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={13} />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-[#FFCB00] flex items-center justify-center shrink-0">
              <span className="font-mono font-black text-[10px] text-[#1A1A1A]">{user.initiales}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-200 text-[12px] font-semibold truncate leading-none">{user.nom}</p>
              <p className="text-zinc-500 text-[10px] capitalize mt-0.5">{user.role}</p>
            </div>
            <button
              onClick={() => { signOut(); navigate('/login') }}
              aria-label="Se déconnecter"
              className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
            >
              <LogOut size={13} />
            </button>
          </>
        )}
      </div>
    </motion.aside>
  )
}

/* ─── Export principal ───────────────────────────── */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">
        <SidebarInner
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu"
        className="lg:hidden fixed top-4 left-4 z-40 w-8 h-8 rounded-xl bg-[#0F0F0F] border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center shadow-lg transition-colors"
      >
        <Menu size={15} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex h-full"
            >
              <SidebarInner collapsed={false} onClose={() => setMobileOpen(false)} />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
                className="absolute top-4 right-[-38px] w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
