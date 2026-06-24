import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  badge?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, badge, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-7', className)}>
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-[22px] font-bold text-zinc-900 leading-tight">{title}</h1>
          {badge && badge}
        </div>
        {subtitle && <p className="text-[13px] text-zinc-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 ml-4">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub, accent, icon: Icon }: {
  label: string; value: ReactNode; sub?: string; accent?: boolean; icon?: React.ElementType
}) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border p-5',
      accent ? 'border-t-2 border-t-[#FFCB00] border-zinc-200' : 'border-zinc-200'
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</p>
        {Icon && <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-100"><Icon size={13} className="text-zinc-400" /></div>}
      </div>
      <div className="text-[26px] font-black text-zinc-900 leading-none font-mono">{value}</div>
      {sub && <p className="text-[12px] text-zinc-400 mt-2">{sub}</p>}
    </div>
  )
}

export function Btn({ children, variant = 'primary', icon: Icon, onClick, disabled, type = 'button', className, form }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: React.ElementType; onClick?: () => void; disabled?: boolean
  type?: 'button' | 'submit'; className?: string; form?: string
}) {
  const base = 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-[#FFCB00] hover:bg-[#EDBA00] active:scale-[0.98] text-[#1A1A1A] shadow-sm',
    secondary: 'bg-zinc-900 hover:bg-zinc-700 text-white shadow-sm',
    ghost:     'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200',
    danger:    'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled} className={cn(base, variants[variant], className)}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  )
}
