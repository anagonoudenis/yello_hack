import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type OverlayVariant = 'modal' | 'drawer'

interface OverlayPanelProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
  variant?: OverlayVariant
  widthClassName?: string
}

export function OverlayPanel({
  open,
  title,
  subtitle,
  onClose,
  children,
  actions,
  variant = 'modal',
  widthClassName,
}: OverlayPanelProps) {
  useEffect(() => {
    if (!open) return undefined

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]">
      <div
        className={`absolute inset-0 ${variant === 'drawer' ? 'flex justify-end' : 'flex items-center justify-center p-4'}`}
        onClick={onClose}
      >
        <div
          className={[
            'overflow-hidden border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]',
            variant === 'drawer'
              ? `h-full w-full max-w-2xl rounded-none ${widthClassName ?? ''}`
              : `w-full rounded-2xl ${widthClassName ?? 'max-w-2xl'}`,
          ].join(' ')}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
            <div>
              <h2 className="text-[16px] font-bold text-zinc-900">{title}</h2>
              {subtitle && <p className="mt-1 text-[12px] text-zinc-400">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          <div className={variant === 'drawer' ? 'h-[calc(100vh-74px)] overflow-y-auto' : 'max-h-[80vh] overflow-y-auto'}>
            <div className="p-5">{children}</div>
          </div>

          {actions && (
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
