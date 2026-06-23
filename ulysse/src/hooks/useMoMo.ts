import { useState } from 'react'

export type MoMoStatus = 'idle' | 'pending' | 'confirmed' | 'failed'

export function useMoMo() {
  const [status, setStatus] = useState<MoMoStatus>('idle')
  const [ref, setRef] = useState<string | null>(null)

  const initier = (montant: number, telephone: string): void => {
    if (!telephone || montant <= 0) return
    setStatus('pending')
    setRef(null)
    setTimeout(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      setRef(`MTN-2026-749-${code}`)
      setStatus('confirmed')
    }, 2500)
  }

  const reset = () => { setStatus('idle'); setRef(null) }

  return { status, ref, initier, reset }
}
