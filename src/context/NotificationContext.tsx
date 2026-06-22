import { createContext, useContext, type ReactNode } from 'react'
import { useToast, type Toast, type ToastVariant } from '@/hooks/useToast'

interface NotificationContextValue {
  toasts: Toast[]
  toast: (variant: ToastVariant, titre: string, message?: string) => void
  dismiss: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, removeToast } = useToast()

  return (
    <NotificationContext.Provider value={{ toasts, toast: addToast, dismiss: removeToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}
