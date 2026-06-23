import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'elevated' | 'bordered' | 'accent' | 'dark'
type Padding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps {
  variant?: Variant
  padding?: Padding
  children: ReactNode
  className?: string
  onClick?: () => void
}

const variantCls: Record<Variant, string> = {
  default:  'bg-white border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
  elevated: 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] border border-white/60',
  bordered: 'bg-white border-2 border-zinc-200',
  accent:   'bg-white border border-zinc-200 border-t-2 border-t-[#FFCB00] shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
  dark:     'bg-[#111111] border border-white/8',
}

const paddingCls: Record<Padding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6 lg:p-7',
}

export function Card({ variant = 'default', padding = 'md', children, className, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'rounded-2xl', variantCls[variant], paddingCls[padding],
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-150 text-left w-full',
        className
      )}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, icon: Icon }: {
  title: string; subtitle?: string; action?: ReactNode; icon?: React.ElementType
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
            <Icon size={15} className="text-zinc-500" />
          </div>
        )}
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900 leading-none">{title}</h2>
          {subtitle && <p className="text-[12px] text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
