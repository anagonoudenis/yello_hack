export type MobileMoneyOperator = 'MTN' | 'MOOV' | 'CELTIIS'

const PREFIX_TO_OPERATOR: Record<string, MobileMoneyOperator> = {
  '40': 'CELTIIS',
  '41': 'CELTIIS',
  '42': 'MTN',
  '43': 'CELTIIS',
  '44': 'CELTIIS',
  '45': 'MOOV',
  '46': 'MTN',
  '47': 'CELTIIS',
  '50': 'MTN',
  '51': 'MTN',
  '52': 'MTN',
  '53': 'MTN',
  '54': 'MTN',
  '55': 'MOOV',
  '56': 'MTN',
  '57': 'MTN',
  '58': 'MOOV',
  '59': 'MTN',
  '60': 'MOOV',
  '61': 'MTN',
  '62': 'MTN',
  '63': 'MOOV',
  '64': 'MOOV',
  '65': 'MOOV',
  '66': 'MTN',
  '67': 'MTN',
  '68': 'MOOV',
  '69': 'MTN',
  '90': 'MTN',
  '91': 'MTN',
  '94': 'MOOV',
  '95': 'MOOV',
  '96': 'MTN',
  '97': 'MTN',
  '98': 'MOOV',
  '99': 'MOOV',
}

export function normalizeBeninPhone(phone: string): string {
  const digits = phone.replace(/\D+/g, '')
  if (digits.length === 8) return `229${digits}`
  if (digits.length === 10 && digits.startsWith('01')) return `229${digits}`
  return digits
}

export function deduceOperatorFromPhone(phone: string): MobileMoneyOperator | null {
  const normalized = normalizeBeninPhone(phone)
  let local = normalized

  if (normalized.startsWith('22901') && normalized.length === 13) {
    local = normalized.slice(3)
  } else if (normalized.startsWith('229') && normalized.length === 11) {
    local = normalized.slice(3)
  }

  const prefix = local.length === 10 && local.startsWith('01') ? local.slice(2, 4) : local.slice(0, 2)
  return PREFIX_TO_OPERATOR[prefix] ?? null
}

