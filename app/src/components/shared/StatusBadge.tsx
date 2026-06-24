import { cn } from '@/lib/utils'

type StatusVariant =
  | 'solde'
  | 'attente'
  | 'encaisse'
  | 'partiel'
  | 'non_solde'
  | 'tentative'
  | 'critique'
  | 'haute'
  | 'moyenne'
  | 'verrouille'
  | 'lecture'

interface StatusBadgeProps {
  variant: StatusVariant
  className?: string
}

const VARIANTS: Record<StatusVariant, { bg: string; text: string; dot: string; label: string }> = {
  solde: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E', label: 'Solde' },
  attente: { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'En attente' },
  encaisse: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', label: 'En caisse' },
  partiel: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Partiel' },
  non_solde: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', label: 'Non solde' },
  tentative: { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'Tentative non aboutie' },
  critique: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Critique' },
  haute: { bg: '#FEF2F2', text: '#991B1B', dot: '#F97316', label: 'Haute' },
  moyenne: { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'Moyenne' },
  verrouille: { bg: '#F4F4F5', text: '#3F3F46', dot: '#A1A1AA', label: 'Verrouille' },
  lecture: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Lecture seule' },
}

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  const v = VARIANTS[variant]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]', className)}
      style={{ backgroundColor: v.bg, color: v.text }}
    >
      <span
        className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', variant === 'critique' && 'animate-pulse-dot')}
        style={{ backgroundColor: v.dot }}
      />
      {v.label}
    </span>
  )
}
