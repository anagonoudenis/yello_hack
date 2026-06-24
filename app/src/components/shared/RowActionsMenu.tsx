import { useEffect, useMemo, useRef, useState } from 'react'
import { MoreVertical, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RowActionItem {
  label: string
  onSelect: () => void | Promise<void>
  icon?: LucideIcon
  tone?: 'default' | 'danger' | 'success' | 'warning'
  hidden?: boolean
  disabled?: boolean
}

interface RowActionsMenuProps {
  actions: RowActionItem[]
}

const TONE_CLASS: Record<NonNullable<RowActionItem['tone']>, string> = {
  default: 'text-zinc-700 hover:bg-zinc-100',
  danger: 'text-red-600 hover:bg-red-50',
  success: 'text-emerald-700 hover:bg-emerald-50',
  warning: 'text-amber-700 hover:bg-amber-50',
}

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const visibleActions = useMemo(
    () => actions.filter((action) => !action.hidden),
    [actions],
  )

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  if (visibleActions.length === 0) return null

  return (
    <div ref={rootRef} className="relative inline-flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Ouvrir les actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          {visibleActions.map((action) => {
            const Icon = action.icon

            return (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={async () => {
                  setOpen(false)
                  await action.onSelect()
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  TONE_CLASS[action.tone ?? 'default'],
                )}
              >
                {Icon && <Icon size={14} />}
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
