const toDate = (date: Date | string): Date => (typeof date === 'string' ? new Date(date) : date)

export const formatDate = (date: Date | string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(toDate(date))

export const formatTime = (date: Date | string): string =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(toDate(date))
