import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { formatCFA } from '@/lib/formatCFA'
import { useCounter } from '@/hooks/useCounter'

type MoneyVariant = 'normal' | 'kpi' | 'locked' | 'positive' | 'negative' | 'diff'

interface MoneyDisplayProps {
  amount: number
  variant?: MoneyVariant
  className?: string
  animate?: boolean
}

const variantClass: Record<Exclude<MoneyVariant, 'diff'>, string> = {
  normal:   'font-mono font-bold text-[14px] text-zinc-900',
  kpi:      'font-mono font-bold text-[28px] text-zinc-900 tabular-nums',
  locked:   'font-mono font-bold text-[14px] text-zinc-900 bg-[#FAFAFA] border-l-[3px] border-[#FFCB00] px-3 py-1.5 rounded-sm',
  positive: 'font-mono font-bold text-[14px] text-[#166534]',
  negative: 'font-mono font-bold text-[14px] text-[#991B1B] line-through',
}

function KpiDisplay({ amount }: { amount: number }) {
  const displayed = useCounter(amount, 600)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.classList.add('animate-count-up')
  }, [])
  return (
    <span ref={ref} className="font-mono font-bold text-[28px] text-zinc-900 tabular-nums">
      {formatCFA(displayed)}
    </span>
  )
}

export function MoneyDisplay({ amount, variant = 'normal', className, animate }: MoneyDisplayProps) {
  if (variant === 'kpi' && animate) return <KpiDisplay amount={amount} />

  const cls = variant === 'diff'
    ? cn('font-mono font-bold text-[14px]', amount === 0 ? 'text-[#166534]' : 'text-[#991B1B]')
    : variantClass[variant]

  return (
    <span className={cn(cls, className)}>
      {amount < 0 ? `−${formatCFA(Math.abs(amount))}` : formatCFA(amount)}
    </span>
  )
}
