import { cn } from '@/lib/utils'

type StatusVariant = 'solde' | 'attente' | 'partiel' | 'critique' | 'haute' | 'moyenne' | 'verrouille' | 'lecture'

interface StatusBadgeProps {
  variant: StatusVariant
  className?: string
}

const VARIANTS: Record<StatusVariant, { bg: string; text: string; dot: string; label: string }> = {
  solde:      { bg: '#F0FDF4', text: '#166534', dot: '#22C55E', label: 'Soldé' },
  attente:    { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'En attente' },
  partiel:    { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Partiel' },
  critique:   { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Critique' },
  haute:      { bg: '#FEF2F2', text: '#991B1B', dot: '#F97316', label: 'Haute' },
  moyenne:    { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'Moyenne' },
  verrouille: { bg: '#F4F4F5', text: '#3F3F46', dot: '#A1A1AA', label: 'Verrouillé' },
  lecture:    { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Lecture seule' },
}

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  const v = VARIANTS[variant]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.06em] uppercase', className)}
      style={{ backgroundColor: v.bg, color: v.text }}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', variant === 'critique' && 'animate-pulse-dot')}
        style={{ backgroundColor: v.dot }}
      />
      {v.label}
    </span>
  )
}
