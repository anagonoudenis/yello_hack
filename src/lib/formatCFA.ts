export const formatCFA = (amount: number): string =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
    .format(Math.round(amount)) + ' FCFA'
