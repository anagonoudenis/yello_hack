import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Toast, ToastVariant } from '@/hooks/useToast'
import { useNotification } from '@/context/NotificationContext'

const CONFIG: Record<ToastVariant, { Icon: typeof CheckCircle; iconColor: string; border: string; bg: string }> = {
  success: { Icon: CheckCircle,   iconColor: '#22C55E', border: '#BBF7D0', bg: '#F0FDF4' },
  warning: { Icon: AlertTriangle, iconColor: '#F59E0B', border: '#FDE68A', bg: '#FFFBEB' },
  error:   { Icon: XCircle,       iconColor: '#EF4444', border: '#FECACA', bg: '#FEF2F2' },
  info:    { Icon: Info,          iconColor: '#3B82F6', border: '#BFDBFE', bg: '#EFF6FF' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100)
  const { Icon, iconColor, border, bg } = CONFIG[toast.variant]

  useEffect(() => {
    const start = performance.now()
    const frame = requestAnimationFrame(function tick(now) {
      const elapsed = now - start
      setProgress(Math.max(0, 100 - (elapsed / 4000) * 100))
      if (elapsed < 4000) requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className="animate-toast relative overflow-hidden rounded-xl border shadow-lg w-[360px] max-w-[calc(100vw-32px)]"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={18} className="flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-900">{toast.titre}</p>
          {toast.message && <p className="text-[13px] text-zinc-600 mt-0.5">{toast.message}</p>}
        </div>
        <button onClick={() => onDismiss(toast.id)} aria-label="Fermer" className="text-zinc-400 hover:text-zinc-700 transition-colors duration-75">
          <X size={15} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 transition-none" style={{ width: `${progress}%`, backgroundColor: iconColor }} />
    </div>
  )
}

export function ToastContainer() {
  const { toasts, dismiss } = useNotification()
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
