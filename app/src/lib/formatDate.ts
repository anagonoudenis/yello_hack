const toDate = (value: unknown): Date | null => {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value as string)
  return isNaN(d.getTime()) ? null : d
}

export const formatDate = (value: unknown): string => {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export const formatTime = (value: unknown): string => {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
}

export const formatDateShort = (value: unknown): string => {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d)
}
